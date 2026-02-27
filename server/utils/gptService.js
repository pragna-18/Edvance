import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generate lesson plan using OpenAI GPT API
 * @param {string} subject - Subject of the lesson
 * @param {string} gradeLevel - Grade level for the lesson
 * @param {string} topic - Topic of the lesson
 * @param {string} objectives - Learning objectives
 * @param {string} duration - Duration of the lesson
 * @returns {Promise<string>} Generated lesson plan
 */
export const generateLessonPlanWithGPT = async (
  subject,
  gradeLevel,
  topic,
  objectives,
  duration
) => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
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
      OPENAI_API_URL,
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert educational curriculum designer helping teachers create comprehensive lesson plans.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    }

    throw new Error('Unexpected response format from OpenAI API');
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    throw new Error(`OpenAI API failed: ${error.message}`);
  }
};

/**
 * Get available GPT models
 * @returns {Array} List of available models
 */
export const getGPTModels = () => {
  return [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Most capable, best quality responses',
      speed: 'Moderate',
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: 'High intelligence, fast',
      speed: 'Fast',
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and efficient, good quality',
      speed: 'Very Fast',
    },
  ];
};

export default {
  generateLessonPlanWithGPT,
  getGPTModels,
};
