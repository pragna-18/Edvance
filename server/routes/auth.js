import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

// Register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['teacher', 'HOD', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({ 
        error: errorMessages,
        errors: errors.array() 
      });
    }

    const { name, email, password, role = 'teacher' } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // Create activity log (wrap in try-catch to not fail registration if this fails)
    try {
      await prisma.activity.create({
        data: {
          userId: user.id,
          action: 'registered',
          description: `${user.name} registered to the platform`
        }
      });
    } catch (activityError) {
      console.warn('Failed to create activity log:', activityError.message);
      // Continue even if activity log fails
    }

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (error.code === 'P1001') {
      return res.status(500).json({ error: 'Database connection failed. Please check your DATABASE_URL' });
    }
    if (error.message?.includes('Can\'t reach database server')) {
      return res.status(500).json({ error: 'Database server is not reachable. Please check your database connection.' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({ 
        error: errorMessages,
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    if (!process.env.JWT_SECRET) {
      console.warn('WARNING: JWT_SECRET not set, using default. This is insecure for production!');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Create activity log (wrap in try-catch to not fail login if this fails)
    try {
      await prisma.activity.create({
        data: {
          userId: user.id,
          action: 'logged_in',
          description: `${user.name} logged in`
        }
      });
    } catch (activityError) {
      console.warn('Failed to create activity log:', activityError.message);
      // Continue even if activity log fails
    }

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    
    // Provide more specific error messages
    if (error.code === 'P1001') {
      return res.status(500).json({ error: 'Database connection failed. Please check your DATABASE_URL' });
    }
    if (error.message?.includes('Can\'t reach database server')) {
      return res.status(500).json({ error: 'Database server is not reachable. Please check your database connection.' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    // This endpoint should be protected by authenticateToken middleware
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;



