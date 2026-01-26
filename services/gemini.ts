
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

  async getStudyTips(userProfile: any, subjects: any[], studyHistory: any[]) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const progressSummary = subjects.map(s => {
        const completed = s.chapters.filter((c: any) => c.isCompleted).length;
        const total = s.chapters.length;
        return `${s.name} P${s.paper}: ${completed}/${total} chapters completed`;
      }).join(', ');

      const recentFocus = studyHistory.slice(0, 5).map(s => {
        return `${s.subjectId ? 'Subject session' : 'General session'} for ${Math.round(s.durationSeconds / 60)} mins with mood ${s.mood}`;
      }).join('. ');

      const prompt = `Based on my current HSC preparation progress: ${progressSummary || 'No subjects added yet'}. 
      My recent study activity: ${recentFocus || 'No recent sessions'}.
      Please suggest 3 specific, actionable study strategies or tips for me right now. 
      Focus on where I might be lagging or how to maintain my current pace.
      Respond in friendly, conversational Bangla/Banglish.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          systemInstruction: this.getSystemInstruction(userProfile),
          temperature: 0.8 
        }
      });

      return response.text;
    } catch (error: any) {
      console.error("Gemini Study Tips Error:", error);
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
              text: `This is an image of an HSC NCTB syllabus for a ${userProfile.group} group student in Bangladesh. 
              Please extract every subject name, which paper it is (1 or 2), and a list of all chapters for that subject.
              Standardize subject names to English (e.g., Physics, Chemistry, Bangla, ICT).
              Return the data as a clean JSON object.`
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
                    name: { type: Type.STRING, description: "Standard English name of subject" },
                    paper: { type: Type.NUMBER, description: "1 for 1st paper, 2 for 2nd" },
                    chapters: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING, description: "Full chapter title" }
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
      console.error("Gemini Syllabus Analysis Error:", error);
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
              text: `This is an HSC Exam Routine from a Bangladesh Education Board. 
              Find all exams related to the ${userProfile.group} group and compulsory subjects (Bangla, English, ICT).
              Extract the Subject Name, Paper (1 or 2), and the Date of the exam.
              Format the date as YYYY-MM-DD. Return strictly as JSON.`
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
                    date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" }
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
