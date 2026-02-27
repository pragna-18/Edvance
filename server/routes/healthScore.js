import express from 'express';
import { PrismaClient } from '@prisma/client';
import { predictHealthScoreWithFallback } from '../utils/healthScorePredictor.js';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to get user from request (set by authenticateToken)
router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
});

// Calculate health score for a lesson plan
router.post('/calculate/:planId', async (req, res) => {
  try {
    const { planId } = req.params;

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

    console.log(`📊 Calculating health score for plan: ${plan.title}`);

    // Extract lesson plan components from nested content structure
    // The content can have various structures, so we need to handle flexible parsing
    let objectives = [];
    let materials = [];
    let activities = [];
    let assessments = [];
    let differentiation = [];
    let content_text = '';

    if (typeof plan.content === 'object' && plan.content) {
      // Try different possible field names for each component
      objectives = plan.content.objectives || plan.content.learningObjectives || [];
      materials = plan.content.materials || plan.content.materialsRequired || plan.content.resources || plan.content.teachingMaterials || [];
      
      // Activities might be nested inside lessonFlow
      activities = plan.content.activities || 
                  plan.content.learningActivities || 
                  (plan.content.lessonFlow?.activities) || 
                  [];
      
      // Assessment might be a string or array
      const assessmentData = plan.content.assessments || plan.content.assessment || plan.content.evaluation || plan.content.assessmentMethods || [];
      assessments = Array.isArray(assessmentData) ? assessmentData : (assessmentData ? [assessmentData] : []);
      
      differentiation = plan.content.differentiation || plan.content.differentiationStrategies || [];
      content_text = JSON.stringify(plan.content);
    }

    // Prepare lesson plan data for prediction
    const lessonData = {
      title: plan.title,
      subject: plan.subject,
      topic: plan.topic || '',
      grade: plan.grade,
      duration: plan.duration || 45,
      content: content_text,
      objectives: Array.isArray(objectives) ? objectives : [],
      materials: Array.isArray(materials) ? materials : [],
      activities: Array.isArray(activities) ? activities : [],
      assessments: Array.isArray(assessments) ? assessments : [],
      differentiation: Array.isArray(differentiation) ? differentiation : []
    };

    console.log('📋 Lesson data being sent to ML model:', {
      title: lessonData.title,
      duration: lessonData.duration,
      objectives: lessonData.objectives.length,
      materials: lessonData.materials.length,
      activities: lessonData.activities.length,
      assessments: lessonData.assessments.length,
      differentiation: lessonData.differentiation.length,
      contentWords: content_text.split(' ').length
    });

    // Use ML model for prediction
    const prediction = await predictHealthScoreWithFallback(lessonData);

    console.log(`✅ Health Score: ${prediction.score}/10 (Source: ${prediction.source || 'ML Model'})`);

    // Update plan with health score
    const updatedPlan = await prisma.lessonPlan.update({
      where: { id: planId },
      data: {
        healthScore: prediction.score,
        healthScoreDetails: {
          score: prediction.score,
          features: prediction.features,
          reasoning: prediction.reasoning,
          source: prediction.source || 'ml_model',
          calculatedAt: new Date().toISOString()
        }
      }
    });

    // Create activity log
    try {
      await prisma.activity.create({
        data: {
          userId: req.user.id,
          planId: plan.id,
          action: 'health_score_calculated',
          description: `Calculated health score: ${prediction.score}/10 (${prediction.source || 'ML Model'})`,
          metadata: { 
            score: prediction.score,
            source: prediction.source || 'ml_model'
          }
        }
      });
    } catch (logError) {
      console.warn('Failed to create activity log:', logError.message);
      // Don't fail the whole request if logging fails
    }

    res.json({
      success: true,
      healthScore: prediction.score,
      source: prediction.source || 'ml_model',
      features: prediction.features,
      reasoning: prediction.reasoning,
      plan: updatedPlan
    });

  } catch (error) {
    console.error('Calculate health score error:', error);
    res.status(500).json({
      error: 'Failed to calculate health score',
      message: error.message
    });
  }
});

// Get health score for a plan
router.get('/:planId', async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await prisma.lessonPlan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        healthScore: true,
        healthScoreDetails: true
      }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }

    res.json({
      healthScore: plan.healthScore,
      details: plan.healthScoreDetails
    });
  } catch (error) {
    console.error('Get health score error:', error);
    res.status(500).json({ error: 'Failed to get health score' });
  }
});

export default router;

