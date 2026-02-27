/**
 * Health Score Predictor - Optimized Version
 * Keeps Python process persistent for ~10x faster predictions
 * First prediction: ~1.5s (model loads once)
 * Subsequent predictions: <100ms each
 * Enhanced error handling and fallback mechanisms
 */

import { spawn, spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to Python bridge script
const PYTHON_BRIDGE = path.join(__dirname, '../../ml-model/node_bridge_persistent.py');
const ML_MODEL_DIR = path.join(__dirname, '../../ml-model');

/**
 * Find Python executable path
 */
function getPythonExecutable() {
  // Try to use venv python first, then fall back to system python
  const venvPath = path.join(__dirname, '../../ml-model/venv/Scripts/python.exe');
  if (existsSync(venvPath)) {
    return venvPath;
  }
  // Fall back to 'python' in PATH
  return 'python';
}

const PYTHON_EXECUTABLE = getPythonExecutable();

// Global persistent Python process
let pythonProcess = null;
let processReady = false;
let messageQueue = [];
let requestId = 0;
const pendingRequests = new Map();

const PROCESS_TIMEOUT = 60000;  // 60 seconds for predictions (scikit-learn can be slow)
const INIT_TIMEOUT = 45000;   // 45 seconds for initialization (model loading)

/**
 * Start and maintain persistent Python process
 */
export function initializePythonProcess() {
  if (pythonProcess) return Promise.resolve();

  return new Promise((resolve, reject) => {
    try {
      console.log('🚀 Starting persistent Python process for health score predictions...');
      console.log(`   Python: ${PYTHON_EXECUTABLE}`);
      console.log(`   Bridge: ${PYTHON_BRIDGE}`);
      console.log(`   Working Dir: ${ML_MODEL_DIR}`);
      
      // On Windows, we need to use the full path or let CMD find python
      // When shell: false, Node will look for 'python' executable in cwd + PATH
      pythonProcess = spawn(PYTHON_EXECUTABLE, [PYTHON_BRIDGE], {
        cwd: ML_MODEL_DIR,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
        shell: process.platform === 'win32',  // Use shell on Windows for PATH lookup
        timeout: INIT_TIMEOUT,
        env: { ...process.env }  // Pass full environment including PATH
      });

      let startupOutput = '';
      let initTimeout = setTimeout(() => {
        if (!processReady) {
          pythonProcess?.kill();
          pythonProcess = null;
          reject(new Error(`Python process initialization timeout (>${INIT_TIMEOUT}ms)`));
        }
      }, INIT_TIMEOUT);

      // Handle stdout
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        
        if (output === 'READY') {
          clearTimeout(initTimeout);
          console.log('✅ Python process initialized and ready!');
          processReady = true;
          
          // Process any queued messages
          while (messageQueue.length > 0) {
            const msg = messageQueue.shift();
            try {
              sendToPython(msg);
            } catch (e) {
              console.error('Failed to send queued message:', e);
            }
          }
          
          resolve();
          return;
        }
        
        // Parse regular responses
        const responses = output.split('\n').filter(l => l.trim());
        responses.forEach(response => {
          try {
            const msg = JSON.parse(response);
            if (msg.id !== undefined && pendingRequests.has(msg.id)) {
              const { resolve: resolveFn } = pendingRequests.get(msg.id);
              pendingRequests.delete(msg.id);
              resolveFn(msg);
            }
          } catch (e) {
            console.error('Failed to parse Python response:', response, e);
          }
        });
      });

      // Handle errors
      pythonProcess.stderr.on('data', (data) => {
        const stderr = data.toString().trim();
        // Don't kill process for debug/info messages
        if (stderr.startsWith('[INIT]')) {
          console.log('ℹ️  Python:', stderr);
          return;
        }
        console.error('🔴 Python stderr:', stderr);
      });

      // Handle process exit
      pythonProcess.on('close', (code) => {
        clearTimeout(initTimeout);
        
        if (!processReady) {
          // Process died during initialization - resolve with graceful failure
          console.warn('⚠️ Python process failed during initialization (code:', code + ')');
          pythonProcess = null;
          processReady = false;
          reject(new Error(`Python process initialization failed with code ${code}`));
        } else {
          // Process died after initialization
          console.error('⚠️ Python process died with code:', code);
          pythonProcess = null;
          processReady = false;
          
          // Reject all pending requests
          const requests = Array.from(pendingRequests.entries());
          pendingRequests.clear();
          
          requests.forEach(([id, { reject }]) => {
            reject(new Error(`Python process terminated with code ${code}`));
          });
        }
      });

      pythonProcess.on('error', (err) => {
        clearTimeout(initTimeout);
        console.error('🔴 Python process error:', err.code, err.message);
        console.error('   Error details:', err);
        pythonProcess = null;
        processReady = false;
        reject(new Error(`Failed to spawn Python process: ${err.code} - ${err.message}`));
      });

    } catch (err) {
      console.error('🔴 Failed to spawn Python process:', err);
      reject(err);
    }
  });
}

/**
 * Send message to persistent Python process
 */
function sendToPython(message) {
  if (!pythonProcess) {
    throw new Error('Python process not initialized');
  }
  
  if (!processReady) {
    messageQueue.push(message);
    return;
  }

  try {
    pythonProcess.stdin.write(JSON.stringify(message) + '\n');
  } catch (error) {
    console.error('Error writing to Python process:', error);
    throw new Error('Failed to send message to Python process');
  }
}

/**
 * Make prediction with persistent Python process
 */
