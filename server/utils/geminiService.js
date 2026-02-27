import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Generate lesson plan using Google Gemini API
 * @param {string} subject - Subject of the lesson
 * @param {string} gradeLevel - Grade level for the lesson
 * @param {string} topic - Topic of the lesson
 * @param {string} objectives - Learning objectives
 * @param {string} duration - Duration of the lesson in minutes
 * @returns {Promise<string>} Generated lesson plan
 */
export const generateLessonPlanWithGemini = async (
  subject,
  gradeLevel,
  topic,
  objectives,
  duration
) => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Try different model names - using models that are actually available
    const modelNames = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-pro',
      'gemini-pro-latest',
      'gemini-flash-latest',
    ];

    let model = null;
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Gemini: Using model ${modelName}`);
        break;
      } catch (error) {
        console.warn(`Gemini: Model ${modelName} not available, trying next...`);
        continue;
      }
    }

    if (!model) {
      throw new Error('No Gemini model available');
    }

    const prompt = `Create a comprehensive lesson plan for the following:
Subject: ${subject}
Grade Level: ${gradeLevel}
Topic: ${topic}
Learning Objectives: ${objectives}
Duration: ${duration} minutes

Please provide a detailed lesson plan including:
1. Lesson Title
2. Learning Objectives
3. Materials Needed
4. Lesson Introduction (5-10 minutes)
5. Main Content (with key concepts)
6. Interactive Activities
7. Assessment Methods
8. Closing/Summary
9. Homework/Follow-up
10. Differentiation Strategies

Format the response as a structured lesson plan.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text || 'Unable to generate lesson plan';
  } catch (error) {
    console.error('Error generating lesson plan with Gemini:', error.message);
    throw error;
  }
};

/**
 * Get available Gemini models
 * @returns {Array} Array of available model names
 */
export const getGeminiModels = () => {
  return ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro'];
};

export default {
  generateLessonPlanWithGemini,
  getGeminiModels,
};
