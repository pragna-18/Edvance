import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const where = {};
    if (userRole === 'teacher') {
      where.creatorId = userId;
    }

    const [
      totalPlans,
      draftPlans,
      submittedPlans,
      approvedPlans,
      pendingApprovals,
      recentActivities
    ] = await Promise.all([
      // Total lesson plans
      prisma.lessonPlan.count({ where }),
      
      // Draft plans
      prisma.lessonPlan.count({
        where: { ...where, status: 'draft' }
      }),
      
      // Submitted plans
      prisma.lessonPlan.count({
        where: { ...where, status: 'submitted' }
      }),
      
      // Approved plans
      prisma.lessonPlan.count({
        where: { ...where, status: 'approved' }
      }),
      
      // Pending approvals (for HOD/admin)
      userRole === 'teacher' 
        ? Promise.resolve(0)
        : prisma.approval.count({
            where: {
              status: 'pending',
              ...(userRole === 'HOD' ? { reviewerId: userId } : {})
            }
          }),
      
      // Recent activities
      prisma.activity.findMany({
        where: userRole === 'teacher' ? { userId } : {},
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          plan: {
            select: {
              id: true,
              title: true
            }
          }
        }
      })
    ]);

    res.json({
      stats: {
        totalPlans,
        draftPlans,
        submittedPlans,
        approvedPlans,
        pendingApprovals
      },
      recentActivities
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get activity analytics
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const where = {};
    if (userRole === 'teacher') {
      where.userId = userId;
    }

    // Get activities by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activities = await prisma.activity.findMany({
      where: {
        ...where,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        action: true,
        createdAt: true
      }
    });

    // Group by date
    const activityByDate = {};
    activities.forEach(activity => {
      const date = new Date(activity.createdAt).toISOString().split('T')[0];
      if (!activityByDate[date]) {
        activityByDate[date] = 0;
      }
      activityByDate[date]++;
    });

    // Get activities by type
    const activityByType = {};
    activities.forEach(activity => {
      if (!activityByType[activity.action]) {
        activityByType[activity.action] = 0;
      }
      activityByType[activity.action]++;
    });

    res.json({
      activityByDate,
      activityByType
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;






