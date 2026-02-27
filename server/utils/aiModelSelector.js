import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { retryWithBackoff } from './geminiRetry.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Initialize AI clients
const geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
const groqClient = new Groq({ apiKey: GROQ_API_KEY });

console.log('🤖 AI Model Selector initialized');
console.log('✅ Gemini:', GEMINI_API_KEY ? '✓' : '✗');
console.log('✅ Groq:', GROQ_API_KEY ? '✓' : '✗');

/**
 * Generate lesson plan using selected AI model
 * @param {string} model - AI model to use ('gemini', 'groq')
 * @param {string} prompt - The lesson plan generation prompt
 * @returns {Promise<string>} Generated lesson plan content
 */
export async function generateLessonPlanWithAI(model, prompt) {
  console.log(`📤 Generating lesson plan with ${model}`);

  switch (model.toLowerCase()) {
    case 'gemini':
      return generateWithGemini(prompt);
    case 'groq':
      return generateWithGroq(prompt);
    default:
      throw new Error(`Invalid AI model: ${model}. Supported models: gemini, groq`);
  }
}

/**
 * Generate using Google Gemini API
 */
async function generateWithGemini(prompt) {
  try {
    console.log('📥 Calling Gemini API...');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const result = await retryWithBackoff(async () => {
      return await model.generateContent(prompt);
    }, 'Gemini Lesson Generation');

    const response = await result.response;
    let text = response.text();

    // Remove markdown code blocks if present
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

    console.log('✅ Gemini response received successfully');
    return text;
  } catch (error) {
    console.error('❌ Gemini error:', error.message);
    throw new Error(`Gemini API Error: ${error.message}`);
  }
}

/**
 * Generate using Groq API
 */
async function generateWithGroq(prompt) {
  try {
    console.log('📥 Calling Groq API...');
    
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set');
    }

    const response = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator and lesson planning assistant. Generate detailed, well-structured lesson plans in JSON format only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'mixtral-8x7b-32768',  // Primary model
      temperature: 0.7,
      max_tokens: 4000
    }).catch(async (error) => {
      // If mixtral is decommissioned, try llama
      if (error.message?.includes('decommissioned')) {
        console.log('⚠️  Mixtral model decommissioned, trying Llama model...');
        return await groqClient.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are an expert educator and lesson planning assistant. Generate detailed, well-structured lesson plans in JSON format only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'llama-3.3-70b-versatile',  // Fallback model
          temperature: 0.7,
          max_tokens: 4000
        });
      }
      throw error;
    });

    const text = response.choices[0]?.message?.content;

    if (!text) {
      throw new Error('No content received from Groq');
    }

    console.log('✅ Groq response received successfully');
    return text;
  } catch (error) {
    console.error('❌ Groq error:', error.message);
    throw new Error(`Groq API Error: ${error.message}`);
  }
}

/**
 * Get list of available AI models with their status
 */
export function getAvailableModels() {
  const models = [
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Fast, accurate, and powerful AI model from Google',
      available: !!GEMINI_API_KEY,
      model: 'gemini-2.0-flash'
    },
    {
      id: 'groq',
      name: 'Groq Mixtral',
      description: 'Fast and efficient open-source model',
      available: !!GROQ_API_KEY,
      model: 'mixtral-8x7b-32768'
    }
  ];

  return models;
}

/**
 * Validate that selected model is available
 */
export function validateModel(model) {
  const availableModels = getAvailableModels();
  const selectedModel = availableModels.find(m => m.id === model.toLowerCase());

  if (!selectedModel) {
    throw new Error(`Invalid AI model: ${model}`);
  }

  if (!selectedModel.available) {
    throw new Error(`AI model "${model}" is not available. API key not configured.`);
  }

  return selectedModel;
}

export default {
  generateLessonPlanWithAI,
  getAvailableModels,
  validateModel
};
