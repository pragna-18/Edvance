import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDEIGf1uBs5sjn-zt0e3pBjgmBt5NrGM2s";
const genAI = new GoogleGenerativeAI(API_KEY);

// Generate lesson plan from SMS/WhatsApp text prompt
router.post('/generate', async (req, res) => {
  try {
    const { message, phoneNumber, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!genAI) {
      return res.status(500).json({ error: 'AI service not available' });
    }

    // Parse message to extract lesson plan parameters
    // Format: "Subject: Math, Topic: Algebra, Grade: 10"
    const prompt = `Parse this SMS/WhatsApp message and extract lesson plan parameters:

Message: "${message}"

Extract:
- Subject (if mentioned)
- Topic (if mentioned)
- Grade/Level (if mentioned)
- Duration (if mentioned, default to 45 minutes)
- Any other relevant details

Return ONLY a JSON object:
{
  "subject": "<extracted or null>",
  "topic": "<extracted or null>",
  "grade": "<extracted or null>",
  "duration": <extracted or 45>,
  "educationLevel": "<school or college>",
  "otherDetails": "<any other details>"
}

Return ONLY the JSON object, no markdown.`;

    // Try multiple models
    let model;
    const modelNames = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp',
      'gemini-flash-latest'
    ];
    
    let lastError = null;
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json'
          }
        });
        break;
      } catch (error) {
        lastError = error;
        try {
          model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: { temperature: 0.7 }
          });
          break;
        } catch (e) {
          continue;
        }
      }
    }
    
    if (!model) {
      throw new Error(`Failed to initialize any model. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    const parseResult = await model.generateContent(prompt);
    const parseResponse = await parseResult.response;
    let parseText = parseResponse.text().trim();
    
    parseText = parseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    const jsonMatch = parseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parseText = jsonMatch[0];
    }

    let params;
    try {
      params = JSON.parse(parseText);
    } catch (parseError) {
      console.error('SMS parse error:', parseError);
      // Fallback: try to extract basic info from message
      params = {
        subject: null,
        topic: null,
        grade: null,
        duration: 45,
        educationLevel: 'school',
        otherDetails: message
      };
    }

    // Generate lesson plan using extracted parameters
    // This would call the main generation endpoint logic
    // For now, return the parsed parameters
    res.json({
      success: true,
      message: 'Lesson plan generation initiated from SMS',
      parameters: params,
      phoneNumber,
      note: 'Full lesson plan generation would be completed here and sent back via SMS/WhatsApp'
    });
  } catch (error) {
    console.error('SMS generation error:', error);
    res.status(500).json({
      error: 'Failed to process SMS request',
      message: error.message
    });
  }
});

export default router;

