import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin with Service Role Key
const supabaseUrl = process.env.SUPABASE_URL || 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Guidelines: Initialization must use named parameter and process.env.API_KEY directly.
  if (!process.env.API_KEY) {
    console.error("CRITICAL: API_KEY is missing in environment.");
    return res.status(500).json({ 
      reply: 'দুঃখিত দোস্ত, আমার এআই চাবি (API Key) কাজ করছে না। দয়া করে অ্যাডমিনকে জানাও।' 
    });
  }

  try {
    const { message, history, userId, systemInstruction: frontendContext } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and User ID are required.' });
    }

    // Initialize Gemini API client strictly as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const baseSystemPrompt = `You are "Lekhapora Bot", a supportive, casual study friend for a Bangladesh HSC student.
    
    TONE & LANGUAGE:
    - Casual, friendly Bengali (Bondhu tone).
    - Responses must be SHORT (1-3 sentences max).
    - Be encouraging and positive.
    
    SPECIAL ACTIONS (AUTOMATION):
    If the user wants to add a task, respond ONLY with a valid JSON object.
    - Task: {"action": "add_task", "data": {"title": "Title", "duration": "1h", "date": "YYYY-MM-DD"}, "reply": "Confirmation in Bengali"}`;

    const finalSystemInstruction = frontendContext 
      ? `${baseSystemPrompt}\n\nAdditional Context: ${frontendContext}` 
      : baseSystemPrompt;

    // Map history to Gemini format (role must be 'user' or 'model')
    const contents = (history || []).map((msg: any) => ({
      role: (msg.role === 'ai' || msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user',
      parts: [{ text: msg.text || msg.content || '' }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    // Query GenAI with model and prompt together as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: finalSystemInstruction,
        temperature: 0.7,
      }
    });

    // Extracting text output directly from .text property (not a method)
    const rawContent = response.text || "";
    let finalReply = rawContent.trim();

    // Check for JSON action blocks
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const actionObj = JSON.parse(jsonMatch[0]);
        if (actionObj.action === 'add_task') {
          await supabaseAdmin.from('tasks').insert({
            user_id: userId,
            title: actionObj.data.title,
            duration: actionObj.data.duration,
            date: actionObj.data.date || new Date().toISOString().split('T')[0]
          });
          finalReply = actionObj.reply || "টাস্কটি সেভ করেছি দোস্ত!";
        }
      } catch (e) {
        console.warn("JSON parsing failed in response");
      }
    }

    // Logging
    try {
      await supabaseAdmin.from('ai_logs').insert({
        user_id: userId,
        prompt: message,
        response: finalReply,
        model: 'gemini-3-flash-preview'
      });
    } catch (e) {}

    return res.status(200).json({ reply: finalReply });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(200).json({ 
      reply: "দুঃখিত দোস্ত, সার্ভারের সাথে যোগাযোগ করতে পারছি না। আবার চেষ্টা কর।" 
    });
  }
}