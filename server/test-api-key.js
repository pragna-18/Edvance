import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log('Testing Gemini API Key...');
console.log('API Key loaded:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');

if (!API_KEY || API_KEY.trim() === '') {
  console.error('❌ ERROR: GEMINI_API_KEY is not set in .env file');
  process.exit(1);
}

try {
  const genAI = new GoogleGenerativeAI(API_KEY);
  console.log('✅ GoogleGenerativeAI initialized successfully');
  
  // Try to get a model
  const modelNames = [
    'gemini-2.5-flash',           // Latest stable flash (most compatible)
    'gemini-2.5-pro',              // Latest stable pro
    'gemini-2.0-flash',            // Stable 2.0 flash
    'gemini-flash-latest',         // Latest flash alias
    'gemini-pro-latest',          // Latest pro alias
    'gemini-2.5-flash-lite',       // Lite version
    'gemini-2.0-flash-exp'         // Experimental version
  ];
  
  let model = null;
  let modelName = null;
  
  for (const name of modelNames) {
    try {
      model = genAI.getGenerativeModel({ model: name });
      modelName = name;
      console.log(`✅ Successfully initialized model: ${name}`);
      break;
    } catch (error) {
      console.warn(`⚠️  Failed to initialize ${name}:`, error.message);
      continue;
    }
  }
  
  if (!model) {
    console.error('❌ Failed to initialize any model');
    process.exit(1);
  }
  
  // Try to generate content
  console.log('Testing API call...');
  const result = await model.generateContent('Say hello in one word');
  const response = result.response;
  const text = response.text();
  
  console.log('✅ API call successful!');
  console.log('Response:', text);
  console.log('\n✅ Your API key is valid and working!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nPossible issues:');
  console.error('1. API key is invalid or expired');
  console.error('2. API key does not have access to Gemini models');
  console.error('3. API quota exceeded');
  console.error('4. Network connection issue');
  console.error('\nGet a new API key from: https://aistudio.google.com/apikey');
  process.exit(1);
}

