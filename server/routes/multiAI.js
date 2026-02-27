import express from 'express';
import {
  generateLessonPlanWithAI,
  getAllAIModels,
  getAvailableProviders,
} from '../utils/multiAIService.js';

const router = express.Router();

/**
 * POST /api/ai/generate-lesson-plan
 * Generate lesson plan with selected AI model
 */
router.post('/generate-lesson-plan', async (req, res) => {
  try {
    const {
      aiModel,
      subject,
      gradeLevel,
      topic,
      objectives,
      duration,
    } = req.body;

    // Validate required fields
    if (!aiModel || !subject || !gradeLevel || !topic || !objectives || !duration) {
      return res.status(400).json({
        error: 'Missing required fields: aiModel, subject, gradeLevel, topic, objectives, duration',
      });
    }

    console.log(`Generating lesson plan with ${aiModel}...`);

    const lessonPlan = await generateLessonPlanWithAI(
      aiModel,
      subject,
      gradeLevel,
      topic,
      objectives,
      duration
    );

    res.status(200).json({
      success: true,
      aiModel,
      lessonPlan,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in generate-lesson-plan:', error);
    res.status(500).json({
      error: `Failed to generate lesson plan: ${error.message}`,
    });
  }
});

/**
 * GET /api/ai/available-models
 * Get all available AI models grouped by provider
 */
router.get('/available-models', async (req, res) => {
  try {
    const models = getAllAIModels();
    res.status(200).json({
      success: true,
      models,
    });
  } catch (error) {
    console.error('Error in available-models:', error);
    res.status(500).json({
      error: 'Failed to fetch available models',
    });
  }
});

/**
 * GET /api/ai/providers
 * Get list of available AI providers for UI dropdown
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = getAvailableProviders();
    res.status(200).json({
      success: true,
      providers,
    });
  } catch (error) {
    console.error('Error in providers:', error);
    res.status(500).json({
      error: 'Failed to fetch available providers',
    });
  }
});

export default router;
