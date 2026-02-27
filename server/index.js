import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import axios from 'axios';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import lessonPlanRoutes from './routes/lessonPlans.js';
import templateRoutes from './routes/templates.js';
import approvalRoutes from './routes/approvals.js';
import aiRoutes from './routes/ai.js';
import dashboardRoutes from './routes/dashboard.js';
import aiSuggestionsRoutes from './routes/aiSuggestions.js';
import healthScoreRoutes from './routes/healthScore.js';
import languageRoutes from './routes/language.js';
import curriculumRoutes from './routes/curriculum.js';
import userRoutes from './routes/users.js';
import pedagogyRoutes from './routes/pedagogy.js';
import personalizationRoutes from './routes/personalization.js';
import cognitiveLoadRoutes from './routes/cognitiveLoad.js';
import offlineRoutes from './routes/offline.js';
import smsRoutes from './routes/sms.js';
import collaborationRoutes from './routes/collaboration.js';
import { authenticateToken } from './middleware/auth.js';
import { initializeSocket } from './socket/socketHandler.js';

dotenv.config();

// Check required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not set in .env file');
  console.error('Please create a .env file in the server directory with DATABASE_URL');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET is not set. Using default (insecure for production)');
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Socket.io
initializeSocket(io);

// Database connection check
const prisma = new PrismaClient();

// Test database connection
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check:');
    console.error('1. PostgreSQL is running');
    console.error('2. DATABASE_URL in .env is correct');
    console.error('3. Database exists and migrations are run');
    console.error('4. Run: npx prisma generate && npx prisma migrate dev');
  });

// Routes
app.use('/api/auth', authRoutes);

// Public chatbot endpoint (no authentication required)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, planId, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const prompt = `You are Edvance AI Assistant, a helpful educational AI for teachers. Answer concisely and helpfully.\n\nUser: ${message}\n\nAssistant:`;

    try {
      console.log('⏱️  Generating AI chat response with Groq API...');
      const groqResponse = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const text = groqResponse.data.choices[0].message.content.trim();
      res.json({
        success: true,
        response: text
      });
    } catch (error) {
      console.error('Chat error:', error.message);
      
      // Try Llama fallback if needed
      if (error.response?.status === 400 || error.response?.status === 410) {
        try {
          console.warn('⚠️ Using fallback model...');
          const fallbackResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 1000,
              temperature: 0.7
            },
            {
              headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 30000
            }
          );
          const text = fallbackResponse.data.choices[0].message.content.trim();
          res.json({
            success: true,
            response: text
          });
          return;
        } catch (fallbackError) {
          console.error('Fallback failed:', fallbackError.message);
        }
      }
      
      res.status(500).json({
        error: 'Failed to get AI response',
        message: error.message
      });
    }
  } catch (error) {
    console.error('Chat route error:', error);
    res.status(500).json({
      error: 'Failed to process chat request',
      message: error.message
    });
  }
});

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
app.use('/api/sms', smsRoutes); // SMS doesn't require auth (uses phone number)
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

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Server accessible on: http://0.0.0.0:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

