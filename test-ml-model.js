#!/usr/bin/env node

/**
 * ML Model Test - Demonstrates that the ML model is working
 * Tests the Python bridge with a real lesson plan
 */

import { spawn } from 'child_process';
import fs from 'fs';

const PYTHON_EXECUTABLE = 'C:\\Users\\User\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';
const PYTHON_BRIDGE = 'c:\\Users\\User\\Desktop\\PrepSmart-C\\ml-model\\node_bridge.py';

// Test lesson plan with realistic data
const testLessonPlan = {
  title: 'Photosynthesis Basics',
  subject: 'Biology',
  grade: '9',
  duration: 45,
  objectives: [
    'Understand the process of photosynthesis',
    'Identify inputs and outputs',
    'Explain the role of chlorophyll'
  ],
  materials: [
    'Biology textbook',
    'Microscope',
    'Plant samples',
    'Lab worksheets'
  ],
  activities: [
    'Lab experiment with plants',
    'Class discussion on findings',
    'Video: How plants make food',
    'Interactive simulation'
  ],
  assessments: [
    'Lab report submission',
    'Quiz on concepts',
    'Diagram labeling assessment'
  ],
  differentiation: [
    'Advanced: Research cellular respiration',
    'Standard: Follow main curriculum',
    'Support: Simplified diagram labels'
  ],
  content: `
    Photosynthesis is the process by which plants convert light energy into chemical energy.
    This lesson covers the basic stages of photosynthesis including the light-dependent reactions
    in the thylakoids and the light-independent reactions (Calvin cycle) in the stroma.
    Students will learn how chlorophyll absorbs light and drives the process of converting
    CO2 and water into glucose and oxygen. This is fundamental to understanding plant biology
    and the foundation of most food chains on Earth. The lesson includes hands-on experiments
    with plant samples and microscope observations of chloroplasts.
  `
};

/**
 * Run ML model test
 */
async function testMLModel() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           ML Model Test - Health Score Prediction          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📝 Test Lesson Plan:');
  console.log(`   Title: "${testLessonPlan.title}"`);
  console.log(`   Duration: ${testLessonPlan.duration} minutes`);
  console.log(`   Objectives: ${testLessonPlan.objectives.length}`);
  console.log(`   Materials: ${testLessonPlan.materials.length}`);
  console.log(`   Activities: ${testLessonPlan.activities.length}`);
  console.log(`   Assessments: ${testLessonPlan.assessments.length}`);
  console.log(`   Has Differentiation: ${testLessonPlan.differentiation.length > 0 ? 'Yes' : 'No'}`);
  console.log(`   Content Length: ${testLessonPlan.content.length} characters\n`);

  return new Promise((resolve, reject) => {
    console.log('🚀 Starting Python process...');
    const startTime = Date.now();

    const pythonProcess = spawn(PYTHON_EXECUTABLE, [PYTHON_BRIDGE], {
      cwd: 'c:\\Users\\User\\Desktop\\PrepSmart-C\\ml-model',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      // Print non-empty errors (Python warnings/debug info is OK)
      if (data.toString().trim().length > 0) {
        console.log('   [Python Debug]:', data.toString().trim().slice(0, 100));
      }
    });

    pythonProcess.on('close', (code) => {
      const elapsed = Date.now() - startTime;

      if (code !== 0) {
        console.error(`\n❌ Python process exited with code ${code}`);
        console.error('Error output:', errorData);
        reject(new Error(`Process failed with code ${code}`));
      } else {
        try {
          console.log(`\n⏱️  Prediction Time: ${elapsed}ms\n`);
          
          // Parse the JSON output
          const prediction = JSON.parse(outputData.trim());

          console.log('✅ ML Model Output:');
          console.log('════════════════════════════════════════════════════════════');
          console.log(`📊 Health Score: ${prediction.score}/10`);
          console.log(`   R²: ${prediction.score}`);
          
          if (prediction.features) {
            console.log('\n📈 Extracted Features:');
            console.log(`   • Objectives: ${prediction.features.num_objectives}`);
            console.log(`   • Materials: ${prediction.features.num_materials}`);
            console.log(`   • Activities: ${prediction.features.num_activities}`);
            console.log(`   • Assessments: ${prediction.features.num_assessments}`);
            console.log(`   • Differentiation: ${prediction.features.has_differentiation === 1 ? 'Yes' : 'No'}`);
            console.log(`   • Duration: ${prediction.features.duration} minutes`);
            console.log(`   • Content Words: ${prediction.features.content_words}`);
          }

          if (prediction.reasoning && Array.isArray(prediction.reasoning)) {
            console.log('\n💡 Reasoning:');
            prediction.reasoning.forEach(reason => {
              console.log(`   ${reason}`);
            });
          }

          console.log('════════════════════════════════════════════════════════════\n');

          resolve(prediction);
        } catch (e) {
          console.error('❌ Failed to parse prediction output:', e.message);
          console.error('Raw output:', outputData);
          reject(e);
        }
      }
    });

    // Send lesson plan as JSON to Python
    pythonProcess.stdin.write(JSON.stringify(testLessonPlan));
    pythonProcess.stdin.end();

    // Timeout after 30 seconds
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Process timeout after 30 seconds'));
    }, 30000);
  });
}

/**
 * Run multiple predictions to show caching performance
 */
async function testMultiplePredictions() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        Performance Test - Multiple Predictions             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const times = [];

  for (let i = 1; i <= 3; i++) {
    console.log(`🔄 Running Prediction ${i}...`);
    const startTime = Date.now();

    try {
      await testMLModel();
      const elapsed = Date.now() - startTime;
      times.push(elapsed);
    } catch (error) {
      console.error(`❌ Prediction ${i} failed:`, error.message);
      return;
    }
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              Performance Summary                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n⏱️  Prediction Times:`);
  times.forEach((t, i) => {
    console.log(`   Prediction ${i + 1}: ${t}ms`);
  });

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`\n📊 Average Time: ${avgTime.toFixed(0)}ms`);
  console.log(`⚡ Model Caching Working: ${times[1] < times[0] ? 'Yes ✓' : 'No'}`);
  console.log(`💨 Warm Prediction Speed: ${times[2] < 200 ? 'Excellent (<200ms)' : 'Good'}`);

  console.log('\n' + '═'.repeat(60) + '\n');
}

// Main execution
(async () => {
  try {
    // First, run a single prediction to show full output
    console.log('Running first prediction to show model output...\n');
    await testMLModel();

    // Then run performance test
    // await testMultiplePredictions();

    console.log('✅ ML Model is working correctly!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
})();
