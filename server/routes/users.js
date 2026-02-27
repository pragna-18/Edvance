import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Get all teachers (for collaboration) - accessible to any authenticated user
router.get('/teachers', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    
    const where = {
      role: { in: ['teacher', 'HOD'] },
      id: { not: req.user.id } // Exclude self
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              createdPlans: true,
              approvals: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            createdPlans: true,
            approvals: true,
            templates: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role (admin only)
router.patch('/:id/role', 
  authenticateToken, 
  authorizeRoles('admin'),
  [body('role').isIn(['teacher', 'HOD', 'admin']).withMessage('Invalid role')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { id } = req.params;
      const { role } = req.body;

      // Prevent admin from changing their own role
      if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot change your own role' });
      }

      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      // Create activity log
      await prisma.activity.create({
        data: {
          userId: req.user.id,
          action: 'updated',
          description: `Admin ${req.user.name} changed ${user.name}'s role to ${role}`
        }
      });

      res.json({ message: 'User role updated successfully', user: updatedUser });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update user password (admin only)
router.patch('/:id/password',
  authenticateToken,
  authorizeRoles('admin'),
  [body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { id } = req.params;
      const { password } = req.body;

      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword }
      });

      // Create activity log
      await prisma.activity.create({
        data: {
          userId: req.user.id,
          action: 'updated',
          description: `Admin ${req.user.name} reset password for ${user.name}`
        }
      });

      res.json({ message: 'User password updated successfully' });
    } catch (error) {
      console.error('Update user password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete user (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({
      where: { id }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'deleted',
        description: `Admin ${req.user.name} deleted user ${user.name}`
      }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;



