
import { Language } from '../types';

export const getGeminiResponse = async (
  message: string, 
  history: { role: 'user' | 'model'; parts: { text: string }[] }[], 
  systemInstruction: string,
  userId: string
) => {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history,
        userId,
        systemInstruction
      })
    });

    if (!response.ok) throw new Error('Failed to fetch from AI route');
    
    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error("Gemini Proxy Error:", error);
    return "দুঃখিত দোস্ত, আমি এই মুহূর্তে কানেক্ট করতে পারছি না। দয়া করে পরে চেষ্টা কর।";
  }
};
