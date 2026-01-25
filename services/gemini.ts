
import { GoogleGenAI, Type } from "@google/genai";

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

  private cleanJsonResponse(text: string): string {
    // Remove markdown code block wrappers if present
    return text.replace(/```json\n?|```/g, '').trim();
  }

  async chat(userProfile: any, message: string, history: { role: 'ai' | 'user', text: string }[]) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
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

  async analyzeSyllabusImage(userProfile: any, base64Image: string, mimeType: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: `Analyze this image of an HSC syllabus for the ${userProfile.group} group in Bangladesh (NCTB). 
              1. Extract all subjects and their chapters.
              2. Use standardized NCTB subject names (e.g., "Physics", "Chemistry", "ICT").
              3. Identify if it's 1st Paper or 2nd Paper.
              4. Return the data in the specified JSON format. Ensure the response is VALID JSON only.`
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subjects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    paper: { type: Type.NUMBER },
                    chapters: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["name", "paper", "chapters"]
                }
              }
            },
            required: ["subjects"]
          }
        }
      });

      const cleaned = this.cleanJsonResponse(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error: any) {
      console.error("Gemini Vision Error:", error);
      throw error;
    }
  }

  async analyzeExamRoutineImage(userProfile: any, base64Image: string, mimeType: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: `Analyze this image of a Bangladesh HSC Exam Routine (NCTB). 
              1. Extract exam dates specifically for the subjects relevant to a ${userProfile.group} group student.
              2. Match subject names to standard forms (e.g., "Physics", "Bangla").
              3. Correctly identify the Paper (1 or 2).
              4. Return the data in strict JSON format with ISO dates (YYYY-MM-DD). Ensure the response is VALID JSON only.`
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              exams: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    subjectName: { type: Type.STRING },
                    paper: { type: Type.NUMBER },
                    date: { type: Type.STRING }
                  },
                  required: ["subjectName", "paper", "date"]
                }
              }
            },
            required: ["exams"]
          }
        }
      });

      const cleaned = this.cleanJsonResponse(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error: any) {
      console.error("Gemini Routine Analysis Error:", error);
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
