import express from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to get user from request (set by authenticateToken)
router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
});

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Check curriculum alignment
router.post('/check-alignment/:planId', [
  // body('curriculumStandards').optional().isArray(),
  // body('syllabus').optional().trim()
], async (req, res) => {
  try {
    const { planId } = req.params;
    const { curriculumStandards, syllabus, country = 'US', gradeLevel } = req.body;

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

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    const planContent = typeof plan.content === 'object' 
      ? JSON.stringify(plan.content, null, 2)
      : plan.content?.toString() || '';

    const effectiveGrade = gradeLevel || plan.grade;

    const prompt = `Analyze this lesson plan for curriculum alignment.
    
Subject: ${plan.subject}
Grade: ${effectiveGrade}
Topic: ${plan.topic || 'N/A'}
Country: ${country}

Content (first 1500 chars): ${planContent.substring(0, 1500)}

Return JSON object:
{
  "alignmentScore": <0-100>,
  "overallAlignment": "<excellent/good/fair/poor>",
  "strengths": ["<string>"],
  "recommendations": ["<string>"],
  "gradeLevelAppropriateness": {
    "score": <1-10>,
    "feedback": "<string>"
  }
}

Return ONLY valid JSON.`;

    console.log(`📥 Curriculum alignment request for: ${plan.title}`);
    console.log(`📤 Sending alignment check to Groq API...`);
    
    let response;
    try {
      console.log('⏱️  Starting Groq API request with 30s timeout...');
      console.log('📊 API Key prefix:', GROQ_API_KEY?.substring(0, 10) + '...');
      
      const payload = {
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      };
      
      console.log('📦 Payload keys:', Object.keys(payload));
      console.log('📦 Message content length:', payload.messages[0].content.length);
      
      response = await axios.post(
        GROQ_API_URL,
        payload,
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
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data));
      }
      
      // If mixtral model is decommissioned or 400 error, try llama
      if (error.message?.includes('decommissioned') || error.response?.status === 410 || error.response?.status === 400) {
        console.log('⚠️  Trying Llama model as fallback...');
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
            max_tokens: 1500,
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
        throw new Error('Curriculum alignment API request timeout - service is slow, please try again');
      } else {
        throw error;
      }
    }

    let text = response.data.choices[0].message.content.trim();

    // Clean up response
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    let alignmentData;
    try {
      alignmentData = JSON.parse(text);
    } catch (parseError) {
      console.error('Curriculum alignment JSON parse error:', parseError);
      console.error('Response text:', text);
      alignmentData = {
        alignmentScore: 75,
        overallAlignment: "fair",
        strengths: ["Basic structure present"],
        recommendations: ["Could benefit from more detailed alignment analysis"],
        gradeLevelAppropriateness: {
          score: 7,
          feedback: "Plan appears appropriate for grade level"
        }
      };
    }

    // Validate alignment score
    if (alignmentData.alignmentScore < 0) alignmentData.alignmentScore = 0;
    if (alignmentData.alignmentScore > 100) alignmentData.alignmentScore = 100;

    // Update plan with curriculum alignment data
    const updatedPlan = await prisma.lessonPlan.update({
      where: { id: planId },
      data: {
        curriculumAlignment: {
          ...alignmentData,
          checkedAt: new Date().toISOString(),
          checkedBy: req.user.id,
          country,
          gradeLevel: effectiveGrade
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        planId: plan.id,
        action: 'curriculum_alignment_checked',
        description: `Checked curriculum alignment: ${alignmentData.alignmentScore}%`,
        metadata: { alignmentScore: alignmentData.alignmentScore }
      }
    });

    res.json({
      success: true,
      alignment: alignmentData,
      plan: updatedPlan
    });
  } catch (error) {
    console.error('❌ Curriculum alignment check error:', error.message);
    
    // Check if it's a timeout error
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return res.status(408).json({
        error: 'Request timeout',
        message: 'The curriculum alignment check took too long. Please try again.',
        retryable: true
      });
    }
    
    // Check if it's an API key error
    const isAPIKeyError = error.message?.includes('API_KEY') || 
                          error.message?.includes('API key') ||
                          error.message?.includes('401') ||
                          error.message?.includes('403') ||
                          error.response?.status === 401;
    
    if (isAPIKeyError) {
      return res.status(401).json({
        error: 'API key expired or invalid',
        message: 'The Groq API key has expired. Please update GROQ_API_KEY in .env file.',
        suggestion: 'Get a new API key from https://console.groq.com/keys',
        retryable: false
      });
    }
    
    // Check if it's a service overload error
    const is503Error = error.message?.includes('503') || error.message?.includes('overloaded') || error.response?.status === 503;
    
    if (is503Error) {
      return res.status(503).json({
        error: 'AI service is temporarily overloaded',
        message: 'The curriculum alignment service is experiencing high load. Please try again in a few moments.',
        retryable: true
      });
    }
    
    res.status(500).json({
      error: 'Failed to check curriculum alignment',
      message: error.message
    });
  }
});

