import axios from 'axios';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Generate lesson plan using Claude API
 * @param {string} subject - Subject of the lesson
 * @param {string} gradeLevel - Grade level for the lesson
 * @param {string} topic - Topic of the lesson
 * @param {string} objectives - Learning objectives
 * @param {string} duration - Duration of the lesson
 * @returns {Promise<string>} Generated lesson plan
 */
export const generateLessonPlanWithClaude = async (
  subject,
  gradeLevel,
  topic,
  objectives,
  duration
) => {
  try {
    if (!CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY is not configured');
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
      CLAUDE_API_URL,
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      }
    );

    if (response.data && response.data.content && response.data.content[0]) {
      return response.data.content[0].text;
    }

    throw new Error('Unexpected response format from Claude API');
  } catch (error) {
    console.error('Claude API Error:', error.message);
    throw new Error(`Claude API failed: ${error.message}`);
  }
};

/**
 * Get available Claude models
 * @returns {Array} List of available models
 */
export const getClaudeModels = () => {
  return [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      description: 'Most capable, best quality responses',
      speed: 'Moderate',
    },
    {
      id: 'claude-3-opus-20250219',
      name: 'Claude 3 Opus',
      description: 'High intelligence, detailed responses',
      speed: 'Slower',
    },
    {
      id: 'claude-3-haiku-20250307',
      name: 'Claude 3 Haiku',
      description: 'Fastest, suitable for quick tasks',
      speed: 'Very Fast',
    },
  ];
};

export default {
  generateLessonPlanWithClaude,
  getClaudeModels,
};
