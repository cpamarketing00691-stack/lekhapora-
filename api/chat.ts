
import { createClient } from '@supabase/supabase-js';

/**
 * PRODUCTION-READY LEKHAPORA BOT BACKEND
 * Optimized for Vercel Serverless Functions (Node.js Runtime)
 */

// 1. Initialize Supabase Admin with Service Role Key
const supabaseUrl = process.env.SUPABASE_URL || 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Standard Node.js Request Handler for Vercel
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!deepseekApiKey) {
    console.error("CONFIGURATION ERROR: DEEPSEEK_API_KEY is missing.");
    return res.status(500).json({ 
      error: 'Missing Configuration', 
      reply: 'দুঃখিত দোস্ত, আমার এআই চাবি (API Key) কাজ করছে না। দয়া করে ড্যাশবোর্ডে এনভায়রনমেন্ট ভেরিয়েবল চেক করো।' 
    });
  }

  try {
    const { message, history, userId, systemInstruction } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and User ID are required.' });
    }

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
    If the student wants to add a task, routine, or syllabus chapter, respond ONLY with a valid JSON object:
    - Task: {"action": "add_task", "data": {"title": "Subject", "duration": "1h", "date": "YYYY-MM-DD"}, "reply": "Confirm in friendly Bengali"}
    - Routine: {"action": "add_routine", "data": {"subject": "Math", "time": "7am", "day": "Today"}, "reply": "Confirm in friendly Bengali"}
    - Syllabus: {"action": "add_syllabus", "data": {"subject": "Physics", "chapter": "Vector"}, "reply": "Confirm in friendly Bengali"}
    
    Otherwise, respond with warm, helpful Bengali text.`;

    const finalSystemPrompt = systemInstruction ? `${baseSystemPrompt}\n\nAdditional Context: ${systemInstruction}` : baseSystemPrompt;

    const messages: ChatMessage[] = [{ role: 'system', content: finalSystemPrompt }];
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        messages.push({
          role: (msg.role === 'ai' || msg.role === 'assistant') ? 'assistant' : 'user',
          content: msg.text || msg.content
        });
      });
    }
    
    messages.push({ role: 'user', content: message });

    const aiResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return res.status(200).json({ 
          reply: "দোস্ত, এখন অনেক স্টুডেন্ট একসাথে পড়াশোনা করছে। আমার ব্রেইন একটু জ্যাম হয়ে গেছে। ৫ মিনিট পর আবার নক দাও!" 
        });
      }
      throw new Error(`Upstream API failed with status ${aiResponse.status}`);
    }

    const completion: any = await aiResponse.json();
    const rawContent = completion.choices[0].message.content.trim();

    let finalReply = rawContent;
    
    if (rawContent.startsWith('{') && rawContent.endsWith('}')) {
      try {
        const parsed = JSON.parse(rawContent);
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
        console.warn("JSON error, using raw content.");
      }
    }

    try {
      await supabaseAdmin.from('ai_logs').insert({
        user_id: userId,
        prompt: message,
        response: finalReply,
        model: 'deepseek-chat',
        created_at: new Date().toISOString()
      });
    } catch (logErr) {}

    return res.status(200).json({ reply: finalReply });

  } catch (error: any) {
    console.error("BACKEND ERROR:", error);
    return res.status(200).json({ 
      reply: "দুঃখিত দোস্ত, সার্ভারের সাথে যোগাযোগ করতে পারছি না। আবার চেষ্টা কর।" 
    });
  }
}
