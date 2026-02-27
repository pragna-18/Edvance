import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to get user from request
router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
});

// Get templates for offline use
router.get('/templates', async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      where: {
        OR: [
          { isPublic: true },
          { ownerId: req.user.id }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        structure: true,
        isPublic: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Get offline templates error:', error);
    res.status(500).json({
      error: 'Failed to get templates',
      message: error.message
    });
  }
});

// Get user's lesson plans for offline use
router.get('/plans', async (req, res) => {
  try {
    const plans = await prisma.lessonPlan.findMany({
      where: {
        creatorId: req.user.id
      },
      select: {
        id: true,
        title: true,
        subject: true,
        topic: true,
        grade: true,
        content: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Get offline plans error:', error);
    res.status(500).json({
      error: 'Failed to get lesson plans',
      message: error.message
    });
  }
});

export default router;

