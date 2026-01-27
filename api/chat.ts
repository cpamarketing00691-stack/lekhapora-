
import { supabase } from '../lib/supabase';

// In a real application, this API key would be stored securely in environment variables.
// For this exercise, we are using the key provided directly in the prompt.
const OPENROUTER_API_KEY = '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';

interface Message {
  role: 'ai' | 'user' | 'system';
  text: string;
}

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Handler for the /api/chat endpoint
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { message, history, systemInstruction, userId } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    }

    const messages: OpenRouterMessage[] = [];

    // Add system instruction if provided
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }

    // Add chat history
    if (Array.isArray(history)) {
      history.forEach((msg: Message) => {
        if (msg.role === 'user') {
          messages.push({ role: 'user', content: msg.text });
        } else if (msg.role === 'ai') {
          messages.push({ role: 'assistant', content: msg.text });
        }
      });
    }

    // Add the current user message
    messages.push({ role: 'user', content: message });

    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://hsc-study-tracker.web.app", // Replace with your actual site URL
        "X-Title": "HSC Study Tracker", // Replace with your actual site name
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "deepseek/deepseek-r1-0528:free",
        "messages": messages
      })
    });

    if (!openRouterResponse.ok) {
      const errorBody = await openRouterResponse.json();
      console.error("OpenRouter API Error:", openRouterResponse.status, errorBody);
      throw new Error(`OpenRouter API responded with status ${openRouterResponse.status}: ${JSON.stringify(errorBody)}`);
    }

    const data = await openRouterResponse.json();
    const aiReply = data.choices[0]?.message?.content || "দুঃখিত, আমি তোমার কথা বুঝতে পারিনি।";

    // Log the AI interaction to Supabase
    if (userId) {
      const { error: logError } = await supabase.from('ai_logs').insert({
        user_id: userId,
        prompt: message,
        response: aiReply,
        model: "deepseek/deepseek-r1-0528:free",
        created_at: new Date().toISOString()
      });

      if (logError) {
        console.error("Supabase AI log error:", logError.message);
        // Do not block the user response due to logging error
      }
    }

    return new Response(JSON.stringify({ reply: aiReply }), { status: 200 });

  } catch (error: any) {
    console.error("API Chat Handler Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
