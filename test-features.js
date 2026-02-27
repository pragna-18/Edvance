#!/usr/bin/env node
/**
 * Test script for curriculum alignment, translation, and cognitive load analysis
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Mock lesson plan for testing
const testLessonPlan = {
  title: 'Introduction to Photosynthesis',
  subject: 'Biology',
  grade: '9',
  duration: 45,
  topic: 'Plant Biology - Photosynthesis',
  content: {
    learningObjectives: [
      'Understand photosynthesis process',
      'Identify light and dark reactions',
      'Explain role of chlorophyll',
      'Apply photosynthesis concepts'
    ],
    materialsRequired: [
      'Textbook pages 45-50',
      'Microscope',
      'Plant samples',
      'Experimental setup'
    ],
    lessonFlow: {
      introduction: 'Begin with interactive demo of chlorophyll',
      activities: [
        'Live demonstration of photosynthesis',
        'Student lab experiment (20 mins)',
        'Group discussion of results'
      ],
      wrapUp: 'Summary quiz and exit ticket'
    },
    assessments: [
      'Lab report submission',
      'Concept quiz'
    ],
    differentiation: [
      'Extended reading for advanced students',
      'Simplified diagrams for struggling students'
    ]
  }
};

async function testAuthAndCreatePlan() {
  try {
    console.log('\n📋 Step 1: Creating test user...');
    
    // Register user
    const registerRes = await axios.post(`${API_BASE_URL}/auth/register`, {
      name: 'Test Teacher',
      email: `teacher_${Date.now()}@test.com`,
      password: 'Test@12345',
      role: 'teacher'
    });
    
    console.log('✅ User registered');
    const token = registerRes.data.token;
    
    // Create lesson plan
    console.log('📝 Step 2: Creating test lesson plan...');
    const planRes = await axios.post(`${API_BASE_URL}/lesson-plans`, testLessonPlan, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const planId = planRes.data.plan.id;
    console.log(`✅ Lesson plan created: ${planId}`);
    
    return { token, planId };
  } catch (error) {
    console.error('❌ Setup failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testCurriculumAlignment(token, planId) {
  try {
    console.log('\n🎯 Testing Curriculum Alignment...');
    console.log(`   Plan ID: ${planId}`);
    
    const response = await axios.post(
      `${API_BASE_URL}/curriculum/check-alignment/${planId}`,
      {
        country: 'US',
        gradeLevel: '9',
        curriculumStandards: ['NGSS-LS1-1', 'NGSS-LS1-6']
      },
      {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 30000
      }
    );
    
    if (response.data.success) {
      console.log('✅ Curriculum Alignment Working!');
      console.log(`   Score: ${response.data.alignment.alignmentScore}%`);
      console.log(`   Status: ${response.data.alignment.overallAlignment}`);
      console.log(`   Standards checked: ${response.data.alignment.alignedStandards?.length || 0}`);
      return true;
    } else {
      console.log('❌ Curriculum Alignment returned unexpected response');
      console.log(JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Curriculum Alignment Failed!');
    console.error(`   Error: ${error.response?.data?.message || error.message}`);
    console.error(`   Status: ${error.response?.status}`);
    return false;
  }
}

async function testTranslation(token, planId) {
  try {
    console.log('\n🌍 Testing Translation...');
    console.log(`   Plan ID: ${planId}`);
    console.log(`   Target Language: Hindi`);
    
    const response = await axios.post(
      `${API_BASE_URL}/language/translate/${planId}`,
      {
        targetLanguage: 'hi',
        sourceLanguage: 'en'
      },
      {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 30000
      }
    );
    
    if (response.data.success) {
      console.log('✅ Translation Working!');
      console.log(`   Language: ${response.data.language}`);
      console.log(`   Content translated: ${Object.keys(response.data.translatedContent).length} fields`);
      return true;
    } else {
      console.log('❌ Translation returned unexpected response');
      console.log(JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Translation Failed!');
    console.error(`   Error: ${error.response?.data?.message || error.message}`);
    console.error(`   Status: ${error.response?.status}`);
    return false;
  }
}

async function testCognitiveLoadAnalysis(token, planId) {
  try {
    console.log('\n🧠 Testing Cognitive Load Analysis...');
    console.log(`   Plan ID: ${planId}`);
    
    const response = await axios.post(
      `${API_BASE_URL}/cognitive-load/analyze/${planId}`,
      {},
      {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 30000
      }
    );
    
    if (response.data.success && response.data.analysis) {
      console.log('✅ Cognitive Load Analysis Working!');
      console.log(`   Overall Load: ${response.data.analysis.overallLoad}`);
      console.log(`   Load Score: ${response.data.analysis.loadScore}/100`);
      console.log(`   Recommendations: ${response.data.analysis.recommendations?.length || 0}`);
      return true;
    } else {
      console.log('❌ Cognitive Load Analysis returned unexpected response');
      console.log(JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Cognitive Load Analysis Failed!');
    console.error(`   Error: ${error.response?.data?.message || error.message}`);
    console.error(`   Status: ${error.response?.status}`);
    return false;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🧪 Testing EdVance Features');
  console.log('═══════════════════════════════════════════════════════════════');
  
  try {
    // Setup
    const { token, planId } = await testAuthAndCreatePlan();
    
    // Test features
    const results = {};
    results.curriculum = await testCurriculumAlignment(token, planId);
    results.translation = await testTranslation(token, planId);
    results.cognitiveLoad = await testCognitiveLoadAnalysis(token, planId);
    
    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  📊 Test Summary');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  ✓ Curriculum Alignment: ${results.curriculum ? '✅' : '❌'}`);
    console.log(`  ✓ Translation: ${results.translation ? '✅' : '❌'}`);
    console.log(`  ✓ Cognitive Load Analysis: ${results.cognitiveLoad ? '✅' : '❌'}`);
    
    const allPassed = Object.values(results).every(r => r);
    console.log(`\n  ${allPassed ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

runTests().catch(console.error);
