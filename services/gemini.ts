
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private getSystemInstruction(userProfile: any) {
    return `You are a supportive, human-like study buddy for a Bangladesh HSC student named ${userProfile.fullName}. 
    Your name is ${userProfile.aiName}.
    
    Rules:
    1. Be friendly, short, and natural. Use a supportive "big brother/sister" tone.
    2. Priority: Conversational Bangla (Banglish or proper Bangla).
    3. Always address the user as ${userProfile.fullName}.
    4. Never use fake data. If data is missing (like specific progress), say "তুমি এখনো এই তথ্যটি দাওনি" or "আমি এটা জানি না".
    5. Religion Awareness: The user's religion is ${userProfile.religion}. 
       - If the user is Muslim, occasionally remind them of the upcoming prayer (Fajr, Dhuhr, Asr, Maghrib, Isha) if relevant to their study routine.
    6. Group: The user is in the ${userProfile.group} group. Provide subject-specific encouragement.
    7. Encourage breaks and focus on mental health.
    8. No lecturing. Just supportive tips.`;
  }

  async chat(userProfile: any, message: string, history: { role: 'ai' | 'user', text: string }[]) {
    try {
      // Create a new instance right before use to ensure the latest API key is used
      // following the strict initialization requirement: new GoogleGenAI({ apiKey: process.env.API_KEY })
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      /**
       * The Gemini API expects history to start with a 'user' role message and alternate.
       * We filter out the initial AI greeting from the history passed to the API.
       */
      const chatHistory = history
        .filter((msg, index) => {
          if (index === 0 && msg.role === 'ai') return false;
          return true;
        })
        .map(msg => ({
          role: (msg.role === 'ai' ? 'model' : 'user') as 'model' | 'user',
          parts: [{ text: msg.text }]
        }));

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: this.getSystemInstruction(userProfile),
          temperature: 0.7,
          topP: 0.95,
        },
        history: chatHistory,
      });

      const result = await chat.sendMessage({ message });
      return result.text;
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  async generateRoutine(userProfile: any, studyHistory: any[], constraints: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const prompt = `Please generate a realistic study routine based on these constraints: ${constraints}. 
      Consider the user's group (${userProfile.group}), religion (${userProfile.religion}), and existing study patterns. 
      Respond in friendly, conversational Bangla.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          systemInstruction: this.getSystemInstruction(userProfile),
          temperature: 0.5 
        }
      });

      return response.text;
    } catch (error: any) {
      console.error("Gemini Routine Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