export async function predictHealthScoreOptimized(lessonPlan) {
  try {
    // Validate input
    if (!lessonPlan || typeof lessonPlan !== 'object') {
      throw new Error('lessonPlan must be a valid object');
    }

    // Initialize process if needed
    if (!pythonProcess) {
      await initializePythonProcess();
    }

    // Create request with unique ID
    const id = ++requestId;
    const request = {
      id,
      lesson_plan: lessonPlan
    };

    // Send to Python with timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error(`Health score prediction timeout after ${PROCESS_TIMEOUT}ms`));
      }, PROCESS_TIMEOUT);

      pendingRequests.set(id, {
        resolve: (response) => {
          clearTimeout(timeout);
          
          // Check for errors in response
          if (response.error) {
            reject(new Error(response.error));
          } else if (!response.result) {
            reject(new Error('No result in Python response'));
          } else {
            // Validate result structure
            const result = response.result;
            if (typeof result.score !== 'number' || result.score < 1 || result.score > 10) {
              console.warn('⚠️ Invalid score returned:', result.score);
              result.score = Math.max(1, Math.min(10, result.score || 5));
            }
            resolve(result);
          }
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });

      try {
        sendToPython(request);
      } catch (error) {
        pendingRequests.delete(id);
        clearTimeout(timeout);
        reject(error);
      }
    });

  } catch (error) {
    console.error('Prediction error:', error);
    throw error;
  }
}

/**
 * Gracefully shutdown Python process
 */
export function shutdownPythonProcess() {
  if (pythonProcess) {
    console.log('Shutting down Python process...');
    try {
      pythonProcess.kill();
    } catch (e) {
      console.warn('Error killing Python process:', e);
    }
    pythonProcess = null;
    processReady = false;
    messageQueue = [];
    pendingRequests.clear();
  }
}

/**
 * Fallback scoring when ML model unavailable
 */
function fallbackHealthScore(lessonPlan) {
  let score = 4;

  // Scoring rubric
  const objectives = lessonPlan.objectives || [];
  const materials = lessonPlan.materials || [];
  const activities = lessonPlan.activities || [];
  const assessments = lessonPlan.assessments || [];
  const differentiation = lessonPlan.differentiation || [];
  const duration = lessonPlan.duration || 45;
  const content = lessonPlan.content || '';

  // Calculate components
  if (Array.isArray(objectives)) {
    if (objectives.length >= 5) score += 2;
    else if (objectives.length >= 3) score += 1.5;
    else if (objectives.length >= 2) score += 1;
  }

  if (Array.isArray(materials)) {
    if (materials.length >= 4) score += 1.5;
    else if (materials.length >= 2) score += 1;
  }

  if (Array.isArray(activities)) {
    if (activities.length >= 4) score += 2;
    else if (activities.length >= 3) score += 1.5;
    else if (activities.length >= 2) score += 1;
  }

  if (Array.isArray(assessments)) {
    if (assessments.length >= 3) score += 1.5;
    else if (assessments.length >= 2) score += 1;
    else if (assessments.length >= 1) score += 0.5;
  }

  if (differentiation && (Array.isArray(differentiation) ? differentiation.length > 0 : differentiation)) {
    score += 1;
  }

  if (duration >= 60) score += 1;
  else if (duration >= 45) score += 0.5;

  const contentLength = String(content).split(' ').length;
  if (contentLength >= 1500) score += 0.5;
  else if (contentLength >= 500) score += 0.25;

  score = Math.max(1, Math.min(10, score));

  return {
    score: parseFloat(score.toFixed(1)),
    features: {
      num_objectives: Array.isArray(objectives) ? objectives.length : 0,
      num_materials: Array.isArray(materials) ? materials.length : 0,
      num_activities: Array.isArray(activities) ? activities.length : 0,
      num_assessments: Array.isArray(assessments) ? assessments.length : 0,
      has_differentiation: differentiation && (Array.isArray(differentiation) ? differentiation.length > 0 : true) ? 1 : 0,
      duration: duration || 45,
      content_words: String(content).split(' ').length
    },
    reasoning: ['Fallback scoring used - ML model unavailable'],
    source: 'fallback',
    elapsed: 0
  };
}

/**
 * Predict health score with fallback
 */
export async function predictHealthScoreWithFallback(lessonPlan) {
  try {
    const startTime = Date.now();
    const prediction = await predictHealthScoreOptimized(lessonPlan);
    const elapsed = Date.now() - startTime;
    
    console.log(`✅ ML Model Score: ${prediction.score} (${elapsed}ms)`);
    return {
      ...prediction,
      source: 'ml_model',
      elapsed
    };
  } catch (error) {
    console.warn(`⚠️ ML Model failed (${error.message}), using fallback:`, error);
    const fallback = fallbackHealthScore(lessonPlan);
    console.log(`✅ Fallback Score: ${fallback.score}`);
    return fallback;
  }
}

/**
 * Batch predictions
 */
export async function predictHealthScoreBatch(lessonPlans) {
  try {
    const predictions = await Promise.allSettled(
      lessonPlans.map(plan => predictHealthScoreWithFallback(plan))
    );
    
    return predictions.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.warn(`Batch prediction ${index} failed:`, result.reason);
        return fallbackHealthScore(lessonPlans[index]);
      }
    });
  } catch (error) {
    console.error('Batch prediction error:', error);
    return lessonPlans.map(plan => fallbackHealthScore(plan));
  }
}

export default {
  predictHealthScoreOptimized,
  predictHealthScoreWithFallback,
  predictHealthScoreBatch,
  initializePythonProcess,
  shutdownPythonProcess
};
