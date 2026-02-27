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

// Get adaptive pedagogy recommendation
router.post('/recommend', async (req, res) => {
  try {
    const { subject, topic, grade, complexity, creativityLevel, educationLevel } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({ error: 'Subject and topic are required' });
    }

    if (!genAI) {
      return res.status(500).json({ error: 'AI service not available' });
    }

    // Try multiple models for better compatibility
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
            generationConfig: {
              temperature: 0.7
            }
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

    const prompt = `You are an expert educational pedagogue. Analyze the following topic and recommend the best teaching approach.

Topic Metadata:
- Subject: ${subject}
- Topic: ${topic}
- Grade/Level: ${grade || 'Not specified'}
- Education Level: ${educationLevel || 'school'}
${complexity ? `- Complexity: ${complexity}` : ''}
${creativityLevel ? `- Creativity Level: ${creativityLevel}` : ''}

Based on pedagogical research and best practices, recommend the most effective teaching strategy for this topic. Consider:
1. The nature of the topic (conceptual, procedural, factual, etc.)
2. The grade/age level
3. Cognitive load considerations
4. Engagement requirements
5. Learning objectives alignment

Return a JSON object with this structure:
{
  "recommendedApproach": "<teaching approach name>",
  "alternativeApproaches": ["<approach1>", "<approach2>", "<approach3>"],
  "reasoning": "<detailed explanation of why this approach is recommended for this specific topic>",
  "pedagogicalRationale": "<educational theory and research supporting this recommendation>",
  "implementationTips": ["<tip1>", "<tip2>", "<tip3>"],
  "suitabilityScore": <0-100>,
  "keyConsiderations": ["<consideration1>", "<consideration2>"]
}

Teaching approaches to consider: discussion-based, demonstration, project-based learning, flipped classroom, inquiry-based, visual inquiry, hands-on, lecture, collaborative learning, problem-based learning, gamification, storytelling, case study method.

Return ONLY the JSON object, no markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Clean up response
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    let recommendation;
    try {
      recommendation = JSON.parse(text);
    } catch (parseError) {
      console.error('Pedagogy recommendation JSON parse error:', parseError);
      console.error('Response text:', text);
      throw new Error('Failed to parse pedagogy recommendation. Please try again.');
    }

    res.json({
      success: true,
      recommendation
    });
  } catch (error) {
    console.error('Pedagogy recommendation error:', error);
    res.status(500).json({
      error: 'Failed to get pedagogy recommendation',
      message: error.message
    });
  }
});

export default router;

