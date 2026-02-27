/**
 * Health Score Predictor - Node.js Integration
 * Calls Python ML model via persistent child process for health score prediction
 * 
 * Usage:
 *   import { predictHealthScoreWithFallback } from './utils/healthScorePredictor.js';
 *   
 *   const lessonPlan = { ... };
 *   const result = await predictHealthScoreWithFallback(lessonPlan);
 *   console.log(result.score); // 8.5
 */

import {
  predictHealthScoreWithFallback,
  initializePythonProcess,
  shutdownPythonProcess
} from './healthScorePredictorOptimized.js';

// Initialize Python process on module load (non-blocking, graceful failure)
console.log('🚀 Initializing health score predictor...');
initializePythonProcess().catch(err => {
  console.warn('⚠️  Failed to initialize Python process on startup:', err.message);
  console.log('   Will use fallback scoring until ML model is available');
});

export { predictHealthScoreWithFallback, initializePythonProcess, shutdownPythonProcess };
