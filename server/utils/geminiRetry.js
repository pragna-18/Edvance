/**
 * Retry utility for Gemini API calls
 * Implements exponential backoff for handling rate limits and service unavailability
 */

const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000; // 1 second
const MAX_DELAY = 15000; // 15 seconds

/**
 * Execute a Gemini API call with automatic retry on 503 errors
 * @param {Function} apiCall - Async function that makes the API call
 * @param {string} operationName - Name of the operation for logging
 * @returns {Promise} Result from the API call
 */
async function retryWithBackoff(apiCall, operationName = 'API call') {
  let lastError;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`[${operationName}] Attempt ${attempt + 1}/${MAX_RETRIES}`);
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Check if it's a 503 Service Unavailable error
      const is503Error = error.message?.includes('503') || 
                         error.message?.includes('Service Unavailable') ||
                         error.message?.includes('overloaded');
      
      // Only retry on 503 errors, not on other errors like auth failures
      if (!is503Error || attempt === MAX_RETRIES - 1) {
        throw error;
      }
      
      // Calculate backoff delay with exponential increase
      const delay = Math.min(
        INITIAL_DELAY * Math.pow(2, attempt) + Math.random() * 1000,
        MAX_DELAY
      );
      
      console.warn(
        `[${operationName}] Received 503 error. Retrying in ${Math.round(delay)}ms... ` +
        `(Attempt ${attempt + 1}/${MAX_RETRIES - 1})`
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Execute a model generation with retry
 * @param {Object} model - Gemini model instance
 * @param {string} prompt - The prompt to send to the model
 * @param {string} operationName - Name of the operation for logging
 * @returns {Promise} Model response
 */
async function generateWithRetry(model, prompt, operationName = 'Generation') {
  return retryWithBackoff(
    async () => {
      const result = await model.generateContent(prompt);
      return result;
    },
    operationName
  );
}

export { retryWithBackoff, generateWithRetry, MAX_RETRIES };
