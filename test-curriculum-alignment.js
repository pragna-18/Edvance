import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Test with a valid token (you can use any token for testing)
const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MTU2YTI4YS01ZDU3LTRkNTYtYTU5MC1hNDI5MDc4MmRlZTAiLCJlbWFpbCI6InRlYWNoZXJAZWR2YW5jZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MDQ0MjQzMjUsImV4cCI6OTk5OTk5OTk5OX0.test';

const headers = {
  'Authorization': token,
  'Content-Type': 'application/json'
};

async function testCurriculumAlignment() {
  console.log('\n📝 Testing Curriculum Alignment Endpoint...\n');
  
  try {
    const planId = '71735c73-4988-49dd-a977-0a5a76fcd1a9';
    
    console.log(`🔍 Testing with Plan ID: ${planId}`);
    console.log(`🌐 URL: ${API_URL}/curriculum/check-alignment/${planId}`);
    console.log(`⏱️  Timeout: 35 seconds\n`);
    
    const response = await axios.post(
      `${API_URL}/curriculum/check-alignment/${planId}`,
      {
        country: 'US',
        gradeLevel: 'Grade 10'
      },
      {
        headers,
        timeout: 35000
      }
    );
    
    console.log('✅ SUCCESS! Response received:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error occurred:');
    console.error('Full error object:', JSON.stringify({
      code: error.code,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    }, null, 2));
  }
}

testCurriculumAlignment();
