
import { createClient } from '@supabase/supabase-js';

/**
 * LEKHAPORA BOT - ROBUST DEEPSEEK BACKEND
 * Features:
 * 1. Exponential Backoff for 429 (Rate Limit) errors.
 * 2. Automated Task/Syllabus/Routine tracking via JSON detection.
 * 3. DeepSeek-Chat model integration.
 * 4. Audit logging to Supabase.
 */

// 1. Initialize Supabase Admin with Service Role Key
const supabaseUrl = process.env.SUPABASE_URL || 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Robust Fetch Wrapper with Exponential Backoff
 * Handles HTTP 429 (Too Many Requests) by retrying with increasing delays.
 */
async function fetchWithRetry(url: string, options: any, maxRetries = 3, initialDelay = 1000): Promise<Response> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s, 4s...
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.warn(`[LekhaporaBot] Rate limit hit (429). Retry attempt ${attempt}/${maxRetries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const response = await fetch(url, options);

      // If status is 429 (Rate Limit), retry if we haven't exhausted attempts
      if (response.status === 429 && attempt < maxRetries) {
        continue;
      }

      return response;
    } catch (err) {
      lastError = err;
      // Network errors or other exceptions: retry
      if (attempt < maxRetries) continue;
      throw err;
    }
  }
  throw lastError || new Error('Maximum retries exceeded');
}

export default async function handler(req: any, res: any) {
  // 2. Validate Request Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 3. Resolve API Key
  // Prioritize DEEPSEEK_API_KEY, fallback to generic API_KEY if available
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    console.error("CRITICAL: DeepSeek API Key is missing in environment variables.");
    return res.status(500).json({ 
      reply: 'দুঃখিত দোস্ত, আমার এআই চাবি (API Key) কাজ করছে না। দয়া করে অ্যাডমিনকে জানাও।' 
    });
  }

  try {
    const { message, history, userId, systemInstruction: frontendContext } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and User ID are required.' });
    }

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

    const finalSystemPrompt = frontendContext 
      ? `${baseSystemPrompt}\n\nAdditional Context: ${frontendContext}` 
      : baseSystemPrompt;

    // 4. Construct Message History
    const messages = [{ role: 'system', content: finalSystemPrompt }];
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        messages.push({
          role: (msg.role === 'ai' || msg.role === 'assistant' || msg.role === 'model') ? 'assistant' : 'user',
          content: msg.text || msg.content || ''
        });
      });
    }
    
    messages.push({ role: 'user', content: message });

    // 5. Call DeepSeek with Robust Error Handling
    const aiResponse = await fetchWithRetry('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 600,
        stream: false
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return res.status(200).json({ 
          reply: "দুঃখিত দোস্ত, এখন অনেক স্টুডেন্ট একসাথে পড়াশোনা করছে। আমার ব্রেইন একটু জ্যাম হয়ে গেছে। ৫ মিনিট পর আবার নক দাও!" 
        });
      }
      const errorText = await aiResponse.text();
      throw new Error(`Upstream API failed (${aiResponse.status}): ${errorText}`);
    }

    const completion: any = await aiResponse.json();
    const rawContent = completion.choices[0].message.content.trim();
    let finalReply = rawContent;

    // 6. Action Detection & Database Integration
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

    // 7. Audit Logging
    try {
      await supabaseAdmin.from('ai_logs').insert({
        user_id: userId,
        prompt: message,
        response: finalReply,
        model: 'deepseek-chat',
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
