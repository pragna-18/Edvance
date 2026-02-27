#!/usr/bin/env node

/**
 * Test all three AI models (Gemini, OpenAI, Groq) directly
 * This script tests API calls without requiring authentication
 * Run: node test-all-apis.js
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const testPrompt = `Create a SHORT JSON lesson plan (max 200 words) for teaching "Photosynthesis" to Grade 9 students for 45 minutes. Return ONLY valid JSON with this structure:
{
  "lessonTitle": "title",
  "learningObjectives": ["objective"],
  "materialsRequired": ["material"],
  "duration": 45,
  "summary": "brief summary"
}`;

// Color codes for console output
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

async function testGemini() {
  log('cyan', '━━━', '━'.repeat(60));
  log('bright', '🔍', 'Testing Google Gemini API');
  log('cyan', '━━━', '━'.repeat(60));

  if (!GEMINI_API_KEY) {
    log('red', '❌', 'GEMINI_API_KEY not found in .env');
    return false;
  }

  try {
    log('blue', '📤', 'Initializing Gemini client...');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    log('blue', '📤', 'Sending request to Gemini API...');
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();

    log('green', '✅', 'Gemini API Response received!');
    log('green', '✅', `Response length: ${text.length} characters`);
    
    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      log('green', '✅', 'Response is valid JSON');
      log('green', '✅', `Lesson Title: ${json.lessonTitle}`);
      return true;
    } catch (e) {
      log('yellow', '⚠️ ', 'Response is not valid JSON, but API works');
      log('yellow', '⚠️ ', `First 100 chars: ${text.substring(0, 100)}`);
      return true;
    }
  } catch (error) {
    log('red', '❌', `Gemini API Error: ${error.message}`);
    return false;
  }
}

async function testOpenAI() {
  log('cyan', '━━━', '━'.repeat(60));
  log('bright', '🔍', 'Testing OpenAI API (trying best available model)');
  log('cyan', '━━━', '━'.repeat(60));

  if (!OPENAI_API_KEY) {
    log('red', '❌', 'OPENAI_API_KEY not found in .env');
    return false;
  }

  try {
    log('blue', '📤', 'Initializing OpenAI client...');
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY
    });

    log('blue', '📤', 'Sending request to OpenAI API...');
    let response;
    const models = ['gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4-turbo-preview'];
    let lastError;

    for (const model of models) {
      try {
        log('blue', 'ℹ️ ', `Trying model: ${model}...`);
        response = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert educator. Generate lesson plans in valid JSON format.'
            },
            {
              role: 'user',
              content: testPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        });
        log('green', '✅', `Model ${model} worked!`);
        break;
      } catch (modelError) {
        log('yellow', '⚠️ ', `Model ${model} failed: ${modelError.message}`);
        lastError = modelError;
        continue;
      }
    }

    if (!response) {
      throw lastError || new Error('All OpenAI models failed');
    }

    const text = response.choices[0]?.message?.content;

    if (!text) {
      log('red', '❌', 'No content received from OpenAI');
      return false;
    }

    log('green', '✅', 'OpenAI API Response received!');
    log('green', '✅', `Response length: ${text.length} characters`);

    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      log('green', '✅', 'Response is valid JSON');
      log('green', '✅', `Lesson Title: ${json.lessonTitle}`);
      return true;
    } catch (e) {
      log('yellow', '⚠️ ', 'Response is not valid JSON, but API works');
      log('yellow', '⚠️ ', `First 100 chars: ${text.substring(0, 100)}`);
      return true;
    }
  } catch (error) {
    log('red', '❌', `OpenAI API Error: ${error.message}`);
    if (error.status === 429) {
      log('yellow', '⚠️ ', 'Rate limit exceeded. Wait a moment and try again.');
    }
    return false;
  }
}

async function testGroq() {
  log('cyan', '━━━', '━'.repeat(60));
  log('bright', '🔍', 'Testing Groq API');
  log('cyan', '━━━', '━'.repeat(60));

  if (!GROQ_API_KEY) {
    log('red', '❌', 'GROQ_API_KEY not found in .env');
    return false;
  }

  try {
    log('blue', '📤', 'Initializing Groq client...');
    const groq = new Groq({
      apiKey: GROQ_API_KEY
    });

    log('blue', '📤', 'Sending request to Groq API...');
    let response;
    try {
      response = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator. Generate lesson plans in valid JSON format.'
          },
          {
            role: 'user',
            content: testPrompt
          }
        ],
        model: 'mixtral-8x7b-32768',
        temperature: 0.7,
        max_tokens: 1000
      });
    } catch (modelError) {
      if (modelError.message?.includes('decommissioned')) {
        log('yellow', '⚠️ ', 'Mixtral model decommissioned, trying Llama...');
        response = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are an expert educator. Generate lesson plans in valid JSON format.'
            },
            {
              role: 'user',
              content: testPrompt
            }
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.7,
          max_tokens: 1000
        });
      } else {
        throw modelError;
      }
    }

    const text = response.choices[0]?.message?.content;

    if (!text) {
      log('red', '❌', 'No content received from Groq');
      return false;
    }

    log('green', '✅', 'Groq API Response received!');
    log('green', '✅', `Response length: ${text.length} characters`);

    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      log('green', '✅', 'Response is valid JSON');
      log('green', '✅', `Lesson Title: ${json.lessonTitle}`);
      return true;
    } catch (e) {
      log('yellow', '⚠️ ', 'Response is not valid JSON, but API works');
      log('yellow', '⚠️ ', `First 100 chars: ${text.substring(0, 100)}`);
      return true;
    }
  } catch (error) {
    log('red', '❌', `Groq API Error: ${error.message}`);
    if (error.status === 429) {
      log('yellow', '⚠️ ', 'Rate limit exceeded. Wait a moment and try again.');
    }
    return false;
  }
}

async function runAllTests() {
  log('bright', '🚀', 'Starting Multi-AI API Tests...\n');

  const results = {
    gemini: false,
    openai: false,
    groq: false
  };

  // Run all tests in sequence
  log('blue', 'ℹ️ ', 'This will test each API one by one...\n');

  results.gemini = await testGemini();
  log('', '', '');

  results.openai = await testOpenAI();
  log('', '', '');

  results.groq = await testGroq();
  log('', '', '');

  // Summary
  log('cyan', '━━━', '━'.repeat(60));
  log('bright', '📊', 'Test Summary');
  log('cyan', '━━━', '━'.repeat(60));

  log(results.gemini ? 'green' : 'red', results.gemini ? '✅' : '❌', `Gemini: ${results.gemini ? 'WORKING' : 'FAILED'}`);
  log(results.openai ? 'green' : 'red', results.openai ? '✅' : '❌', `OpenAI: ${results.openai ? 'WORKING' : 'FAILED'}`);
  log(results.groq ? 'green' : 'red', results.groq ? '✅' : '❌', `Groq: ${results.groq ? 'WORKING' : 'FAILED'}`);

  const passedCount = Object.values(results).filter(r => r).length;
  log('bright', '📈', `\nPassed: ${passedCount}/3 tests`);

  if (passedCount === 3) {
    log('green', '🎉', 'All APIs are working! You can use them in your application.');
  } else if (passedCount > 0) {
    log('yellow', '⚠️ ', `${passedCount} API(s) working. Check failed ones for errors.`);
  } else {
    log('red', '❌', 'No APIs are working. Check your API keys and internet connection.');
  }

  log('cyan', '━━━', '━'.repeat(60));
  process.exit(passedCount === 3 ? 0 : 1);
}

runAllTests();
