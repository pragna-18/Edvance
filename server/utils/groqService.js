import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Generate lesson plan using Groq API (ultra-fast)
 * @param {string} subject - Subject of the lesson
 * @param {string} gradeLevel - Grade level for the lesson
 * @param {string} topic - Topic of the lesson
 * @param {string} objectives - Learning objectives
 * @param {string} duration - Duration of the lesson
 * @returns {Promise<string>} Generated lesson plan
 */
export const generateLessonPlanWithGroq = async (
  subject,
  gradeLevel,
  topic,
  objectives,
  duration
) => {
  try {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const prompt = `
Generate a comprehensive lesson plan with the following details:

Subject: ${subject}
Grade Level: ${gradeLevel}
Topic: ${topic}
Learning Objectives: ${objectives}
Duration: ${duration}

Please provide:
1. Introduction/Hook
2. Main Content (broken into sections)
3. Activities & Engagement strategies
4. Assessment methods
5. Homework/Extension activities
6. Resources needed
7. Differentiation strategies

Format the response in a clear, structured manner suitable for teachers.
`;

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    }

    throw new Error('Unexpected response format from Groq API');
  } catch (error) {
    console.error('Groq API Error:', error.message);
    throw new Error(`Groq API failed: ${error.message}`);
  }
};

/**
 * Get available Groq models
 * @returns {Array} List of available models
 */
export const getGroqModels = () => {
  return [
    {
      id: 'mixtral-8x7b-32768',
      name: 'Mixtral 8x7B',
      description: 'Ultra-fast, balanced quality',
      speed: 'Extremely Fast',
    },
    {
      id: 'llama-3.1-70b-versatile',
      name: 'Llama 3.1 70B',
      description: 'High quality, good performance',
      speed: 'Very Fast',
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B',
      description: 'Lightweight, fastest response',
      speed: 'Lightning Fast',
    },
  ];
};

export default {
  generateLessonPlanWithGroq,
  getGroqModels,
};
