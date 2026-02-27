import express from 'express';
import { body, validationResult } from 'express-validator';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { generateWithRetry } from '../utils/geminiRetry.js';
import { generateLessonPlanWithAI, getAvailableModels, validateModel } from '../utils/aiModelSelector.js';

const router = express.Router();
const prisma = new PrismaClient();

// Use API key from environment variable or fallback to hardcoded one
const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY || "AIzaSyDEIGf1uBs5sjn-zt0e3pBjgmBt5NrGM2s";
  console.log('Gemini API Key loaded:', key ? `${key.substring(0, 10)}...` : 'NOT FOUND');
  return key;
};

const API_KEY = getApiKey();

if (!API_KEY || API_KEY.trim() === '') {
  console.error('ERROR: GEMINI_API_KEY is not set or is empty. AI generation will fail.');
}

let genAI;
try {
  genAI = new GoogleGenerativeAI(API_KEY);
  console.log('GoogleGenerativeAI initialized successfully');
} catch (error) {
  console.error('Failed to initialize GoogleGenerativeAI:', error);
}

const getModel = (useJsonMode = false) => {
  if (!genAI) {
    throw new Error('GoogleGenerativeAI not initialized. Check API key.');
  }
  
  // Use the most reliable model
  const modelName = 'gemini-2.0-flash';
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7
      }
    });
    console.log(`✅ Model initialized: ${modelName}`);
    return { model, useJson: false, modelName };
  } catch (error) {
    console.error(`❌ Failed to initialize model ${modelName}:`, error.message);
    throw new Error(`Model initialization failed: ${error.message}. Please check your API key.`);
  }
};

