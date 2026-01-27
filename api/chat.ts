import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { message, history, systemInstruction } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A valid message string is required.' });
  }

  try {
    // ✅ FIX: Correct env variable
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY as string });

    let reply = '';

    if (history && Array.isArray(history) && history.length > 0) {
      const chat = ai.chats.create({
        // ✅ FIX: Stable serverless-friendly model
        model: 'gemini-1.5-flash',
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
        model: 'gemini-1.5-flash', // ✅ stable
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

    // ✅ Supabase insert
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabaseAdmin
        .from('chat_logs')
        .insert([
          { 
            user_id: null, 
            user_message: message, 
            ai_reply: reply
          }
        ]);
    }

    return res.status(200).json({ reply });
  } catch (error: any) {
    console.error('Backend Gemini API Error:', error);
    return res.status(500).json({ 
      error: error.message || error.toString()
    });
  }
}

