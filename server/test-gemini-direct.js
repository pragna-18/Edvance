// Direct API test to check available models
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDEIGf1uBs5sjn-zt0e3pBjgmBt5NrGM2s";

console.log('Testing Gemini API directly...');
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function listModels() {
  console.log('\n=== Listing Available Models ===\n');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  try {
    const response = await makeRequest(url);
    console.log('Status Code:', response.status);
    
    if (response.status === 200 && response.data.models) {
      console.log(`\nFound ${response.data.models.length} models:\n`);
      
      const generateModels = response.data.models.filter(m => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      generateModels.forEach(model => {
        const modelName = model.name.replace('models/', '');
        console.log(`✅ ${modelName}`);
        console.log(`   Display: ${model.displayName || 'N/A'}`);
        console.log('');
      });
      
      if (generateModels.length > 0) {
        const firstModel = generateModels[0].name.replace('models/', '');
        console.log(`\n🎯 Recommended model to use: ${firstModel}`);
        return generateModels.map(m => m.name.replace('models/', ''));
      } else {
        console.log('⚠️  No models support generateContent');
        return [];
      }
    } else {
      console.log('❌ Error response:');
      console.log(JSON.stringify(response.data, null, 2));
      
      if (response.data.error) {
        console.log('\nError details:');
        console.log('  Message:', response.data.error.message);
        console.log('  Status:', response.data.error.status);
        if (response.data.error.message?.includes('API key')) {
          console.log('\n⚠️  API Key issue detected. Please:');
          console.log('  1. Verify your API key is correct');
          console.log('  2. Check if Gemini API is enabled in Google Cloud Console');
          console.log('  3. Make sure the API key has the right permissions');
        }
      }
      return [];
    }
  } catch (error) {
    console.error('Request failed:', error.message);
    return [];
  }
}

async function testModel(modelName) {
  console.log(`\n=== Testing Model: ${modelName} ===\n`);
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
  
  const payload = JSON.stringify({
    contents: [{
      parts: [{
        text: "Say hello"
      }]
    }]
  });
  
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text || 'No text in response';
            console.log(`✅ SUCCESS!`);
            console.log(`   Response: ${text}`);
            resolve(true);
          } else {
            console.log(`❌ FAILED (Status: ${res.statusCode})`);
            console.log(`   Error: ${json.error?.message || data}`);
            resolve(false);
          }
        } catch (e) {
          console.log(`❌ FAILED - Could not parse response`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response: ${data.substring(0, 200)}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ FAILED - Request error: ${error.message}`);
      resolve(false);
    });
    
    req.write(payload);
    req.end();
  });
}

async function main() {
  const models = await listModels();
  
  if (models.length > 0) {
    console.log('\n=== Testing First Available Model ===');
    await testModel(models[0]);
  } else {
    console.log('\n⚠️  Could not find any available models.');
    console.log('\nPossible issues:');
    console.log('1. API key is invalid or expired');
    console.log('2. Gemini API is not enabled in Google Cloud Console');
    console.log('3. API key does not have required permissions');
    console.log('4. Account needs to enable Gemini API access');
    console.log('\nNext steps:');
    console.log('1. Go to: https://console.cloud.google.com/apis/library');
    console.log('2. Search for "Generative Language API"');
    console.log('3. Enable the API for your project');
    console.log('4. Verify your API key has access');
  }
}

main().catch(console.error);






