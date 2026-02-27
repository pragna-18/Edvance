/**
 * Performance Test: Original vs Optimized ML Prediction
 * Measures time improvement from model caching and persistent process
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON_EXECUTABLE = process.env.PYTHON_PATH || 'C:\\Users\\User\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';

// Test lesson plan
const testLessonPlan = {
  title: 'Advanced Regression Techniques in Machine Learning',
  subject: 'Computer Science',
  grade: '12',
  duration: 90,
  objectives: [
    'Understand linear regression principles',
    'Learn polynomial regression',
    'Explore ridge and lasso regularization',
    'Apply regression models to real data'
  ],
  materials: [
    'Python notebook',
    'Scikit-learn library',
    'Real estate dataset',
    'Jupyter environment'
  ],
  activities: [
    'Interactive coding demo (25 mins)',
    'Pair programming activity (35 mins)',
    'Model comparison workshop (20 mins)',
    'Real-world application project (10 mins)'
  ],
  assessments: [
    'Quiz on concepts',
    'Code review',
    'Model performance comparison',
    'Project submission'
  ],
  differentiation: [
    'Advanced: Explore neural networks',
    'Standard: Follow main curriculum',
    'Support: Simplified examples'
  ],
  content: 'This comprehensive lesson covers advanced regression techniques in machine learning including linear regression, polynomial regression, ridge regression, lasso regression, and elastic net. Students will learn when to use each technique and how to implement them in Python using scikit-learn.'
};

/**
 * Test original approach (new process each time)
 */
async function testOriginalApproach() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TESTING ORIGINAL APPROACH (New Process Each Time)');
  console.log('='.repeat(60));

  const times = [];

  for (let i = 1; i <= 3; i++) {
    console.log(`\n🔄 Prediction ${i}...`);
    const startTime = Date.now();

    try {
      await new Promise((resolve, reject) => {
        const pythonProcess = spawn(PYTHON_EXECUTABLE, ['node_bridge.py'], {
          cwd: 'c:\\Users\\User\\Desktop\\PrepSmart-C\\ml-model',
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let result = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
          result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          error += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Process exited with code ${code}`));
          } else {
            try {
              const prediction = JSON.parse(result);
              resolve(prediction);
            } catch (e) {
              reject(e);
            }
          }
        });

        pythonProcess.stdin.write(JSON.stringify(testLessonPlan));
        pythonProcess.stdin.end();

        setTimeout(() => {
          pythonProcess.kill();
          reject(new Error('Timeout'));
        }, 15000);
      });

      const elapsed = Date.now() - startTime;
      times.push(elapsed);
      console.log(`   ✅ Completed in ${elapsed}ms`);

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`\n📊 Average time: ${avgTime.toFixed(0)}ms`);
  return avgTime;
}

/**
 * Test optimized approach (persistent process)
 */
async function testOptimizedApproach() {
  console.log('\n' + '='.repeat(60));
  console.log('⚡ TESTING OPTIMIZED APPROACH (Persistent Process)');
  console.log('='.repeat(60));

  return new Promise((resolve, reject) => {
    let pythonProcess = null;
    let processReady = false;
    const times = [];
    const pendingRequests = new Map();
    let requestId = 0;

    try {
      pythonProcess = spawn(PYTHON_EXECUTABLE, ['node_bridge_persistent.py'], {
        cwd: 'c:\\Users\\User\\Desktop\\PrepSmart-C\\ml-model',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      pythonProcess.stdout.on('data', (data) => {
        const responses = data.toString().trim().split('\n').filter(l => l);
        responses.forEach(response => {
          if (response.includes('READY')) {
            console.log('✅ Python process initialized\n');
            processReady = true;
            runPredictions();
          } else if (processReady) {
            try {
              const msg = JSON.parse(response);
              if (msg.id !== undefined && pendingRequests.has(msg.id)) {
                const { startTime } = pendingRequests.get(msg.id);
                pendingRequests.delete(msg.id);

                const elapsed = Date.now() - startTime;
                times.push(elapsed);
                console.log(`   ✅ Prediction ${msg.id} completed in ${elapsed}ms`);

                // Check if all predictions are done
                if (times.length === 3) {
                  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
                  console.log(`\n📊 Average time: ${avgTime.toFixed(0)}ms`);
                  pythonProcess.kill();
                  resolve(avgTime);
                }
              }
            } catch (e) {
              console.error('Parse error:', e.message);
            }
          }
        });
      });

      pythonProcess.stderr.on('data', (data) => {
        if (!data.toString().includes('READY')) {
          console.error('Python stderr:', data.toString());
        }
      });

      pythonProcess.on('close', () => {
        if (times.length < 3) {
          reject(new Error('Process closed early'));
        }
      });

      function runPredictions() {
        for (let i = 1; i <= 3; i++) {
          const id = i;
          const request = {
            id,
            lesson_plan: testLessonPlan
          };

          console.log(`🔄 Prediction ${i}...`);
          pendingRequests.set(id, { startTime: Date.now() });
          pythonProcess.stdin.write(JSON.stringify(request) + '\n');
        }
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Test timeout'));
      }, 30000);

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   ML Model Performance: Original vs Optimized Comparison   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    const originalTime = await testOriginalApproach();
    const optimizedTime = await testOptimizedApproach();

    console.log('\n' + '='.repeat(60));
    console.log('📈 RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Original (new process each time):  ${originalTime.toFixed(0)}ms`);
    console.log(`Optimized (persistent process):   ${optimizedTime.toFixed(0)}ms`);
    console.log(`\n🚀 Performance Improvement: ${(originalTime / optimizedTime).toFixed(1)}x faster!`);
    console.log(`💰 Time Saved per Prediction:    ${(originalTime - optimizedTime).toFixed(0)}ms`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
runAllTests();
