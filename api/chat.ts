import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

/**
 * Vercel Serverless Backend API
 * Endpoint: /api/chat
 * Method: POST
 */
export default async function handler(req: any, res: any) {
  // Ensure only POST requests are allowed
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { message, history, systemInstruction, userId } = req.body;

  // Basic validation for the required message string
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A valid message string is required.' });
  }

  try {
    /**
     * Initialize the Google GenAI client.
     * NOTE: Per hard-coded system instructions for @google/genai, 
     * process.env.API_KEY is used exclusively for secure model initialization.
     */
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    let reply = '';

    // Generate content using either a chat session (if history exists) or a single prompt
    if (history && Array.isArray(history) && history.length > 0) {
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: systemInstruction || undefined,
          temperature: 0.7,
        },
        history: history.map((msg: any) => ({
          role: (msg.role === 'ai' || msg.role === 'model') ? 'model' : 'user',
          parts: [{ text: msg.text }]
        })),
      });

      const result = await chat.sendMessage({ message });
      reply = result.text;
    } else {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: message,
        config: {
          systemInstruction: systemInstruction || undefined,
          temperature: 0.7,
        },
      });
      reply = response.text;
    }

    if (!reply) {
      throw new Error('AI model returned an empty response.');
    }

    /**
     * Securely save the interaction to Supabase using the Service Role Key.
     * This remains purely server-side and never exposes DB keys to the frontend.
     */
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabaseAdmin
        .from('chat_history')
        .insert([
          { 
            user_id: userId || null, 
            message: message, 
            reply: reply,
            created_at: new Date().toISOString()
          }
        ]);
    }

    // Return the response as JSON { reply: string } as requested
    return res.status(200).json({ reply });
  } catch (error: any) {
    console.error('Backend Gemini API Error:', error.message);
    return res.status(500).json({ 
      error: 'An internal server error occurred while communicating with the AI.' 
    });
  }
}
