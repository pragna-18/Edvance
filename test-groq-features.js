import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Test credentials (use an actual user token if needed)
const token = 'test-token-for-testing';
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

// Sample lesson plan for testing
const samplePlan = {
  title: 'Introduction to Python Programming',
  subject: 'Computer Science',
  topic: 'Python Basics',
  grade: '10',
  duration: 45,
  content: {
    learningObjectives: [
      'Understand basic Python syntax',
      'Write simple programs',
      'Use variables and data types'
    ],
    materials: ['Laptop', 'Python IDE', 'Code samples'],
    activities: [
      'Code-along with teacher',
      'Pair programming exercise',
      'Quiz on concepts'
    ],
    assessment: 'Quiz and practical coding assignment'
  }
};

async function testCurriculumAlignment() {
  console.log('\n📝 Testing Curriculum Alignment with Groq API...');
  try {
    // First, we need a real plan ID from the database
    // For testing, we'll try to create one or use an existing one
    const testPlanId = '41c19aeb-de0d-423b-8e29-dde7cdcf5668'; // From logs
    
    const response = await axios.post(
      `${API_URL}/curriculum/check-alignment/${testPlanId}`,
      {
        curriculumStandards: ['Common Core', 'NGSS'],
        country: 'US',
        gradeLevel: 'Grade 10'
      },
      { headers }
    );
    
    console.log('✅ Curriculum Alignment Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Curriculum Alignment Error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.error || error.message);
    console.error('Details:', error.response?.data?.message);
    return false;
  }
}

async function testTranslation() {
  console.log('\n🌐 Testing Translation with Groq API...');
  try {
    const testPlanId = 'd6503049-9365-42e4-aa62-aad4e3932e44'; // From logs
    
    const response = await axios.post(
      `${API_URL}/language/translate/${testPlanId}`,
      {
        sourceLanguage: 'en',
        targetLanguage: 'hi'
      },
      { headers }
    );
    
    console.log('✅ Translation Response:');
    console.log('Success:', response.data.success);
    console.log('Language:', response.data.language);
    if (response.data.translatedContent) {
      console.log('Translated Content Keys:', Object.keys(response.data.translatedContent));
    }
    return true;
  } catch (error) {
    console.error('❌ Translation Error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.error || error.message);
    console.error('Details:', error.response?.data?.message);
    return false;
  }
}

async function testCognitiveLoad() {
  console.log('\n🧠 Testing Cognitive Load Analysis with Groq API...');
  try {
    const testPlanId = 'd6503049-9365-42e4-aa62-aad4e3932e44'; // From logs
    
    const response = await axios.post(
      `${API_URL}/cognitive-load/analyze/${testPlanId}`,
      {},
      { headers }
    );
    
    console.log('✅ Cognitive Load Analysis Response:');
    if (response.data.analysis) {
      console.log('Overall Load:', response.data.analysis.overallLoad);
      console.log('Load Score:', response.data.analysis.loadScore);
      console.log('Intrinsic Load Score:', response.data.analysis.intrinsicLoad?.score);
      console.log('Extraneous Load Score:', response.data.analysis.extraneousLoad?.score);
      console.log('Germane Load Score:', response.data.analysis.germaneLoad?.score);
      console.log('Recommendations Count:', response.data.analysis.recommendations?.length);
    }
    return true;
  } catch (error) {
    console.error('❌ Cognitive Load Analysis Error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.error || error.message);
    console.error('Details:', error.response?.data?.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Groq API Feature Tests...');
  console.log('=====================================');
  
  const results = {
    curriculumAlignment: await testCurriculumAlignment(),
    translation: await testTranslation(),
    cognitiveLoad: await testCognitiveLoad()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('=====================================');
  console.log('✅ Curriculum Alignment:', results.curriculumAlignment ? 'PASSED' : 'FAILED');
  console.log('✅ Translation:', results.translation ? 'PASSED' : 'FAILED');
  console.log('✅ Cognitive Load Analysis:', results.cognitiveLoad ? 'PASSED' : 'FAILED');
  
  const passed = Object.values(results).filter(r => r).length;
  console.log(`\nTotal: ${passed}/3 tests passed`);
  
  if (passed === 3) {
    console.log('\n🎉 All tests passed! Groq API integration successful!');
  } else {
    console.log('\n⚠️  Some tests failed. Check errors above.');
  }
}

runAllTests().catch(console.error);
