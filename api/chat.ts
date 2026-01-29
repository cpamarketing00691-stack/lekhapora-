
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

/**
 * LEKHAPORA BOT - GEMINI BACKEND
 * Features:
 * 1. Automated Task/Syllabus/Routine tracking via JSON detection.
 * 2. Gemini 3 Flash model integration for efficient conversational aid.
 * 3. Audit logging to Supabase.
 */

// Initialize Supabase Admin with Service Role Key
const supabaseUrl = process.env.SUPABASE_URL || 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  // Validate Request Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Guidelines: API key must be obtained exclusively from the environment variable process.env.API_KEY
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("CRITICAL: Gemini API Key is missing in environment variables.");
    return res.status(500).json({ 
      reply: 'দুঃখিত দোস্ত, আমার এআই চাবি (API Key) কাজ করছে না। দয়া করে অ্যাডমিনকে জানাও।' 
    });
  }

  try {
    const { message, history, userId, systemInstruction: frontendContext } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and User ID are required.' });
    }

    // Initialize Gemini API client
    const ai = new GoogleGenAI({ apiKey });

    /**
     * DYNAMIC SYSTEM PROMPT: LEKHAPORA BOT
     */
    const baseSystemPrompt = `You are "Lekhapora Bot", a supportive, casual study friend for a Bangladesh HSC student.
    
    TONE & LANGUAGE:
    - Casual, friendly Bengali (Bondhu tone).
    - Responses must be SHORT (1-3 sentences max).
    - Be encouraging and positive.
    
    SPECIAL ACTIONS (AUTOMATION):
    If the user wants to add a task, routine, or syllabus chapter, respond ONLY with a valid JSON object.
    
    JSON SCHEMA:
    - Task: {"action": "add_task", "data": {"title": "Title", "duration": "1h", "date": "YYYY-MM-DD"}, "reply": "Confirmation in Bengali"}
    - Routine: {"action": "add_routine", "data": {"subject": "Sub", "time": "8pm", "day": "Today"}, "reply": "Confirmation in Bengali"}
    - Syllabus: {"action": "add_syllabus", "data": {"subject": "Sub", "chapter": "Ch"}, "reply": "Confirmation in Bengali"}
    
    Respond in normal text for everything else.`;

    const finalSystemInstruction = frontendContext 
      ? `${baseSystemPrompt}\n\nAdditional Context: ${frontendContext}` 
      : baseSystemPrompt;

    // Construct Message History for Gemini (role must be 'user' or 'model')
    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: (msg.role === 'ai' || msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user',
          parts: [{ text: msg.text || msg.content || '' }]
        });
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    // Generate content using Gemini 3 Flash for conversational tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: finalSystemInstruction,
        temperature: 0.7,
      }
    });

    // Extracting text output directly from property as per guidelines
    const rawContent = response.text || "";
    let finalReply = rawContent.trim();

    // Action Detection & Database Integration
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const actionObj = JSON.parse(jsonMatch[0]);
        const { action, data, reply } = actionObj;

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
      } catch (parseError) {
        console.warn("JSON block detected but could not be parsed.");
      }
    }

    // Audit Logging
    try {
      await supabaseAdmin.from('ai_logs').insert({
        user_id: userId,
        prompt: message,
        response: finalReply,
        model: 'gemini-3-flash-preview',
        created_at: new Date().toISOString()
      });
    } catch (logErr) {
      console.error("Non-critical logging failure.");
    }

    return res.status(200).json({ reply: finalReply });

  } catch (error: any) {
    console.error("LEKHAPORA BOT CRITICAL ERROR:", error);
    return res.status(200).json({ 
      reply: "দুঃখিত দোস্ত, সার্ভারের সাথে যোগাযোগ করতে পারছি না। আবার চেষ্টা কর।" 
    });
  }
}
