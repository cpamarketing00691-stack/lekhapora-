
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

/**
 * PRODUCTION-READY LEKHAPORA BOT BACKEND
 * Powered by Google Gemini API
 */

// 1. Initialize Supabase Admin with Service Role Key
const supabaseUrl = process.env.SUPABASE_URL || 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Standard Node.js Request Handler for Vercel
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("CONFIGURATION ERROR: API_KEY is missing in environment variables.");
    return res.status(500).json({ 
      error: 'Missing Configuration', 
      reply: 'দুঃখিত দোস্ত, আমার এআই চাবি (API Key) পাওয়া যাচ্ছে না। দয়া করে এনভায়রনমেন্ট ভেরিয়েবল চেক করো।' 
    });
  }

  try {
    const { message, history, userId, systemInstruction: frontendSystemInstruction } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and User ID are required.' });
    }

    // Initialize Gemini API
    const ai = new GoogleGenAI({ apiKey });

    /**
     * DYNAMIC SYSTEM PROMPT: LEKHAPORA BOT
     */
    const baseSystemPrompt = `You are "Lekhapora Bot", a friendly, casual AI study assistant for Bangladesh HSC students. 
    Task: Help with studies, motivation, and task tracking.
    Tone: Friendly, casual Bengali (like a close friend or "bondhu"). 
    Rules: 
    1. Keep responses short (1-3 sentences). 
    2. Be encouraging and polite. 
    3. Use simple, natural Bengali/Banglish.
    
    SPECIAL ACTIONS (Automation):
    If the student wants to add a task, routine, or syllabus chapter, you MUST respond ONLY with a valid JSON object. Do not wrap it in markdown blocks unless necessary.
    
    JSON SCHEMA:
    - Task: {"action": "add_task", "data": {"title": "Subject", "duration": "1h", "date": "YYYY-MM-DD"}, "reply": "Confirm in friendly Bengali"}
    - Routine: {"action": "add_routine", "data": {"subject": "Math", "time": "7am", "day": "Today"}, "reply": "Confirm in friendly Bengali"}
    - Syllabus: {"action": "add_syllabus", "data": {"subject": "Physics", "chapter": "Vector"}, "reply": "Confirm in friendly Bengali"}
    
    Otherwise, respond with warm, helpful Bengali text.`;

    const finalSystemPrompt = frontendSystemInstruction 
      ? `${baseSystemPrompt}\n\nAdditional User Context: ${frontendSystemInstruction}` 
      : baseSystemPrompt;

    /**
     * CONSTRUCT CONTENTS FOR GEMINI
     * Gemini roles are 'user' and 'model'.
     */
    const contents: any[] = [];
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: (msg.role === 'ai' || msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user',
          parts: [{ text: msg.text || msg.content }]
        });
      });
    }
    
    // Add current user message
    contents.push({ role: 'user', parts: [{ text: message }] });

    // Generate Content using Gemini 3
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: finalSystemPrompt,
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    });

    const rawContent = response.text || "দুঃখিত দোস্ত, আমি ঠিক বুঝতে পারিনি।";
    const cleanedContent = rawContent.trim();

    let finalReply = cleanedContent;
    
    // Detect and execute automation actions if AI returns JSON
    if (cleanedContent.startsWith('{') && cleanedContent.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanedContent);
        const { action, data, reply } = parsed;

        if (action === 'add_task') {
          await supabaseAdmin.from('tasks').insert({
            user_id: userId,
            title: data.title,
            duration: data.duration,
            date: data.date || new Date().toISOString().split('T')[0]
          });
        } else if (action === 'add_routine') {
          await supabaseAdmin.from('routines').insert({
            user_id: userId,
            subject: data.subject,
            time: data.time,
            day: data.day || 'Today'
          });
        } else if (action === 'add_syllabus') {
          await supabaseAdmin.from('syllabus').insert({
            user_id: userId,
            subject: data.subject,
            chapter: data.chapter
          });
        }
        
        finalReply = reply || "কাজটি হয়ে গেছে দোস্ত!";
      } catch (e) {
        console.warn("Gemini returned JSON-like content that failed parsing:", e);
      }
    }

    // Log the interaction to Supabase for analytics
    try {
      await supabaseAdmin.from('ai_logs').insert({
        user_id: userId,
        prompt: message,
        response: finalReply,
        model: 'gemini-3-flash-preview',
        created_at: new Date().toISOString()
      });
    } catch (logErr) {
      console.error("Non-critical logging error:", logErr);
    }

    return res.status(200).json({ reply: finalReply });

  } catch (error: any) {
    console.error("GEMINI API ERROR:", error);
    
    // Friendly error handling for the student
    return res.status(200).json({ 
      reply: "দুঃখিত দোস্ত, সার্ভারের সাথে যোগাযোগ করতে পারছি না। আবার চেষ্টা কর।" 
    });
  }
}
