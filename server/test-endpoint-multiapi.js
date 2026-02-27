#!/usr/bin/env node

/**
 * Test the full lesson generation endpoints with all three AI models
 * This tests through the Express API endpoint
 * Run: node test-endpoint-multiapi.js
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:5000/api';
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, icon, message) {
  console.log(`${colors[color]}${icon} ${message}${colors.reset}`);
}

// Mock user token (for testing without authentication)
const mockToken = 'test-token-' + Date.now();

async function getAvailableModels() {
  log('cyan', '━━━', '━'.repeat(60));
  log('bright', '🔍', 'Fetching Available Models');
  log('cyan', '━━━', '━'.repeat(60));

  try {
    log('blue', '📤', 'Requesting available models from server...');
    const response = await axios.get(`${API_URL}/ai/available-models`);
    
    log('green', '✅', 'Available models retrieved!');
    
    const models = response.data.models || [];
    models.forEach(model => {
      const status = model.available ? '✅ Available' : '❌ Not Available';
      log('blue', 'ℹ️ ', `${model.name} (${model.id}): ${status}`);
    });

    return models;
  } catch (error) {
    log('red', '❌', `Error fetching models: ${error.message}`);
    return [];
  }
}

async function testLessonGenerationWithModel(aiModel) {
  log('cyan', '━━━', '━'.repeat(60));
  log('bright', '🔍', `Testing Lesson Generation with ${aiModel.toUpperCase()}`);
  log('cyan', '━━━', '━'.repeat(60));

  const payload = {
    subject: 'Biology',
    topic: 'Photosynthesis',
    educationLevel: 'school',
    grade: 'Grade 9',
    duration: 45,
    approach: 'interactive',
    includeCaseStudies: false,
    includeDiscussionQuestions: false,
    aiModel: aiModel  // Key parameter: select AI model
  };

  try {
    log('blue', '📤', `Sending lesson generation request with AI Model: ${aiModel}...`);
    log('blue', 'ℹ️ ', `Payload: ${JSON.stringify(payload, null, 2)}`);

    const startTime = Date.now();
    
    const response = await axios.post(`${API_URL}/ai/generatePlan`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}` // Note: Without proper auth, this will fail at the middleware level
      }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response.data.success && response.data.lessonPlan) {
      log('green', '✅', `${aiModel.toUpperCase()} generated lesson plan successfully!`);
      log('green', '✅', `Response time: ${duration}ms`);
      
      const plan = response.data.lessonPlan;
      log('blue', 'ℹ️ ', `Lesson Title: ${plan.lessonTitle}`);
      log('blue', 'ℹ️ ', `Learning Objectives: ${plan.learningObjectives?.length || 0} items`);
      log('blue', 'ℹ️ ', `Materials Required: ${plan.materialsRequired?.length || 0} items`);
      
      return true;
    } else {
      log('yellow', '⚠️ ', 'Response format unexpected');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      log('yellow', '⚠️ ', 'Authentication required. You need to login first or provide valid JWT token.');
      log('yellow', '⚠️ ', 'This endpoint requires authentication. Use the browser UI to test instead.');
      return false;
    } else if (error.response?.status === 400) {
      const errorData = error.response.data;
      log('red', '❌', `Bad Request: ${errorData.error}`);
      log('red', '❌', `Message: ${errorData.message}`);
      return false;
    } else if (error.response?.status === 500) {
      const errorData = error.response.data;
      log('red', '❌', `Server Error: ${errorData.error}`);
      log('red', '❌', `Message: ${errorData.message}`);
      return false;
    } else {
      log('red', '❌', `Error: ${error.message}`);
      return false;
    }
  }
}

async function runTests() {
  log('bright', '🚀', 'Starting Endpoint Tests for Multi-AI Integration\n');

  // Step 1: Check if server is running
  try {
    log('blue', '📡', 'Checking if server is running...');
    await axios.get('http://localhost:5000/api/health');
    log('green', '✅', 'Server is running!\n');
  } catch (error) {
    log('red', '❌', 'Server is not running!');
    log('red', '❌', 'Please start the server first: cd server && npm run dev');
    process.exit(1);
  }

  // Step 2: Get available models
  const models = await getAvailableModels();
  log('', '', '');

  // Step 3: Test each available model
  const results = {};
  const availableModels = models.filter(m => m.available).map(m => m.id);

  if (availableModels.length === 0) {
    log('red', '❌', 'No available AI models found!');
    log('red', '❌', 'Check your API keys in .env file');
    process.exit(1);
  }

  for (const model of availableModels) {
    results[model] = await testLessonGenerationWithModel(model);
    log('', '', '');
  }

  // Summary
  log('cyan', '━━━', '━'.repeat(60));
  log('bright', '📊', 'Test Summary');
  log('cyan', '━━━', '━'.repeat(60));

  Object.entries(results).forEach(([model, passed]) => {
    log(passed ? 'green' : 'red', passed ? '✅' : '❌', `${model.toUpperCase()}: ${passed ? 'WORKING' : 'FAILED'}`);
  });

  const passedCount = Object.values(results).filter(r => r).length;
  log('bright', '📈', `\nPassed: ${passedCount}/${availableModels.length} tests`);

  if (passedCount === availableModels.length) {
    log('green', '🎉', 'All available models are working!');
  }

  log('cyan', '━━━', '━'.repeat(60));
  
  log('yellow', '⚠️ ', '\nNote: This test uses mock authentication.');
  log('yellow', '⚠️ ', 'To fully test the API, use the browser UI after logging in.');
}

runTests();
