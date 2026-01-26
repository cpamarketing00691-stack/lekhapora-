// Always use GoogleGenAI and Type from @google/genai
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "../lib/supabase";

/**
 * GeminiService handles AI interactions for the application.
 * Updated to use server-side proxies for security.
 */
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

  /**
   * Securely chats with the AI through the backend /api/chat route.
   */
  async chat(userProfile: any, message: string, history: { role: 'ai' | 'user', text: string }[]) {
    try {
      // Get current auth user ID for tracking
      const { data: { user } } = await supabase.auth.getUser();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history,
          systemInstruction: this.getSystemInstruction(userProfile),
          userId: user?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to the AI service');
      }

      const data = await response.json();
      return data.reply;
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      throw error;
    }
  }

  /**
   * Generates study strategies by leveraging the secure chat proxy.
   */
  async getStudyTips(userProfile: any, subjects: any[], studyHistory: any[]) {
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

    return this.chat(userProfile, prompt, []);
  }

  // Implementation of analyzeSyllabusImage using Gemini 3 Flash Preview for vision and JSON extraction
  async analyzeSyllabusImage(userProfile: any, base64: string, mimeType: string) {
    // Instantiate GoogleGenAI right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64,
              mimeType: mimeType
            }
          },
          {
            text: `Extract the HSC (Higher Secondary Certificate) syllabus from this image for the student ${userProfile.fullName}. 
            Identify the subjects, their paper numbers (1 or 2), and the list of chapters for each. 
            The output MUST be a JSON object with a 'subjects' array.`
          }
        ]
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
                  name: {
                    type: Type.STRING,
                    description: "Subject name (e.g., Physics, Biology, Chemistry)."
                  },
                  paper: {
                    type: Type.INTEGER,
                    description: "Paper number (1 or 2)."
                  },
                  chapters: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of chapter titles extracted from the image."
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

    // Access .text property directly, do not call as a method
    const text = response.text;
    if (!text) return { subjects: [] };
    return JSON.parse(text.trim());
  }

  // Implementation of analyzeExamRoutineImage using Gemini 3 Flash Preview for routine analysis
  async analyzeExamRoutineImage(userProfile: any, base64: string, mimeType: string) {
    // Instantiate GoogleGenAI right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64,
              mimeType: mimeType
            }
          },
          {
            text: `Extract the exam schedule from this image. 
            Identify the subject name, the paper number (1 or 2), and the exam date. 
            Ensure dates are formatted as YYYY-MM-DD. 
            The output MUST be a JSON object with an 'exams' array.`
          }
        ]
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
                  subjectName: {
                    type: Type.STRING,
                    description: "Name of the subject."
                  },
                  paper: {
                    type: Type.INTEGER,
                    description: "Paper number (1 or 2)."
                  },
                  date: {
                    type: Type.STRING,
                    description: "The date of the exam in YYYY-MM-DD format."
                  }
                },
                required: ["subjectName", "paper", "date"]
              }
            }
          },
          required: ["exams"]
        }
      }
    });

    // Access .text property directly, do not call as a method
    const text = response.text;
    if (!text) return { exams: [] };
    return JSON.parse(text.trim());
  }
}

export const geminiService = new GeminiService();