
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private systemInstruction = `You are a supportive, human-like study buddy for a Bangladesh HSC student.
  Rules:
  1. Be friendly, short, and natural.
  2. Priority: Conversational Bangla (Banglish or proper Bangla).
  3. Address the user by their name.
  4. Never use fake data. If data is missing, say "তুমি এখনো এই তথ্যটি দাওনি".
  5. If user is Muslim, remind them of prayer breaks gently (Fajr, Dhuhr, Asr, Maghrib, Isha).
  6. Encourage breaks and focus on health.
  7. No lecturing. Just supportive tips.`;

  async chat(userProfile: any, message: string, history: any[]) {
    // Initialize right before API call as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    
    // Construct parts including system instruction and context
    const contextPart = { 
      text: `${this.systemInstruction}\nUser Name: ${userProfile.fullName}. AI Name: ${userProfile.aiName}. Group: ${userProfile.group}.` 
    };
    
    // Map history to simple text parts for a conversational flow
    const historyParts = history.slice(-6).map(m => ({ 
      text: `${m.role === 'ai' ? 'Buddy' : 'Student'}: ${m.text}` 
    }));
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          contextPart,
          ...historyParts,
          { text: `Student: ${message}` }
        ] 
      }
    });
    return response.text;
  }

  async generateRoutine(userProfile: any, studyHistory: any[], constraints: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const prompt = `Generate a routine request: ${constraints}. (Context: ${userProfile.group}, ${userProfile.religion}). Be realistic. Consider college and prayer times. Respond in friendly Bangla.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { systemInstruction: this.systemInstruction }
    });
    return response.text;
  }
}

export const geminiService = new GeminiService();
