import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MTU2YTI4YS01ZDU3LTRkNTYtYTU5MC1hNDI5MDc4MmRlZTAiLCJlbWFpbCI6InRlYWNoZXJAZWR2YW5jZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MDQ0MjQzMjUsImV4cCI6OTk5OTk5OTk5OX0.test';
const headers = { 'Authorization': token, 'Content-Type': 'application/json' };

const planId = '71735c73-4988-49dd-a977-0a5a76fcd1a9';

async function testFeature(name, testFn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    const startTime = Date.now();
    const result = await testFn();
    const duration = Date.now() - startTime;
    console.log(`✅ ${name} - SUCCESS (${duration}ms)`);
    return { name, status: 'SUCCESS', duration };
  } catch (error) {
    console.error(`❌ ${name} - FAILED:`, error.message);
    return { name, status: 'FAILED', error: error.message };
  }
}

async function runTests() {
  const results = [];

  // Test 1: Quiz Generation
  results.push(await testFeature('Generate Quiz', async () => {
    const response = await axios.post(
      `${API_URL}/lesson-plans/${planId}/generate/quiz`,
      { numberOfQuestions: 5, difficulty: 'medium' },
      { headers, timeout: 40000 }
    );
    if (!response.data.quiz) throw new Error('No quiz in response');
    return response.data.quiz;
  }));

  // Test 2: Question Paper Generation
  results.push(await testFeature('Generate Question Paper', async () => {
    const response = await axios.post(
      `${API_URL}/lesson-plans/${planId}/generate/question-paper`,
      { totalMarks: 50, difficulty: 'medium' },
      { headers, timeout: 40000 }
    );
    if (!response.data.questionPaper) throw new Error('No question paper in response');
    return response.data.questionPaper;
  }));

  // Test 3: Translation
  results.push(await testFeature('Translate Lesson Plan', async () => {
    const response = await axios.post(
      `${API_URL}/language/translate/71735c73-4988-49dd-a977-0a5a76fcd1a9`,
      { sourceLanguage: 'en', targetLanguage: 'hi' },
      { headers, timeout: 40000 }
    );
    if (!response.data.translatedContent) throw new Error('No translated content');
    return response.data.translatedContent;
  }));

  // Test 4: Cognitive Load Analysis
  results.push(await testFeature('Analyze Cognitive Load', async () => {
    const response = await axios.post(
      `${API_URL}/cognitive-load/${planId}`,
      {},
      { headers, timeout: 40000 }
    );
    if (!response.data.analysis) throw new Error('No analysis in response');
    return response.data.analysis;
  }));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.status === 'SUCCESS').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  results.forEach(r => {
    const icon = r.status === 'SUCCESS' ? '✅' : '❌';
    const time = r.duration ? ` (${r.duration}ms)` : '';
    console.log(`${icon} ${r.name}: ${r.status}${time}`);
    if (r.error) console.log(`   Error: ${r.error}`);
  });
  
  console.log('='.repeat(60));
  console.log(`Total: ${successful} successful, ${failed} failed out of ${results.length} features`);
  console.log('='.repeat(60));
}

runTests().catch(console.error);
