import express from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to get user from request
router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
});

const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error('⚠️  GROQ_API_KEY not found in environment variables');
}

// Analyze cognitive load of a lesson plan
router.post('/analyze/:planId', async (req, res) => {
  try {
    const { planId } = req.params;

    if (!GROQ_API_KEY) {
      return res.status(500).json({ 
        error: 'API service not configured',
        message: 'GROQ_API_KEY is not set in environment variables'
      });
    }

    const plan = await prisma.lessonPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }

    // Check permissions
    if (req.user.role === 'teacher' && plan.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const planContent = typeof plan.content === 'object' 
      ? JSON.stringify(plan.content, null, 2)
      : plan.content?.toString() || '';

    const prompt = `Analyze this lesson plan for cognitive load. Return only a JSON object with these fields:
- overallLoad: "low", "moderate", "high", or "overload"
- loadScore: number 0-100
- intrinsicLoad: { score: 0-100, complexity: "low"/"moderate"/"high", assessment: "brief text" }
- extraneousLoad: { score: 0-100, issues: ["issue1", "issue2"], assessment: "brief text" }
- germaneLoad: { score: 0-100, strengths: ["strength1", "strength2"], assessment: "brief text" }
- recommendations: [ { issue: "text", suggestion: "text", priority: "high"/"medium"/"low" } ]

Lesson Plan:
Title: ${plan.title}
Subject: ${plan.subject}
Grade: ${plan.grade}
Duration: ${plan.duration || 45}min
Content: ${planContent}

Return ONLY valid JSON, no markdown.`;

    console.log(`📥 Cognitive load analysis request for plan: ${planId}`);
    console.log(`📤 Sending analysis request to Groq API...`);
    console.log(`🔑 Using API Key: ${GROQ_API_KEY?.substring(0, 10)}...`);
    console.log(`🌐 API URL: ${GROQ_API_URL}`);

    let response;
    try {
      console.log('⏱️  Starting Groq API request with 30s timeout...');
      response = await axios.post(
        GROQ_API_URL,
        {
          model: 'mixtral-8x7b-32768',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 800,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
      console.log('✅ Groq API response received');
    } catch (error) {
      console.error('❌ Groq API error:', error.code, error.message);
      
      // If mixtral model is decommissioned or 400 error, try llama
      if (error.message?.includes('decommissioned') || error.response?.status === 410 || error.response?.status === 400) {
        console.log('⚠️  Mixtral model decommissioned, trying Llama model...');
        response = await axios.post(
          GROQ_API_URL,
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            max_tokens: 800,
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );
      } else if (error.code === 'ECONNABORTED') {
        console.error('❌ Request timeout - API took too long to respond');
        throw new Error('API request timeout - service is slow, please try again');
      } else {
        throw error;
      }
    }

    let text = response.data.choices[0].message.content.trim();
    console.log('✅ Cognitive load analysis response received');

    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    let analysis;
    try {
      analysis = JSON.parse(text);
      console.log('✅ Analysis JSON parsed successfully');
    } catch (parseError) {
      console.error('❌ Cognitive load analysis JSON parse error:', parseError.message);
      console.error('Response text:', text.substring(0, 200));
      
      // Try to fix common JSON issues
      try {
        const fixedText = text.replace(/:\s*undefined/g, ': null')
                             .replace(/:\s*NaN/g, ': null')
                             .replace(/,\s*}/g, '}')
                             .replace(/,\s*]/g, ']');
        analysis = JSON.parse(fixedText);
        console.log('✅ Analysis JSON fixed and parsed successfully');
      } catch (secondError) {
        console.error('❌ JSON fix failed:', secondError.message);
        throw new Error('Failed to parse cognitive load analysis. Please try again.');
      }
    }

    console.log(`✅ Cognitive load analysis complete`);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('❌ Cognitive load analysis error:', error.message);
    
    // Check if it's an API key error
    const isAPIKeyError = error.message?.includes('API_KEY') || 
                          error.message?.includes('API key') ||
                          error.message?.includes('401') ||
                          error.message?.includes('403') ||
                          error.response?.status === 401;
    
    if (isAPIKeyError) {
      return res.status(401).json({
        error: 'API key expired or invalid',
        message: 'The API key has expired. Please update GROQ_API_KEY in .env file.',
        suggestion: 'Get a new API key from https://console.groq.com/keys',
        retryable: false
      });
    }
    
    res.status(500).json({
      error: 'Failed to analyze cognitive load',
      message: error.message
    });
  }
});

export default router;

