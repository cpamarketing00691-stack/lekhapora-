
import { createClient } from '@supabase/supabase-js';

/**
 * PRODUCTION-READY DEEPSEEK AI BACKEND
 * Handles conversational chat and automated database actions (Tasks, Routines, Syllabus)
 */

// Initialize Supabase with Service Role Key for server-side operations
// This bypasses RLS for AI-initiated actions to ensure reliability
const supabaseUrl = process.env.SUPABASE_URL || 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default async function handler(req: Request): Promise<Response> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  if (!deepseekApiKey) {
    return new Response(JSON.stringify({ error: 'AI Configuration Missing: DEEPSEEK_API_KEY not found' }), { status: 500 });
  }

  try {
    const { message, history, userId } = await req.json();

    if (!message || !userId) {
      return new Response(JSON.stringify({ error: 'Message and UserId are required' }), { status: 400 });
    }

    /**
     * 1. SYSTEM PROMPT DESIGN
     * Instructions for DeepSeek to act as a study buddy and detect structured actions.
     */
    const systemPrompt = `You are "Lekhaporā Buddy", a supportive and friendly HSC study assistant for students in Bangladesh.
    You communicate in a mix of Bangla and English (Banglish) in a "big brother/sister" tone.
    
    If the user wants to add a task, routine, or syllabus item, you MUST respond ONLY with a JSON object in the following format:
    For Tasks: {"action": "add_task", "data": {"title": "string", "duration": "string", "date": "YYYY-MM-DD"}, "reply": "Confirm in Bangla"}
    For Routines: {"action": "add_routine", "data": {"subject": "string", "time": "string", "day": "string"}, "reply": "Confirm in Bangla"}
    For Syllabus: {"action": "add_syllabus", "data": {"subject": "string", "chapter": "string"}, "reply": "Confirm in Bangla"}
    
    If the user is just chatting or asking for advice, respond with normal Bangla/English text.
    Keep your advice practical for NCTB curriculum.`;

    /**
     * 2. CONSTRUCT MESSAGE HISTORY
     * Mapping frontend history to DeepSeek's OpenAI-compatible format
     */
    const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        messages.push({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.text
        });
      });
    }
    
    // Add the current user message
    messages.push({ role: 'user', content: message });

    /**
     * 3. CALL DEEPSEEK API
     * Standard fetch implementation (OpenAI compatible)
     */
    const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json();
      throw new Error(errorData.error?.message || 'DeepSeek API Error');
    }

    const completion = await aiResponse.json();
    const rawContent = completion.choices[0].message.content.trim();

    /**
     * 4. ACTION DETECTION & DATABASE INSERTION
     * Safely detect if the response is a JSON action or regular text
     */
    let finalReply = rawContent;
    
    if (rawContent.startsWith('{') && rawContent.endsWith('}')) {
      try {
        const actionObj = JSON.parse(rawContent);
        const { action, data, reply } = actionObj;

        // Perform Database Inserts based on detected action
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
            day: data.day
          });
        } else if (action === 'add_syllabus') {
          await supabaseAdmin.from('syllabus').insert({
            user_id: userId,
            subject: data.subject,
            chapter: data.chapter
          });
        }
        
        // Use the AI's natural language confirmation for the UI
        finalReply = reply || "কাজটি সফলভাবে সেভ করা হয়েছে!";
      } catch (parseErr) {
        console.warn("JSON Detection failed, treating as normal text:", parseErr);
        // If it looks like JSON but fails parsing, just return the text as is
      }
    }

    /**
     * 5. LOGGING
     * Save the interaction to the ai_logs table for analytics
     */
    try {
      await supabaseAdmin.from('ai_logs').insert({
        user_id: userId,
        prompt: message,
        response: finalReply,
        model: 'deepseek-chat',
        created_at: new Date().toISOString()
      });
    } catch (logErr) {
      console.error("Non-fatal logging error:", logErr);
    }

    return new Response(JSON.stringify({ reply: finalReply }), { status: 200 });

  } catch (error: any) {
    console.error("DeepSeek API Handler Error:", error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      reply: "দুঃখিত, আমার সার্ভারে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করো।" 
    }), { status: 500 });
  }
}
