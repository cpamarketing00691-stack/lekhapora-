
import { createClient } from '@supabase/supabase-js';

/**
 * LEKHAPORĀ – HSC STUDY TRACKER (BACKEND API)
 * Standard Node.js Serverless Function for Vercel
 * Replaces Gemini with DeepSeek API for production stability.
 */

// 1. Initialize Supabase with Service Role Key
// This allows the AI to perform "privileged" actions like inserting tasks on behalf of users.
const supabaseUrl = process.env.SUPABASE_URL || 'https://uycxbrcbweeuvizrgpnw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * MAIN API HANDLER
 * Signature: (req, res) for standard Vercel Node.js runtime.
 */
export default async function handler(req: any, res: any) {
  // Only allow POST requests for security and functionality
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Validate Environment Variables
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  if (!deepseekApiKey) {
    console.error("CRITICAL: DEEPSEEK_API_KEY environment variable is missing.");
    return res.status(500).json({ 
      error: 'API Configuration Error', 
      reply: 'দুঃখিত, এআই সার্ভার কনফিগারেশন মিসিং (API Key missing)। অ্যাডমিনকে জানাও।' 
    });
  }

  try {
    // 3. Extract request body safely
    // In Vercel Node.js functions, req.body is pre-parsed if the content-type is application/json.
    const { message, history, userId } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and User ID are required.' });
    }

    /**
     * 4. SYSTEM PROMPT
     * Configures DeepSeek's personality and structured response rules.
     */
    const systemPrompt = `You are "Lekhaporā Buddy", the dedicated AI study companion for HSC students in Bangladesh.
    Tone: Supportive, elder sibling (Boro Bhai/Apu), uses a mix of Bangla and English (Banglish).
    
    SPECIAL ACTIONS (Automation):
    If the user asks to add a task, routine, or syllabus chapter, you MUST respond ONLY with a valid JSON object. 
    Do not add extra text outside the JSON if an action is triggered.
    
    JSON SCHEMA:
    - Task: {"action": "add_task", "data": {"title": "Physics 1", "duration": "1 hour", "date": "YYYY-MM-DD"}, "reply": "Confirm in Bangla"}
    - Routine: {"action": "add_routine", "data": {"subject": "Math", "time": "7:00 AM", "day": "Today"}, "reply": "Confirm in Bangla"}
    - Syllabus: {"action": "add_syllabus", "data": {"subject": "Chemistry", "chapter": "Qualitative Chemistry"}, "reply": "Confirm in Bangla"}
    
    Otherwise, respond with normal conversational Bangla/Banglish.`;

    /**
     * 5. CONSTRUCT MESSAGES
     * Maps frontend message history to DeepSeek/OpenAI format.
     */
    const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        messages.push({
          role: (msg.role === 'ai' || msg.role === 'assistant') ? 'assistant' : 'user',
          content: msg.text || msg.content
        });
      });
    }
    
    // Add current user prompt
    messages.push({ role: 'user', content: message });

    /**
     * 6. EXECUTE DEEPSEEK API CALL
     * Uses the 'deepseek-chat' model via fetch.
     */
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
        max_tokens: 1024
      })
    });

    // Handle API errors (Quota exceeded, Rate limit, Server error)
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`DeepSeek API Error Status: ${aiResponse.status} - Content: ${errorText}`);
      
      if (aiResponse.status === 429) {
        return res.status(200).json({ reply: "দোস্ত, বর্তমানে অনেক স্টুডেন্ট আমাকে মেসেজ দিচ্ছে। একটু রেস্ট নিয়ে ৫ মিনিট পর আবার নক দাও!" });
      }
      throw new Error(`AI Provider Failure: ${aiResponse.status}`);
    }

    const completion: any = await aiResponse.json();
    const rawContent = completion.choices[0].message.content.trim();

    /**
     * 7. PARSE ACTIONS & DATABASE INTERACTION
     * Detects if the response is a JSON command.
     */
    let finalReply = rawContent;
    
    if (rawContent.startsWith('{') && rawContent.endsWith('}')) {
      try {
        const actionObj = JSON.parse(rawContent);
        const { action, data, reply } = actionObj;

        // Execute Database Insert with Admin privileges (Bypass RLS)
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
        
        finalReply = reply || "অ্যাড করা হয়েছে!";
      } catch (parseErr) {
        console.warn("AI returned malformed JSON or text in JSON format:", parseErr);
        // Fallback: Use rawContent as the reply if JSON parsing fails
      }
    }

    /**
     * 8. LOG INTERACTION
     * Records the conversation for debugging and improvement.
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

    // 9. Send successful response
    return res.status(200).json({ reply: finalReply });

  } catch (error: any) {
    console.error("Chat API Handler Exception:", error);
    
    // Friendly error message for the user
    return res.status(200).json({ 
      reply: "দুঃখিত দোস্ত, সার্ভারের সাথে যোগাযোগ করতে পারছি না। তোমার ইন্টারনেট চেক করে আবার মেসেজ দাও।" 
    });
  }
}