// Regenerate lesson plan for better curriculum alignment
router.post('/regenerate/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const { country = 'US', gradeLevel, curriculumStandards, syllabus } = req.body;

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'Groq API key not configured' });
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

    // Get current alignment data if available
    const currentAlignment = plan.curriculumAlignment || {};
    const alignmentGaps = currentAlignment.gaps || [];
    const alignmentRecommendations = currentAlignment.recommendations || [];

    const planContent = typeof plan.content === 'object' 
      ? JSON.stringify(plan.content, null, 2)
      : plan.content?.toString() || '';

    const effectiveGrade = gradeLevel || plan.grade;

    const prompt = `You are an expert educator. Regenerate and improve this lesson plan to better align with curriculum standards.

Current Lesson Plan:
Title: ${plan.title}
Subject: ${plan.subject}
Topic: ${plan.topic || 'N/A'}
Grade/Level: ${effectiveGrade}
Country/Region: ${country}
Duration: ${plan.duration || 45} minutes

Current Lesson Plan Content:
${planContent}

${alignmentGaps.length > 0 ? `Identified Gaps to Address:
${JSON.stringify(alignmentGaps, null, 2)}` : ''}

${alignmentRecommendations.length > 0 ? `Recommendations to Implement:
${alignmentRecommendations.join('\n')}` : ''}

${curriculumStandards ? `Additional Standards to Align With:
${JSON.stringify(curriculumStandards, null, 2)}` : ''}

${syllabus ? `Syllabus Requirements:
${syllabus}` : ''}

Please regenerate the lesson plan with improved curriculum alignment. Address the identified gaps and implement the recommendations while maintaining the core topic and learning objectives.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanations):
{
  "lessonTitle": "Improved lesson title",
  "grade": "${effectiveGrade}",
  "duration": ${plan.duration || 45},
  "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"],
  "materialsRequired": ["Material 1", "Material 2", "Material 3"],
  "lessonFlow": {
    "introduction": "Improved introduction",
    "activities": ["Activity 1", "Activity 2", "Activity 3"],
    "wrapUp": "Improved wrap-up"
  },
  "assessment": "Improved assessment methods",
  "homework": "Improved homework assignment",
  "summary": "Brief summary"
}

Important: Return ONLY the JSON object. No markdown, no code blocks, no explanations.`;

    console.log(`📥 Regenerate lesson plan request for: ${plan.title}`);
    console.log(`📤 Sending regeneration request to Groq API...`);

    let response;
    try {
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
          max_tokens: 2000,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      // If mixtral model is decommissioned, try llama
      if (error.message?.includes('decommissioned') || error.response?.status === 410) {
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
            max_tokens: 2000,
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        throw error;
      }
    }

    let text = response.data.choices[0].message.content.trim();
    console.log('✅ Regeneration response received');

    // Clean up response
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    let improvedContent;
    try {
      improvedContent = JSON.parse(text);
      console.log('✅ Regeneration JSON parsed successfully');
    } catch (parseError) {
      console.error('❌ Regeneration JSON parse error:', parseError.message);
      console.error('Response text:', text.substring(0, 200));
      
      // Try to fix common JSON issues
      try {
        const fixedText = text.replace(/:\s*undefined/g, ': null')
                             .replace(/:\s*NaN/g, ': null')
                             .replace(/,\s*}/g, '}')
                             .replace(/,\s*]/g, ']');
        improvedContent = JSON.parse(fixedText);
        console.log('✅ Regeneration JSON fixed and parsed successfully');
      } catch (secondError) {
        console.error('❌ JSON fix failed:', secondError.message);
        throw new Error('Failed to parse regenerated lesson plan. Please try again.');
      }
    }

    // Create version snapshot before updating
    await prisma.lessonPlanVersion.create({
      data: {
        planId: planId,
        version: plan.version,
        content: plan.content,
        changeNote: 'Regenerated for better curriculum alignment',
        createdBy: req.user.id
      }
    });

    // Update plan with improved content
    const updatedPlan = await prisma.lessonPlan.update({
      where: { id: planId },
      data: {
        content: improvedContent,
        version: plan.version + 1,
        curriculumAlignment: null // Reset alignment so it can be rechecked
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        planId: plan.id,
        action: 'regenerated',
        description: 'Regenerated lesson plan for better curriculum alignment',
        metadata: { reason: 'low_alignment_score' }
      }
    });

    console.log(`✅ Lesson plan regenerated successfully`);

    res.json({
      success: true,
      plan: updatedPlan,
      message: 'Lesson plan regenerated successfully. Please recheck curriculum alignment.'
    });
  } catch (error) {
    console.error('❌ Regenerate lesson plan error:', error.message);
    
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
    
    // Check if it's a service overload error
    const is503Error = error.message?.includes('503') || error.message?.includes('overloaded') || error.response?.status === 503;
    
    if (is503Error) {
      return res.status(503).json({
        error: 'AI service is temporarily overloaded',
        message: 'The lesson plan regeneration service is experiencing high load. Please try again in a few moments.',
        retryable: true
      });
    }
    
    res.status(500).json({
      error: 'Failed to regenerate lesson plan',
      message: error.message
    });
  }
});

