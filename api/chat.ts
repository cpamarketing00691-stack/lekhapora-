
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side API handler for secure Gemini AI interactions with history persistence.
 * Endpoint: /api/chat
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { message, userId } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A valid message string is required.' });
  }

  try {
    // 1. Initialize AI Client
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    // 2. Generate AI Content
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
    });

    const reply = response.text;

    if (!reply) {
      throw new Error('AI model returned an empty response.');
    }

    // 3. Save to Supabase securely using Service Role Key
    // This allows bypassing RLS for administrative logging without exposing keys to the frontend.
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string
    );

    // Persist the conversation. We use a background-style promise to not block the response,
    // though in a serverless function we must await to ensure completion.
    const { error: dbError } = await supabaseAdmin
      .from('chat_history')
      .insert([
        { 
          user_id: userId || null, // Optional user association
          message: message, 
          reply: reply,
          created_at: new Date().toISOString()
        }
      ]);

    if (dbError) {
      console.error('Supabase Persistence Error:', dbError.message);
      // We still return the reply to the user even if saving to history fails
    }

    return res.status(200).json({ reply });
  } catch (error: any) {
    console.error('Backend Gemini API Error:', error.message);
    return res.status(500).json({ 
      error: 'An error occurred on the server.' 
    });
  }
}
