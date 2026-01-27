
// Fix: Import GoogleGenAI and necessary types from @google/genai
import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters, Content } from "@google/genai";
import { supabase } from '../lib/supabase.ts';

export const config = {
  runtime: 'edge',
};

// Fix: Initialize GoogleGenAI client with API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface Message {
  role: 'ai' | 'user'; 
  text: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { message, history, systemInstruction, userId } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    }

    const geminiContents: Content[] = [];

    if (Array.isArray(history)) {
      history.forEach((msg: Message) => {
        if (msg.role === 'user' || msg.role === 'ai') {
          geminiContents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          });
        }
      });
    }

    geminiContents.push({ role: 'user', parts: [{ text: message }] });

    const generateContentParams: GenerateContentParameters = {
      model: "gemini-3-flash-preview", 
      contents: geminiContents,
      config: {
        systemInstruction: systemInstruction || undefined,
      },
    };

    const geminiResponse: GenerateContentResponse = await ai.models.generateContent(generateContentParams);
    const aiReply = geminiResponse.text || "দুঃখিত, আমি তোমার কথা বুঝতে পারিনি।";

    if (userId) {
      await supabase.from('ai_logs').insert({
        user_id: userId,
        prompt: message,
        response: aiReply,
        model: generateContentParams.model,
        created_at: new Date().toISOString()
      });
    }

    return new Response(JSON.stringify({ reply: aiReply }), { status: 200 });

  } catch (error: any) {
    console.error("API Chat Handler Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
