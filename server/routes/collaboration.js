import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Liveblocks } from '@liveblocks/node';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Liveblocks only if secret key is available and valid
let liveblocks = null;

try {
  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;
  
  // For production, Liveblocks requires secret key to start with "sk_"
  // For testing/development, we can skip Liveblocks if key is not properly configured
  if (secretKey && secretKey.startsWith('sk_')) {
    liveblocks = new Liveblocks({
      secret: secretKey
    });
  } else if (secretKey && secretKey !== 'test_secret_key') {
    console.warn('⚠️  LIVEBLOCKS_SECRET_KEY is set but not in correct format (should start with "sk_")');
    console.warn('⚠️  Using fallback token generation without Liveblocks validation');
  }
} catch (error) {
  console.error('Failed to initialize Liveblocks:', error.message);
}

// Get authentication token for Liveblocks
router.post('/auth', async (req, res) => {
  try {
    const { planId } = req.body;

    // Verify user has access to this plan
    const plan = await prisma.lessonPlan.findUnique({
      where: { id: planId },
      include: {
        collaborators: {
          where: { userId: req.user.id }
        }
      }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Check if user is creator or has permission
    const isCreator = plan.creatorId === req.user.id;
    const hasPermission = plan.collaborators.length > 0;

    if (!isCreator && !hasPermission) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let token = null;

    // Generate token using Liveblocks if available, otherwise create a fallback JWT
    if (liveblocks) {
      try {
        const session = liveblocks.prepareSession(req.user.id, {
          userInfo: {
            name: req.user.name,
            email: req.user.email,
            userId: req.user.id,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.name)}`
          }
        });

        session.allow(`plan:${planId}`, session.FULL_ACCESS);
        session.allow(`plan:${planId}:comments`, session.FULL_ACCESS);

        token = session.token;
      } catch (error) {
        console.error('Liveblocks token generation failed:', error.message);
        // Fallback to simple token
        token = `test_token_${req.user.id}_${planId}`;
      }
    } else {
      // Fallback token for testing without Liveblocks
      token = `test_token_${req.user.id}_${planId}`;
    }

    res.json({
      token,
      room: `plan:${planId}`,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Failed to generate auth token' });
  }
});

// Grant collaboration access
router.post('/:planId/grant-access', async (req, res) => {
  try {
    const { planId } = req.params;
    const { userId, role = 'editor' } = req.body;

    console.log('Grant access request:', { planId, userId, userRole: role });

    // Check if requester is plan creator
    const plan = await prisma.lessonPlan.findUnique({
      where: { id: planId }
    });

    console.log('Plan lookup result:', { found: !!plan, planId });

    if (!plan) {
      console.error('Plan not found - dumping details:', { 
        planId, 
        userId: req.user.id,
        requestUrl: req.originalUrl,
        route: req.route
      });
      return res.status(404).json({ error: 'Plan not found', debug: { planId } });
    }

    if (plan.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Only creator can grant access' });
    }

    // Don't allow self-access
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot grant access to self' });
    }

    // Check if collaborator exists
    const collaborator = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!collaborator) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create or update permission
    const permission = await prisma.collaborationPermission.upsert({
      where: {
        planId_userId: { planId, userId }
      },
      update: { role },
      create: {
        planId,
        userId,
        role,
        grantedBy: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        planId,
        action: 'collaboration_granted',
        description: `Granted ${role} access to ${collaborator.name}`,
        metadata: { grantedTo: userId, role }
      }
    });

    res.json({
      permission,
      message: `Access granted to ${collaborator.name}`
    });
  } catch (error) {
    console.error('Grant access error:', error);
    res.status(500).json({ error: 'Failed to grant access' });
  }
});

// Revoke collaboration access
router.post('/:planId/revoke-access', async (req, res) => {
  try {
    const { planId } = req.params;
    const { userId } = req.body;

    // Check if requester is plan creator
    const plan = await prisma.lessonPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (plan.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Only creator can revoke access' });
    }

    // Get user info before deleting
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Delete permission
    await prisma.collaborationPermission.delete({
      where: {
        planId_userId: { planId, userId }
      }
    });

    // End active collaboration sessions
    await prisma.collaborationSession.updateMany({
      where: {
        planId,
        userId
      },
      data: { status: 'offline' }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        planId,
        action: 'collaboration_revoked',
        description: `Revoked access from ${user?.name || 'Unknown'}`,
        metadata: { revokedFrom: userId }
      }
    });

    res.json({
      message: `Access revoked from ${user?.name || 'Unknown'}`
    });
  } catch (error) {
    console.error('Revoke access error:', error);
    res.status(500).json({ error: 'Failed to revoke access' });
  }
});

// Get collaborators for a plan
router.get('/:planId/collaborators', async (req, res) => {
  try {
    const { planId } = req.params;

    console.log('Fetching collaborators for plan:', planId);

    // Check plan exists
    const plan = await prisma.lessonPlan.findUnique({
      where: { id: planId }
    });

    console.log('Plan found for collaborators:', !!plan);

    if (!plan) {
      console.error('Plan not found in collaborators endpoint:', { planId });
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Get collaborators with active sessions
    const collaborators = await prisma.collaborationPermission.findMany({
      where: { planId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Get active sessions
    const activeSessions = await prisma.collaborationSession.findMany({
      where: {
        planId,
        status: 'active'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      creator: {
        id: plan.creatorId,
        role: 'owner'
      },
      collaborators,
      activeSessions
    });
  } catch (error) {
    console.error('Get collaborators error:', error);
    res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
});

// Add comment to lesson plan
router.post('/:planId/comments', async (req, res) => {
  try {
    const { planId } = req.params;
    const { content, position } = req.body;

    // Check if user has access
    const plan = await prisma.lessonPlan.findUnique({
      where: { id: planId },
      include: {
        collaborators: {
          where: { userId: req.user.id }
        }
      }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const isCreator = plan.creatorId === req.user.id;
    const hasPermission = plan.collaborators.length > 0;

    if (!isCreator && !hasPermission) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comment = await prisma.collaborationComment.create({
      data: {
        planId,
        userId: req.user.id,
        userName: req.user.name,
        content,
        position: position || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get comments for a plan
router.get('/:planId/comments', async (req, res) => {
  try {
    const { planId } = req.params;
    const { resolved = false } = req.query;

    const comments = await prisma.collaborationComment.findMany({
      where: {
        planId,
        resolved: resolved === 'true'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Update comment resolved status
router.put('/:planId/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { resolved } = req.body;

    const comment = await prisma.collaborationComment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only creator or comment author can update
    if (comment.userId !== req.user.id) {
      const plan = await prisma.lessonPlan.findUnique({
        where: { id: comment.planId }
      });

      if (plan?.creatorId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const updated = await prisma.collaborationComment.update({
      where: { id: commentId },
      data: { resolved },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({ comment: updated });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

export default router;
