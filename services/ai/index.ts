
import { UserProfile } from '../../types';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

/**
 * Sends a message to the AI service.
 * Currently points to /api/ai which handles the logic (OpenRouter/Gemini).
 */
export const sendMessage = async (
  message: string,
  history: ChatMessage[],
  userProfile: UserProfile | null
): Promise<string> => {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        message,
        history,
        userProfile
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.reply || data.error || 'Network response was not ok');
    }

    return data.reply;
  } catch (error: any) {
    console.error('AI Service Error:', error);
    throw error;
  }
};
