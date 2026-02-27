// Quick test script to verify Gemini API access
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDEIGf1uBs5sjn-zt0e3pBjgmBt5NrGM2s";

console.log('Testing Gemini API...');
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');

if (!API_KEY) {
  console.error('ERROR: GEMINI_API_KEY not found in environment');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// First, list available models using the SDK
async function listAvailableModels() {
  try {
    console.log('\n=== Fetching Available Models ===\n');
    
    // Use the SDK's listModels method if available, otherwise try common model names
    // Note: The SDK might not have listModels, so we'll try common names
    const commonModelNames = [
      'gemini-1.5-flash-002',
      'gemini-1.5-pro-002', 
      'gemini-1.5-flash-001',
      'gemini-1.5-pro-001',
      'gemini-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro-vision',
      'models/gemini-1.5-flash-002',
      'models/gemini-1.5-pro-002'
    ];
    
    return commonModelNames;
  } catch (error) {
    console.error('Failed to list models:', error.message);
    return [];
  }
}

async function testModel(modelName) {
  try {
    // Remove 'models/' prefix if present
    const cleanModelName = modelName.replace(/^models\//, '');
    console.log(`Testing model: ${cleanModelName}...`);
    
    const model = genAI.getGenerativeModel({ model: cleanModelName });
    
    const result = await model.generateContent('Say hello in one word');
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ ${cleanModelName} - SUCCESS`);
    console.log(`   Response: ${text}`);
    return { success: true, modelName: cleanModelName };
  } catch (error) {
    const errorMsg = error.message || error.toString();
    console.log(`❌ ${modelName.replace(/^models\//, '')} - FAILED`);
    console.log(`   Error: ${errorMsg.substring(0, 150)}...`);
    return { success: false, modelName: modelName.replace(/^models\//, ''), error: errorMsg };
  }
}

async function runTests() {
  console.log('\n=== Gemini API Model Test ===\n');
  
  // First, get available models
  const availableModels = await listAvailableModels();
  
  if (availableModels.length === 0) {
    // Fallback to common model names
    console.log('\nCould not fetch model list, trying common model names...\n');
    const commonModels = [
      'gemini-1.5-flash-002',
      'gemini-1.5-pro-002',
      'gemini-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro-vision'
    ];
    
    let successCount = 0;
    for (const modelName of commonModels) {
      const result = await testModel(modelName);
      if (result.success) {
        successCount++;
        console.log(`\n✅ WORKING MODEL FOUND: ${result.modelName}`);
        break; // Stop after finding one working model
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (successCount === 0) {
      console.error('\n❌ No models are accessible.');
      process.exit(1);
    }
  } else {
    // Test available models
    console.log('\n=== Testing Available Models ===\n');
    let successCount = 0;
    let workingModel = null;
    
    for (const modelName of availableModels) {
      const result = await testModel(modelName);
      if (result.success) {
        successCount++;
        workingModel = result.modelName;
        console.log(`\n✅ WORKING MODEL FOUND: ${workingModel}`);
        break; // Stop after finding one working model
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (successCount === 0) {
      console.error('\n❌ No models are accessible even though they are listed.');
      process.exit(1);
    } else {
      console.log(`\n✅ Successfully found working model: ${workingModel}`);
      console.log(`\nUpdate your server/routes/ai.js to use: ${workingModel}`);
    }
  }
  
  process.exit(0);
}

runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});

