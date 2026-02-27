import { generateLessonPlanWithGroq, getGroqModels } from './groqService.js';
import { generateLessonPlanWithGPT, getGPTModels } from './gptService.js';
import { generateLessonPlanWithGemini, getGeminiModels } from './geminiService.js';

/**
 * Generate lesson plan using the specified AI model
 * @param {string} aiModel - The AI model to use (claude, groq, gpt, gemini)
 * @param {string} subject - Subject of the lesson
 * @param {string} gradeLevel - Grade level for the lesson
 * @param {string} topic - Topic of the lesson
 * @param {string} objectives - Learning objectives
 * @param {string} duration - Duration of the lesson
 * @returns {Promise<string>} Generated lesson plan
 */
export const generateLessonPlanWithAI = async (
  aiModel,
  subject,
  gradeLevel,
  topic,
  objectives,
  duration
) => {
  try {
    switch (aiModel.toLowerCase()) {
      case 'groq':
        return await generateLessonPlanWithGroq(
          subject,
          gradeLevel,
          topic,
          objectives,
          duration
        );

      case 'gpt':
        return await generateLessonPlanWithGPT(
          subject,
          gradeLevel,
          topic,
          objectives,
          duration
        );

      case 'gemini':
        return await generateLessonPlanWithGemini(
          subject,
          gradeLevel,
          topic,
          objectives,
          duration
        );

      default:
        throw new Error(`Unknown AI model: ${aiModel}. Use: groq, gpt, or gemini`);
    }
  } catch (error) {
    console.error(`Error generating lesson plan with ${aiModel}:`, error.message);
    // Fallback to Gemini if other models fail
    if (aiModel.toLowerCase() !== 'gemini') {
      console.log('Falling back to Gemini...');
      return await generateLessonPlanWithGemini(
        subject,
        gradeLevel,
        topic,
        objectives,
        duration
      );
    }
    throw error;
  }
};

/**
 * Get all available AI models grouped by provider
 * @returns {Object} Object with models grouped by provider
 */
export const getAllAIModels = () => {
  return {
    groq: {
      provider: 'Groq',
      models: getGroqModels(),
      free: 'Unlimited',
      quality: 'Very Good',
    },
    gpt: {
      provider: 'OpenAI',
      models: getGPTModels(),
      free: '$5 trial',
      quality: 'Best',
    },
    gemini: {
      provider: 'Google',
      models: getGeminiModels(),
      free: '60 req/min',
      quality: 'Good',
    },
  };
};

/**
 * Get all available providers for UI dropdown
 * @returns {Array} Array of provider objects
 */
export const getAvailableProviders = () => {
  return [
    {
      id: 'groq',
      name: 'Mixtral 8x7B',
      provider: 'Groq',
      description: 'Ultra-fast, unlimited',
      icon: '⚡',
      speed: 'Extremely Fast',
      free_tier: 'Unlimited',
    },
    {
      id: 'gpt',
      name: 'GPT-4o',
      provider: 'OpenAI',
      description: 'Most capable, excellent quality',
      icon: '🚀',
      speed: 'Moderate',
      free_tier: '$5 trial',
    },
    {
      id: 'gemini',
      name: 'Gemini 1.5',
      provider: 'Google',
      description: 'Balanced, good for education',
      icon: '✨',
      speed: 'Fast',
      free_tier: '60 req/min',
    },
  ];
};

export default {
  generateLessonPlanWithAI,
  getAllAIModels,
  getAvailableProviders,
};