// Get curriculum coverage map (must be before /:planId to avoid being caught by the parameter matcher)
router.get('/coverage-map', async (req, res) => {
  try {
    const { subject, grade, planId } = req.query;

    if (!subject || !grade) {
      return res.status(400).json({ error: 'Subject and grade are required' });
    }

    // Get plan if planId provided
    let plan = null;
    let planNotFound = false;
    
    if (planId) {
      try {
        plan = await prisma.lessonPlan.findUnique({
          where: { id: planId },
          select: {
            id: true,
            title: true,
            topic: true,
            content: true,
            curriculumAlignment: true
          }
        });

        if (!plan) {
          planNotFound = true;
        }
      } catch (dbError) {
        console.error('Database error fetching lesson plan:', dbError);
        planNotFound = true;
      }
    }

    // If a planId was provided but plan not found, return helpful message
    if (planId && planNotFound) {
      return res.json({
        success: true,
        coverageMap: null,
        message: 'Lesson plan not found. Please check the lesson plan ID and try again.'
      });
    }

    // Try to get topics from curriculum alignment data first
    let topics = [];
    const alignment = plan?.curriculumAlignment;
    
    if (alignment && alignment.alignedStandards && alignment.alignedStandards.length > 0) {
      // Use aligned standards as topics
      topics = alignment.alignedStandards.map(standard => ({
        name: standard.standard || standard.description,
        standard: standard.standard,
        covered: standard.coverage === 'fully' || standard.coverage === 'partially',
        coverage: standard.coverage,
        evidence: standard.evidence
      }));
    } else if (plan?.content) {
      // If no alignment data, generate topics from lesson plan content
      topics = extractTopicsFromPlan(plan);
    } else {
      // No data available
      return res.json({
        success: true,
        coverageMap: null,
        message: 'No curriculum data available. Please check curriculum alignment first for better coverage map.'
      });
    }

    const coveredTopics = topics.filter(t => t.covered).length;
    const uncoveredTopics = topics
      .filter(t => !t.covered)
      .map(t => t.name);

    res.json({
      success: true,
      coverageMap: {
        subject,
        grade,
        topics,
        totalTopics: topics.length,
        coveredTopics,
        uncoveredTopics,
        coveragePercentage: topics.length > 0 
          ? Math.round((coveredTopics / topics.length) * 100) 
          : 0
      }
    });
  } catch (error) {
    console.error('Get coverage map error:', error);
    res.status(500).json({
      error: 'Failed to get coverage map',
      message: error.message
    });
  }
});

