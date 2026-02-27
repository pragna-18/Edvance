import express from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to get user from request
router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
});

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDEIGf1uBs5sjn-zt0e3pBjgmBt5NrGM2s";
const genAI = new GoogleGenerativeAI(API_KEY);

// Analyze teacher's teaching style from their lesson plans
router.post('/analyze-style/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Only allow users to analyze their own style or admins
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user's lesson plans
    const plans = await prisma.lessonPlan.findMany({
      where: {
        creatorId: userId,
        content: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: 20 // Analyze last 20 plans
    });

    if (plans.length === 0) {
      return res.json({
        success: true,
        message: 'Not enough lesson plans to analyze style. Create more plans first.',
        styleProfile: null
      });
    }

    if (!genAI) {
      return res.status(500).json({ error: 'AI service not available' });
    }

    // Try multiple models
    let model;
    const modelNames = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp',
      'gemini-flash-latest'
    ];
    
    let lastError = null;
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json'
          }
        });
        break;
      } catch (error) {
        lastError = error;
        try {
          model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: { temperature: 0.7 }
          });
          break;
        } catch (e) {
          continue;
        }
      }
    }
    
    if (!model) {
      throw new Error(`Failed to initialize any model. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    // Prepare lesson plans data for analysis
    const plansData = plans.map(plan => ({
      title: plan.title,
      subject: plan.subject,
      topic: plan.topic,
      grade: plan.grade,
      content: plan.content
    }));

    const prompt = `You are an expert educational analyst. Analyze the following collection of lesson plans created by the same teacher to identify their unique teaching style and preferences.

Lesson Plans (${plans.length} plans):
${JSON.stringify(plansData, null, 2)}

Analyze the teacher's teaching style by examining:
1. **Tone and Language**: Formal vs. casual, technical vs. simple
2. **Structure Preference**: How they organize content
3. **Instructional Methods**: Preferred teaching approaches (discussion, demonstration, hands-on, etc.)
4. **Activity Types**: Types of activities they commonly use
5. **Assessment Style**: How they assess learning
6. **Engagement Strategies**: How they engage students
7. **Content Depth**: Level of detail and complexity
8. **Visual vs. Textual**: Preference for visuals, diagrams, or text-heavy content

Return a JSON object with this structure:
{
  "teachingStyle": {
    "tone": "<formal/casual/mixed>",
    "structurePreference": "<detailed/concise/moderate>",
    "preferredMethods": ["<method1>", "<method2>", "<method3>"],
    "activityTypes": ["<type1>", "<type2>"],
    "assessmentStyle": "<description>",
    "engagementLevel": "<high/moderate/low>",
    "contentDepth": "<deep/moderate/surface>",
    "visualPreference": "<high/moderate/low>"
  },
  "styleSignature": "<a brief description of this teacher's unique style>",
  "recommendations": ["<recommendation1>", "<recommendation2>"],
  "confidence": <0-100>
}

Return ONLY the JSON object, no markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    let styleProfile;
    try {
      styleProfile = JSON.parse(text);
    } catch (parseError) {
      console.error('Style analysis JSON parse error:', parseError);
      throw new Error('Failed to parse style analysis. Please try again.');
    }

    // Store style profile - for now, we'll store it in activity metadata
    // In production, you'd want to add a teachingStyleProfile field to User model
    await prisma.activity.create({
      data: {
        userId: userId,
        action: 'teaching_style_analyzed',
        description: 'Teaching style profile generated',
        metadata: {
          styleProfile,
          analyzedAt: new Date().toISOString(),
          plansAnalyzed: plans.length
        }
      }
    });

    res.json({
      success: true,
      styleProfile,
      plansAnalyzed: plans.length
    });
  } catch (error) {
    console.error('Style analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze teaching style',
      message: error.message
    });
  }
});

// Get teacher's style profile
router.get('/style/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get most recent style analysis from activities
    const styleActivity = await prisma.activity.findFirst({
      where: {
        userId: userId,
        action: 'teaching_style_analyzed'
      },
      orderBy: { createdAt: 'desc' },
      select: {
        metadata: true,
        createdAt: true
      }
    });

    if (!styleActivity || !styleActivity.metadata?.styleProfile) {
      return res.json({
        success: true,
        styleProfile: null,
        message: 'Style profile not yet analyzed. Run analysis first.'
      });
    }

    res.json({
      success: true,
      styleProfile: styleActivity.metadata.styleProfile,
      analyzedAt: styleActivity.createdAt
    });
  } catch (error) {
    console.error('Get style profile error:', error);
    res.status(500).json({
      error: 'Failed to get style profile',
      message: error.message
    });
  }
});

export default router;

