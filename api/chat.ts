import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side API handler for secure Gemini AI interactions with history persistence.
 * Endpoint: /api/chat
 * 
 * This handler supports:
 * 1. Secure AI generation without exposing the API key.
 * 2. Full conversation context (history).
 * 3. System-level instructions for personality and rules.
 * 4. Automatic logging of interactions to Supabase chat_history table.
 */
export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { message, history, systemInstruction, userId } = req.body;

  // Basic validation
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A valid message string is required.' });
  }

  try {
    // 1. Initialize AI Client
    // Per system rules, the key is strictly obtained from process.env.API_KEY.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    let reply = '';

    // 2. Generate Content with Context
    if (history && Array.isArray(history) && history.length > 0) {
      // Use Chat Session for multi-turn conversations
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: systemInstruction || undefined,
          temperature: 0.7,
          topP: 0.95,
        },
        history: history.map((msg: any) => ({
          role: (msg.role === 'ai' || msg.role === 'model') ? 'model' : 'user',
          parts: [{ text: msg.text }]
        })),
      });

      const result = await chat.sendMessage({ message });
      reply = result.text;
    } else {
      // Single message generation
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

    // 3. Persist to Supabase using Service Role Key
    // This allows backend-only administrative logging bypassing standard RLS.
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { error: dbError } = await supabaseAdmin
        .from('chat_history')
        .insert([
          { 
            user_id: userId || null, 
            message: message, 
            reply: reply,
            created_at: new Date().toISOString()
          }
        ]);

      if (dbError) {
        console.error('Supabase Logging Error:', dbError.message);
      }
    }

    // 4. Return secure response
    return res.status(200).json({ reply });
  } catch (error: any) {
    console.error('Backend Gemini API Error:', error.message);
    return res.status(500).json({ 
      error: 'An internal server error occurred while communicating with the AI.' 
    });
  }
}
