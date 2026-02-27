import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY not found');
  process.exit(1);
}

console.log('Listing available models...\n');

try {
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  // Try to list models using the REST API
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
  const data = await response.json();
  
  if (data.models) {
    console.log('✅ Available models:');
    data.models.forEach(model => {
      console.log(`  - ${model.name}`);
      if (model.supportedGenerationMethods) {
        console.log(`    Methods: ${model.supportedGenerationMethods.join(', ')}`);
      }
    });
    
    // Try to find a model that supports generateContent
    const generateContentModel = data.models.find(m => 
      m.supportedGenerationMethods?.includes('generateContent')
    );
    
    if (generateContentModel) {
      console.log(`\n✅ Found model that supports generateContent: ${generateContentModel.name}`);
      console.log(`   Try using: ${generateContentModel.name.replace('models/', '')}`);
    }
  } else {
    console.error('❌ Could not list models:', data);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nThis might mean:');
  console.error('1. Your API key does not have permission to list models');
  console.error('2. You need to enable the Generative Language API in Google Cloud Console');
  console.error('3. Your API key might be restricted');
  console.error('\nTry getting a new API key from: https://aistudio.google.com/apikey');
}



