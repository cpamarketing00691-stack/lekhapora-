
// Fix: Removed unused supabase import from this file. It is now imported from lib/supabase.
// import { supabase } from '../lib/supabase'; // This import is kept for logging purposes.

// Fix: Removed OpenRouter API key and related interface definitions.
// const OPENROUTER_API_KEY = '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';

// Fix: Import GoogleGenAI and necessary types from @google/genai
import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters, Content } from "@google/genai";
import { supabase } from '../lib/supabase'; // Keep this for Supabase logging

// Fix: Initialize GoogleGenAI client with API key from environment variables as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface Message {
  role: 'ai' | 'user'; // Removed 'system' as it's handled by systemInstruction parameter
  text: string;
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

    // Fix: Transform messages to Gemini's 'contents' format
    const geminiContents: Content[] = [];

    // Add chat history from previous turns
    if (Array.isArray(history)) {
      history.forEach((msg: Message) => {
        // Only include 'user' and 'ai' (model) roles in chat history for turns
        if (msg.role === 'user' || msg.role === 'ai') {
          geminiContents.push({
            role: msg.role === 'user' ? 'user' : 'model', // Map 'ai' to 'model' for Gemini
            parts: [{ text: msg.text }],
          });
        }
      });
    }

    // Add the current user message
    geminiContents.push({ role: 'user', parts: [{ text: message }] });

    // Fix: Prepare parameters for ai.models.generateContent according to guidelines
    const generateContentParams: GenerateContentParameters = {
      model: "gemini-3-flash-preview", // Use a recommended Gemini model for text tasks
      contents: geminiContents,
      config: {
        systemInstruction: systemInstruction || undefined, // Set system instruction if provided
      },
    };

    // Fix: Call Google Gemini API
    const geminiResponse: GenerateContentResponse = await ai.models.generateContent(generateContentParams);
    const aiReply = geminiResponse.text || "দুঃখিত, আমি তোমার কথা বুঝতে পারিনি।"; // Fix: Extract text using the .text property

    // Log the AI interaction to Supabase
    if (userId) {
      const { error: logError } = await supabase.from('ai_logs').insert({
        user_id: userId,
        prompt: message,
        response: aiReply,
        model: generateContentParams.model, // Log the actual model used
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
