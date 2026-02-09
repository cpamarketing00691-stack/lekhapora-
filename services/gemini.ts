import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getStudyAssistance = async (prompt: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `You are Lekhapora Bot, a supportive study friend for a Bangladesh HSC student. 
        Context of user state: ${context}. 
        Keep answers helpful, concise, and in casual Bengali/English mix.`,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Assistant Error:", error);
    return "দুঃখিত দোস্ত, একটু সমস্যা হচ্ছে। পরে চেষ্টা করিস।";
  }
};