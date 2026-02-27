import express from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to get user from request (set by authenticateToken)
router.use((req, res, next) => {
  // User should be set by authenticateToken middleware
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
});

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDEIGf1uBs5sjn-zt0e3pBjgmBt5NrGM2s";
const genAI = new GoogleGenerativeAI(API_KEY);

// Get similar lesson plans
router.get('/similar-plans/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    // Get the current plan
    const currentPlan = await prisma.lessonPlan.findUnique({
      where: { id: planId },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!currentPlan) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }

    // Get plans with similar subject, grade, or topic
    const similarPlans = await prisma.lessonPlan.findMany({
      where: {
        AND: [
          { id: { not: planId } }, // Exclude current plan
          {
            OR: [
              { subject: currentPlan.subject },
              { grade: currentPlan.grade },
              currentPlan.topic ? { topic: { contains: currentPlan.topic, mode: 'insensitive' } } : {}
            ]
          },
          {
            OR: [
              { status: 'approved' },
              req.user.role === 'admin' ? {} : { creatorId: req.user.id }
            ]
          }
        ]
      },
      take: limit * 2, // Get more to filter with AI
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        healthScore: 'desc'
      }
    });

    // Use AI to rank and select most similar plans
    if (similarPlans.length > 0) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      
      const planSummaries = similarPlans.map((plan, index) => ({
        index,
        id: plan.id,
        title: plan.title,
        subject: plan.subject,
        topic: plan.topic,
        grade: plan.grade,
        summary: typeof plan.content === 'object' ? JSON.stringify(plan.content).substring(0, 200) : plan.content?.toString().substring(0, 200)
      }));

      const currentPlanSummary = {
        title: currentPlan.title,
        subject: currentPlan.subject,
        topic: currentPlan.topic,
        grade: currentPlan.grade,
        content: typeof currentPlan.content === 'object' ? JSON.stringify(currentPlan.content) : currentPlan.content?.toString()
      };

      const prompt = `Given a lesson plan, rank the following similar plans by relevance and similarity. Return only a JSON array of indices in order of relevance (most similar first).

Current Plan:
Title: ${currentPlanSummary.title}
Subject: ${currentPlanSummary.subject}
Topic: ${currentPlanSummary.topic || 'N/A'}
Grade: ${currentPlanSummary.grade}

Similar Plans:
${JSON.stringify(planSummaries, null, 2)}

Return only a JSON array of the top ${limit} most relevant plan indices, like: [2, 0, 5, 1, 3]`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        // Extract JSON array from response
        const jsonMatch = text.match(/\[[\d,\s]+\]/);
        if (jsonMatch) {
          const rankedIndices = JSON.parse(jsonMatch[0]);
          const rankedPlans = rankedIndices
            .slice(0, limit)
            .map(idx => similarPlans[idx])
            .filter(Boolean);
          
          return res.json({ 
            similarPlans: rankedPlans,
            count: rankedPlans.length
          });
        }
      } catch (aiError) {
        console.warn('AI ranking failed, using default ranking:', aiError.message);
      }
    }

    // Fallback: return first N plans
    res.json({
      similarPlans: similarPlans.slice(0, limit),
      count: similarPlans.length
    });
  } catch (error) {
    console.error('Get similar plans error:', error);
    res.status(500).json({ error: 'Failed to get similar plans' });
  }
});

// Get similar templates
router.get('/similar-templates/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const plan = await prisma.lessonPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }

    // Get templates that might be relevant
    const templates = await prisma.template.findMany({
      where: {
        OR: [
          { isPublic: true },
          { ownerId: req.user.id }
        ]
      },
      take: limit,
      include: {
        owner: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json({
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Get similar templates error:', error);
    res.status(500).json({ error: 'Failed to get similar templates' });
  }
});

export default router;

