import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authorizeRoles } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all approvals (HOD and admin only)
router.get('/', authorizeRoles('HOD', 'admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    // HOD can only see their own reviews, admin can see all
    if (req.user.role === 'HOD') {
      where.reviewerId = req.user.id;
    }

    if (status) {
      where.status = status;
    }

    const [approvals, total] = await Promise.all([
      prisma.approval.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          plan: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.approval.count({ where })
    ]);

    res.json({
      approvals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get approvals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending approvals for HOD
router.get('/pending', authorizeRoles('HOD', 'admin'), async (req, res) => {
  try {
    // Get all submitted plans without approvals or with pending approvals
    const submittedPlans = await prisma.lessonPlan.findMany({
      where: {
        status: 'submitted',
        approvals: {
          none: {
            status: 'approved'
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        approvals: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ plans: submittedPlans });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create approval request (when teacher submits)
router.post('/:planId', authorizeRoles('HOD', 'admin'), [
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planId } = req.params;
    const { status, comments } = req.body;

    const plan = await prisma.lessonPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }

    // Check if approval already exists
    const existingApproval = await prisma.approval.findFirst({
      where: {
        planId,
        reviewerId: req.user.id
      }
    });

    let approval;
    if (existingApproval) {
      approval = await prisma.approval.update({
        where: { id: existingApproval.id },
        data: {
          status,
          comments,
          reviewedAt: new Date()
        },
        include: {
          plan: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    } else {
      approval = await prisma.approval.create({
        data: {
          planId,
          reviewerId: req.user.id,
          status,
          comments,
          reviewedAt: status !== 'pending' ? new Date() : null
        },
        include: {
          plan: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    }

    // Update plan status based on approval
    let planStatus = plan.status;
    if (status === 'approved') {
      planStatus = 'approved';
    } else if (status === 'rejected') {
      planStatus = 'revision_requested';
    }

    await prisma.lessonPlan.update({
      where: { id: planId },
      data: { status: planStatus }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        planId: plan.id,
        action: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'reviewed',
        description: `${status} lesson plan: ${plan.title}`,
        metadata: { comments }
      }
    });

    res.json({ approval, message: `Lesson plan ${status} successfully` });
  } catch (error) {
    console.error('Create approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update approval
router.put('/:id', authorizeRoles('HOD', 'admin'), [
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, comments } = req.body;

    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        plan: true
      }
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' });
    }

    // Check if user has permission
    if (req.user.role === 'HOD' && approval.reviewerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedApproval = await prisma.approval.update({
      where: { id },
      data: {
        status,
        comments,
        reviewedAt: status !== 'pending' ? new Date() : null
      },
      include: {
        plan: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update plan status
    let planStatus = approval.plan.status;
    if (status === 'approved') {
      planStatus = 'approved';
    } else if (status === 'rejected') {
      planStatus = 'revision_requested';
    }

    await prisma.lessonPlan.update({
      where: { id: approval.planId },
      data: { status: planStatus }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        planId: approval.plan.id,
        action: status === 'approved' ? 'approved' : 'rejected',
        description: `${status} lesson plan: ${approval.plan.title}`,
        metadata: { comments }
      }
    });

    res.json({ approval: updatedApproval, message: 'Approval updated successfully' });
  } catch (error) {
    console.error('Update approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;






