
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin
const supabaseUrl = process.env.SUPABASE_URL || 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.API_KEY) {
    return res.status(500).json({ 
      reply: 'এআই সার্ভার কনফিগারেশন ত্রুটি। দয়া করে পরে চেষ্টা করো।' 
    });
  }

  try {
    const { message, history, userId, systemInstruction: frontendContext } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and User ID are required.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const baseSystemPrompt = `You are "Lekhapora Bot", a supportive, casual study friend for a Bangladesh HSC student.
    
    TONE & LANGUAGE:
    - Casual, friendly "Bondhu" tone in Bengali.
    - Responses must be concise (1-2 sentences).
    - Provide study hacks and motivation.
    
    AUTOMATION:
    If asked to add a task, include JSON:
    - Task: {"action": "add_task", "data": {"title": "Title", "duration": "1h", "date": "YYYY-MM-DD"}, "reply": "Confirm in Bengali"}`;

    const finalSystemInstruction = frontendContext 
      ? `${baseSystemPrompt}\n\nContext: ${frontendContext}` 
      : baseSystemPrompt;

    const contents = (history || []).map((msg: any) => ({
      role: (msg.role === 'ai' || msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user',
      parts: [{ text: msg.text || msg.content || '' }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: finalSystemInstruction,
        temperature: 0.8,
        topK: 40,
        topP: 0.95
      }
    });

    const rawContent = response.text || "";
    let finalReply = rawContent.trim();

    // Action handling
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
          finalReply = actionObj.reply || "টাস্ক যোগ করে দিয়েছি দোস্ত!";
        }
      } catch (e) {
        // Fallback if parsing fails
        finalReply = rawContent.replace(/\{[\s\S]*\}/, '').trim() || "ঠিক আছে দোস্ত!";
      }
    }

    // Async log saving (non-blocking)
    supabaseAdmin.from('ai_logs').insert({
      user_id: userId,
      prompt: message,
      response: finalReply,
      model: 'gemini-3-flash-preview'
    }).then();

    return res.status(200).json({ reply: finalReply });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(200).json({ 
      reply: "সার্ভারে একটু জ্যাম দোস্ত, আবার চেষ্টা কর তো!" 
    });
  }
}
