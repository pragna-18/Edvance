import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import authRoutes from '../server/routes/auth.js';
import lessonPlanRoutes from '../server/routes/lessonPlans.js';
import templateRoutes from '../server/routes/templates.js';
import approvalRoutes from '../server/routes/approvals.js';
import aiRoutes from '../server/routes/ai.js';
import dashboardRoutes from '../server/routes/dashboard.js';
import aiSuggestionsRoutes from '../server/routes/aiSuggestions.js';
import healthScoreRoutes from '../server/routes/healthScore.js';
import languageRoutes from '../server/routes/language.js';
import curriculumRoutes from '../server/routes/curriculum.js';
import userRoutes from '../server/routes/users.js';
import pedagogyRoutes from '../server/routes/pedagogy.js';
import personalizationRoutes from '../server/routes/personalization.js';
import cognitiveLoadRoutes from '../server/routes/cognitiveLoad.js';
import offlineRoutes from '../server/routes/offline.js';
import smsRoutes from '../server/routes/sms.js';
import collaborationRoutes from '../server/routes/collaboration.js';
import { authenticateToken } from '../server/middleware/auth.js';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection check
const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/lesson-plans', authenticateToken, lessonPlanRoutes);
app.use('/api/templates', authenticateToken, templateRoutes);
app.use('/api/approvals', authenticateToken, approvalRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/suggestions', authenticateToken, aiSuggestionsRoutes);
app.use('/api/health-score', authenticateToken, healthScoreRoutes);
app.use('/api/language', authenticateToken, languageRoutes);
app.use('/api/curriculum', authenticateToken, curriculumRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pedagogy', authenticateToken, pedagogyRoutes);
app.use('/api/personalization', authenticateToken, personalizationRoutes);
app.use('/api/cognitive-load', authenticateToken, cognitiveLoadRoutes);
app.use('/api/offline', authenticateToken, offlineRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/collaboration', authenticateToken, collaborationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Edvance API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

export default app;
