import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getGeminiResponse = async (message: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[], systemInstruction: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "দুঃখিত দোস্ত, আমি এই মুহূর্তে কানেক্ট করতে পারছি না। দয়া করে পরে চেষ্টা কর।";
  }
};