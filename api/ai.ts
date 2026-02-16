
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Use process.env.API_KEY exclusively as per guidelines
  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    console.error('❌ API_KEY not found');
    return res.status(500).json({ 
      error: 'AI service not configured',
      success: false,
      reply: 'সার্ভারে এআই চাবি খুঁজে পাওয়া যায়নি। দয়া করে এডমিনকে জানান।'
    });
  }

  try {
    const { message, history = [], userProfile = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Initialize Gemini API client strictly with named parameter
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const systemPrompt = `You are "Lekhapora AI", an expert study companion for Bangladesh HSC (Higher Secondary Certificate) students.
    
    IDENTITY & TONE:
    - Casual, friendly, and encouraging (use "Bondhu" or "Bondhura").
    - Respond in a mix of Bengali and English (Banglish) if appropriate, or purely Bengali if asked.
    - Be concise but explain difficult topics step-by-step.
    
    SUBJECT EXPERTISE (NCTB):
    - Physics (Dynamics, Vector, Newtonian Mechanics, etc.)
    - Chemistry (Organic, Qualitative, Quantitative)
    - Biology (Cell structure, Plant/Animal Physiology, Genetics)
    - Higher Math (Calculus, Trigonometry, Matrix)
    - ICT (Number systems, C Programming, HTML, Database)
    
    STUDENT CONTEXT:
    - Name: ${userProfile.fullName || 'Student'}
    - Group: ${userProfile.group || 'N/A'}
    - Board: ${userProfile.board || 'N/A'}
    
    STRICT RULES:
    - Follow the NCTB syllabus only.
    - If asked about non-academic topics, politely redirect to studies.
    - Maximum 3 paragraphs per response unless explaining a derivation.`;

    // Map history to Gemini format (role must be 'user' or 'model')
    const contents = [
      ...history.map((msg: any) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text || msg.content || '' }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    // Query GenAI with model and prompt together as per @google/genai guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    // Accessing .text property directly as per extracts from response guidelines
    const aiReply = response.text || "";

    if (!aiReply) {
      throw new Error('Empty response from AI');
    }

    // Returning 'reply' to align with client-side service expectations
    return res.status(200).json({ 
      success: true,
      reply: aiReply
    });

  } catch (error: any) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message,
      reply: 'দুঃখিত বন্ধু, এই মুহূর্তে আমার মাথায় একটু জট লেগেছে। দয়া করে আবার চেষ্টা করো।'
    });
  }
}
