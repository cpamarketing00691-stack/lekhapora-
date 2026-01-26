
import { GoogleGenAI } from "@google/genai";

/**
 * Server-side API handler for secure Gemini AI interactions.
 * Endpoint: /api/chat
 * 
 * This route is designed to run in a Vercel serverless environment, 
 * ensuring the API key remains protected on the server.
 */
export default async function handler(req: any, res: any) {
  // Ensure only POST requests are processed for security
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { message } = req.body;

  // Validate the incoming request body
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A valid message string is required.' });
  }

  try {
    /**
     * Initialize the Google GenAI client.
     * 
     * IMPORTANT: Per system-level security requirements, the API key is 
     * sourced exclusively from the `process.env.API_KEY` environment variable.
     */
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    /**
     * Execute the content generation request.
     * We use 'gemini-3-flash-preview' for its balance of performance 
     * and response speed in general Q&A and text tasks.
     */
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
    });

    /**
     * Extract the generated text. 
     * `response.text` is a getter property provided by the SDK.
     */
    const reply = response.text;

    if (!reply) {
      throw new Error('AI model returned an empty response.');
    }

    // Return the response in the JSON format specified by the user requirements.
    return res.status(200).json({ reply });
  } catch (error: any) {
    // Server-side logging for error monitoring
    console.error('Backend Gemini API Error:', error.message);
    
    // Return a generic, safe error message to the frontend
    return res.status(500).json({ 
      error: 'An error occurred on the server while communicating with the AI model.' 
    });
  }
}