// Generate lesson plan
router.post('/generatePlan', [
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  body('educationLevel').optional().trim().isIn(['school', 'college']).withMessage('Education level must be school or college'),
  body('grade').optional().trim(),
  body('fieldOfStudy').optional().trim(),
  body('year').optional().trim(),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive number'),
  body('approach').optional().trim(),
  body('aiModel').optional().trim().isIn(['gemini', 'groq']).withMessage('AI model must be gemini or groq')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!API_KEY || API_KEY.trim() === '') {
      console.error('API Key check failed:', { hasKey: !!API_KEY, keyLength: API_KEY?.length });
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY is not configured. Please set it in the server .env file and restart the server.' 
      });
    }

    if (!genAI) {
      console.error('GoogleGenerativeAI not initialized');
      return res.status(500).json({ 
        error: 'AI service not initialized. Please check server configuration.' 
      });
    }

    const { subject, topic, educationLevel = 'school', grade, fieldOfStudy, year, duration = 45, approach = 'interactive', includeCaseStudies = false, includeDiscussionQuestions = false, aiModel = 'gemini' } = req.body;

    // Validate selected AI model
    try {
      validateModel(aiModel);
      console.log(`✅ AI Model validated: ${aiModel}`);
    } catch (error) {
      return res.status(400).json({
        error: error.message,
        availableModels: getAvailableModels()
      });
    }

    // Get teacher's personalized style if available
    let personalizedStyle = null;
    try {
      // Get user's recent plans to infer style
      const userPlans = await prisma.lessonPlan.findMany({
        where: {
          creatorId: req.user.id
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          content: true
        }
      });

      if (userPlans.length >= 3) {
        // Get style profile from activities if available
        const styleActivity = await prisma.activity.findFirst({
          where: {
            userId: req.user.id,
            action: 'teaching_style_analyzed'
          },
          orderBy: { createdAt: 'desc' },
          select: {
            metadata: true
          }
        });

        if (styleActivity?.metadata?.styleProfile) {
          const styleProfile = styleActivity.metadata.styleProfile;
          personalizedStyle = {
            preferredMethods: styleProfile.teachingStyle?.preferredMethods || [],
            tone: styleProfile.teachingStyle?.tone || 'mixed',
            structurePreference: styleProfile.teachingStyle?.structurePreference || 'moderate',
            inferredFromPlans: userPlans.length,
            confidence: styleProfile.confidence || 70
          };
        }
      }
    } catch (error) {
      console.error('Error fetching personalized style:', error);
      // Continue without personalization
    }

    // Additional validation based on education level
    if (educationLevel === 'school' && !grade) {
      return res.status(400).json({ 
        error: 'Grade is required for school level education' 
      });
    }
    if (educationLevel === 'college') {
      if (!fieldOfStudy) {
        return res.status(400).json({ 
          error: 'Field of study is required for college level education' 
        });
      }
      if (!year) {
        return res.status(400).json({ 
          error: 'Year level is required for college level education' 
        });
      }
    }

    // Construct level description based on education level
    let levelDescription;
    let levelLabel;
    if (educationLevel === 'college' && fieldOfStudy && year) {
      levelDescription = `${fieldOfStudy} - ${year}`;
      levelLabel = `Field of Study: ${fieldOfStudy}, Year Level: ${year}`;
    } else if (educationLevel === 'school' && grade) {
      levelDescription = grade;
      levelLabel = `Grade Level: ${grade}`;
    } else {
      // Fallback for backward compatibility
      levelDescription = grade || 'Not specified';
      levelLabel = `Level: ${levelDescription}`;
    }

    // Determine context for the prompt
    const isCollege = educationLevel === 'college';
    const contextInstruction = isCollege 
      ? `This is a COLLEGE/UNIVERSITY level lesson plan for ${fieldOfStudy} students in ${year}. The content should be appropriate for higher education, with more advanced concepts, critical thinking, and academic rigor. Include references to academic sources, research methods, and professional applications where relevant.`
      : `This is a SCHOOL level lesson plan for ${grade}. The content should be age-appropriate and aligned with K-12 educational standards.`;

    // Build additional sections based on options
    let additionalSections = '';
    if (includeCaseStudies && includeDiscussionQuestions) {
      additionalSections += '  "caseStudies": [\n    {\n      "title": "Case study title",\n      "description": "Detailed case study description relevant to the topic",\n      "questions": ["Question 1 for analysis", "Question 2 for analysis"]\n    }\n  ],\n  "discussionQuestions": [\n    "Discussion question 1 that promotes critical thinking",\n    "Discussion question 2 that encourages debate",\n    "Discussion question 3 that connects to real-world applications"\n  ]\n';
    } else if (includeCaseStudies) {
      additionalSections += '  "caseStudies": [\n    {\n      "title": "Case study title",\n      "description": "Detailed case study description relevant to the topic",\n      "questions": ["Question 1 for analysis", "Question 2 for analysis"]\n    }\n  ]\n';
    } else if (includeDiscussionQuestions) {
      additionalSections += '  "discussionQuestions": [\n    "Discussion question 1 that promotes critical thinking",\n    "Discussion question 2 that encourages debate",\n    "Discussion question 3 that connects to real-world applications"\n  ]\n';
    }

    const personalizedInstruction = personalizedStyle 
      ? `\n\nPERSONALIZATION: This teacher's style profile (based on ${personalizedStyle.inferredFromPlans} previous plans):
- Preferred Methods: ${personalizedStyle.preferredMethods?.join(', ') || 'various'}
- Tone: ${personalizedStyle.tone}
- Structure: ${personalizedStyle.structurePreference}
Adapt the lesson plan to match this teacher's style while maintaining educational quality.`
      : '';

    const prompt = `You are an intelligent teaching assistant. Generate a structured lesson plan in JSON format ONLY. Do not include any markdown, explanations, or text outside the JSON object.

${contextInstruction}${personalizedInstruction}

Input Parameters:
- Subject: ${subject}
- Topic: ${topic}
- ${levelLabel}
- Duration: ${duration} minutes
- Teaching Approach: ${approach}
${isCollege ? `- Field of Study: ${fieldOfStudy}\n- Year Level: ${year}` : ''}
${includeCaseStudies ? '- Include Case Studies: Yes' : ''}
${includeDiscussionQuestions ? '- Include Discussion Questions: Yes' : ''}

Return ONLY a valid JSON object with this exact structure (no markdown code blocks, no explanations, just the JSON):
{
  "lessonTitle": "A clear, engaging lesson title appropriate for ${isCollege ? 'college/university' : 'school'} level",
  "grade": "${levelDescription}",
  "duration": ${duration},
  "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"],
  "materialsRequired": ["Material 1", "Material 2", "Material 3"],
  "lessonFlow": {
    "introduction": "Detailed introduction to engage ${isCollege ? 'college' : 'school'} students",
    "activities": ["Activity 1 description", "Activity 2 description", "Activity 3 description"],
    "wrapUp": "Summary and conclusion of the lesson"
  },
  "assessment": "How student learning will be assessed${isCollege ? ' (include rubrics, grading criteria, or evaluation methods appropriate for higher education)' : ''}",
  "homework": "Optional homework assignment related to the lesson${isCollege ? ' (may include research, case studies, or advanced problem sets)' : ''}",
  "summary": "Brief summary of what was covered"${additionalSections ? ',' : ''}
${additionalSections}
}

Important: 
${includeCaseStudies ? '- Include 1-2 relevant case studies that connect to the topic and promote critical thinking.\n' : ''}${includeDiscussionQuestions ? '- Include 3-5 discussion questions that encourage student engagement and deeper understanding.\n' : ''}Return ONLY the JSON object. No markdown, no code blocks, no explanations. Just the raw JSON.`;

    console.log('Attempting to generate lesson plan with:', { subject, topic, educationLevel, grade, fieldOfStudy, year, duration, approach, aiModel });
    
    let responseText;
    try {
      console.log(`📤 Sending request to ${aiModel.toUpperCase()} API...`);
      responseText = await generateLessonPlanWithAI(aiModel, prompt);
      console.log(`📥 Received response from ${aiModel.toUpperCase()} API`);
    } catch (apiError) {
      console.error(`❌ ${aiModel} API call failed:`, apiError);
      
      return res.status(500).json({
        error: `Failed to generate lesson plan using ${aiModel}`,
        message: apiError.message || 'Unknown error from AI service',
        details: process.env.NODE_ENV === 'development' ? apiError.toString() : undefined
      });
    }

    let text = responseText.trim();
    
    // Remove markdown code blocks if present
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    text = text.trim();
    
    // Remove any leading/trailing text that's not JSON
    // Try to find JSON object in the response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    // Parse JSON with better error handling
    let lessonPlan;
    try {
      lessonPlan = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Response text:', text.substring(0, 500));
      
      // Try to fix common JSON issues
      try {
        // Remove trailing commas
        text = text.replace(/,(\s*[}\]])/g, '$1');
        lessonPlan = JSON.parse(text);
      } catch (secondParseError) {
        // Last resort: create a structured response from the text
        console.error('Second parse attempt failed:', secondParseError);
        throw new Error(`Failed to parse AI response as JSON: ${parseError.message}. Response preview: ${text.substring(0, 200)}`);
      }
    }
    
    // Validate that we have at least the required fields
    if (!lessonPlan.lessonTitle) {
      lessonPlan.lessonTitle = `${subject}: ${topic}`;
    }
    if (!lessonPlan.learningObjectives || !Array.isArray(lessonPlan.learningObjectives)) {
      lessonPlan.learningObjectives = ['Learning objective will be generated'];
    }
    if (!lessonPlan.materialsRequired || !Array.isArray(lessonPlan.materialsRequired)) {
      lessonPlan.materialsRequired = ['Materials list will be generated'];
    }
    if (!lessonPlan.lessonFlow) {
      lessonPlan.lessonFlow = {
        introduction: 'Introduction will be generated',
        activities: ['Activity details will be generated'],
        wrapUp: 'Wrap-up will be generated'
      };
    }

    res.json({
      success: true,
      lessonPlan
    });
  } catch (error) {
    console.error('AI generation error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      statusCode: error.statusCode,
      stack: error.stack,
      response: error.response?.data,
      cause: error.cause
    });
    
    let errorMessage = 'Failed to generate lesson plan';
    let statusCode = 500;
    
    // Check for API key related errors
    const errorMsgLower = error.message?.toLowerCase() || '';
    const errorStackLower = error.stack?.toLowerCase() || '';
    
    if (errorMsgLower.includes('api_key') || 
        errorMsgLower.includes('api key') || 
        errorMsgLower.includes('invalid api key') ||
        errorMsgLower.includes('api_key_not_valid') ||
        errorStackLower.includes('api_key')) {
      errorMessage = 'Invalid or missing Gemini API key. Please check your GEMINI_API_KEY in the server .env file. The API key may be invalid, expired, or not have access to the Gemini API.';
      statusCode = 500;
    } else if (errorMsgLower.includes('model') || errorMsgLower.includes('model not found') || errorMsgLower.includes('failed to initialize')) {
      errorMessage = error.message || 'Gemini model not available. Please check the model name or your API access.';
      statusCode = 500;
    } else if (errorMsgLower.includes('quota') || errorMsgLower.includes('rate limit') || errorMsgLower.includes('429') || errorMsgLower.includes('exceeded')) {
      errorMessage = 'API quota exceeded. The free tier limit has been reached. Please wait a moment and try again, or check your billing/quota settings.';
      statusCode = 429;
    } else if (errorMsgLower.includes('parse') || errorMsgLower.includes('json')) {
      errorMessage = 'AI response was not valid JSON. Please try again.';
      statusCode = 500;
    } else if (errorMsgLower.includes('403') || errorMsgLower.includes('forbidden')) {
      errorMessage = 'API access forbidden. Please check your API key permissions.';
      statusCode = 403;
    } else if (errorMsgLower.includes('401') || errorMsgLower.includes('unauthorized')) {
      errorMessage = 'Unauthorized API access. Please verify your API key is correct.';
      statusCode = 401;
    } else {
      errorMessage = error.message || 'Unknown error occurred';
      statusCode = 500;
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        code: error.code,
        status: error.status
      } : undefined
    });
  }
});