// Get curriculum alignment for a plan
router.get('/:planId', async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await prisma.lessonPlan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        curriculumAlignment: true
      }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }

    res.json({
      alignment: plan.curriculumAlignment
    });
  } catch (error) {
    console.error('Get curriculum alignment error:', error);
    res.status(500).json({ error: 'Failed to get curriculum alignment' });
  }
});

/**
 * Helper function to extract topics from lesson plan content
 * Used when curriculum alignment data is not available
 */
function extractTopicsFromPlan(plan) {
  const topics = [];
  const seenTopics = new Set();

  try {
    const content = plan.content || {};

    // Extract from learning objectives
    if (content.learningObjectives && Array.isArray(content.learningObjectives)) {
      content.learningObjectives.forEach(obj => {
        const topic = extractTopicName(obj);
        if (topic && !seenTopics.has(topic)) {
          topics.push({ name: topic, covered: true });
          seenTopics.add(topic);
        }
      });
    }

    // Extract from lesson flow activities
    if (content.lessonFlow?.activities && Array.isArray(content.lessonFlow.activities)) {
      content.lessonFlow.activities.forEach(activity => {
        const topic = extractTopicName(activity);
        if (topic && !seenTopics.has(topic)) {
          topics.push({ name: topic, covered: true });
          seenTopics.add(topic);
        }
      });
    }

    // Extract from materials required
    if (content.materialsRequired && Array.isArray(content.materialsRequired)) {
      content.materialsRequired.forEach(material => {
        const topic = extractTopicName(material);
        if (topic && !seenTopics.has(topic)) {
          topics.push({ name: topic, covered: true });
          seenTopics.add(topic);
        }
      });
    }

    // Extract from assessment
    if (content.assessment && typeof content.assessment === 'string') {
      const topic = extractTopicName(content.assessment);
      if (topic && !seenTopics.has(topic)) {
        topics.push({ name: topic, covered: true });
        seenTopics.add(topic);
      }
    }

    // If no topics extracted, return default topics
    if (topics.length === 0) {
      return createDefaultTopics(plan);
    }

    return topics;
  } catch (error) {
    console.error('Error extracting topics from plan:', error);
    return createDefaultTopics(plan);
  }
}

/**
 * Helper function to extract a meaningful topic name from text
 */
function extractTopicName(text) {
  if (!text) return null;
  
  // Convert to string if needed
  const str = typeof text === 'string' ? text : String(text);
  
  // Remove common prefixes and take the first 60 characters
  let topic = str
    .replace(/^(objective|activity|material|assessment):\s*/i, '')
    .replace(/^\d+\.\s*/, '')
    .trim();

  // Return only if it has meaningful content
  if (topic && topic.length > 3) {
    return topic.substring(0, 80);
  }
  
  return null;
}

/**
 * Helper function to create default topics based on subject/grade
 */
function createDefaultTopics(plan) {
  const defaultTopics = [
    { name: 'Introduction to Core Concepts', covered: true },
    { name: 'Fundamental Principles', covered: true },
    { name: 'Application and Practice', covered: true },
    { name: 'Assessment and Evaluation', covered: true }
  ];

  return defaultTopics;
}

export default router;

