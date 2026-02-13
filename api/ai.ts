
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { message, history, userId, systemInstruction } = req.body;

  if (!process.env.API_KEY) {
    return res.status(500).json({ reply: 'API key not configured.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Format history for Gemini 2.5/3 SDK
    const contents = (history || []).map((msg: any) => ({
      role: (msg.role === 'model' || msg.role === 'assistant') ? 'model' : 'user',
      parts: [{ text: msg.parts?.[0]?.text || msg.text || '' }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: systemInstruction || 'You are a helpful HSC study assistant.',
        temperature: 0.7,
      }
    });

    const replyText = response.text || "";
    
    // Automation Logic: Check for JSON commands
    const jsonMatch = replyText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const actionObj = JSON.parse(jsonMatch[0]);
        if (actionObj.action === 'add_task') {
           // We can execute background logic here if needed, 
           // though usually the frontend handles the state update from the returned JSON.
        }
      } catch (e) {}
    }

    return res.status(200).json({ reply: replyText });

  } catch (error: any) {
    console.error("Gemini Route Error:", error);
    return res.status(500).json({ reply: "Connection failed. Try again later." });
  }
}