// Get available AI models
router.get('/available-models', (req, res) => {
  try {
    const models = getAvailableModels();
    res.json({
      success: true,
      models: models
    });
  } catch (error) {
    console.error('Error fetching available models:', error);
    res.status(500).json({
      error: 'Failed to fetch available models',
      message: error.message
    });
  }
});

// AI Assistant endpoint - Using Groq API
router.post('/assistant', async (req, res) => {
  try {
    const { message, planId, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Get plan context if planId provided
    let planContext = '';
    if (planId) {
      try {
        const plan = await prisma.lessonPlan.findUnique({
          where: { id: planId },
          select: {
            title: true,
            subject: true,
            topic: true,
            grade: true,
            content: true
          }
        });
        if (plan) {
          planContext = `\n\nContext: ${plan.subject} - ${plan.topic}`;
        }
      } catch (error) {
        console.error('Error fetching plan context:', error);
      }
    }

    const prompt = `You are Edvance AI Assistant, a helpful educational AI for teachers. Answer concisely and helpfully.${planContext}${context ? `\nContext: ${context}` : ''}

User: ${message}

Assistant:`;

    try {
      console.log('\u23f1\ufe0f  Generating AI assistant response with Groq API...');
      const groqResponse = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',  // Using Llama as primary (Mixtral decommissioned)
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const text = groqResponse.data.choices[0].message.content.trim();
      res.json({
        success: true,
        response: text
      });
    } catch (error) {
      console.error('AI Assistant error:', error.message);
      
      // Try Llama fallback
      try {
        if (error.response?.status === 400 || error.response?.status === 410 || error.message?.includes('decommissioned')) {
          console.warn('\u26a0\ufe0f  Using Llama fallback for AI assistant...');
          const fallbackResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 1000,
              temperature: 0.7
            },
            {
              headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 30000
            }
          );

          const text = fallbackResponse.data.choices[0].message.content.trim();
          res.json({
            success: true,
            response: text
          });
          return;
        }
      } catch (fallbackError) {
        console.error('Llama fallback also failed:', fallbackError.message);
      }

      // Check if it's a 503 error
      const is503Error = error.message?.includes('503') || error.message?.includes('overloaded') || error.response?.status === 503;
      if (is503Error) {
        return res.status(503).json({
          error: 'AI service is temporarily overloaded',
          message: 'Please try again in a few moments.',
          retryable: true
        });
      }
      
      const is408Error = error.message?.includes('ECONNABORTED') || error.code === 'ECONNABORTED';
      if (is408Error) {
        return res.status(408).json({
          error: 'Request timeout',
          message: 'The AI service took too long to respond. Please try again.',
          retryable: true
        });
      }
      
      res.status(500).json({
        error: 'Failed to get AI assistant response',
        message: error.message
      });
    }
  } catch (error) {
    console.error('AI Assistant route error:', error);
    
    res.status(500).json({
      error: 'Failed to process assistant request',
      message: error.message
    });
  }
});

export default router;