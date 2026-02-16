import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Use Environment Variable or Fallback to provided key (Server-Side Only)
  const API_KEY = process.env.DEEPSEEK_API_KEY || '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';

  if (!API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY not found');
    return res.status(500).json({ 
      error: 'AI service not configured',
      success: false,
      reply: 'সার্ভারে এআই চাবি (API Key) খুঁজে পাওয়া যায়নি। দয়া করে এডমিনকে জানান।'
    });
  }

  try {
    const { message, history = [], userProfile = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = `You are "Lekhapora AI", an expert study companion for Bangladesh HSC (Higher Secondary Certificate) students.
    
    IDENTITY & TONE:
    - Casual, friendly, and encouraging (use "Bondhu" or "Bondhura").
    - Respond in a mix of Bengali and English (Banglish) if appropriate, or purely Bengali if asked.
    - Be concise but explain difficult topics step-by-step.
    
    SUBJECT EXPERTISE (NCTB):
    - Physics (Dynamics, Vector, Newtonian Mechanics, etc.)
    - Chemistry (Organic, Qualitative, Quantitative)
    - Biology (Cell structure, Plant/Animal Physiology, Genetics)
    - Higher Math (Calculus, Trigonometry, Matrix)
    - ICT (Number systems, C Programming, HTML, Database)
    
    STUDENT CONTEXT:
    - Name: ${userProfile.fullName || 'Student'}
    - Group: ${userProfile.group || 'N/A'}
    - Board: ${userProfile.board || 'N/A'}
    
    STRICT RULES:
    - Follow the NCTB syllabus only.
    - If asked about non-academic topics, politely redirect to studies.
    - Maximum 3 paragraphs per response unless explaining a derivation.`;

    // Map history to DeepSeek format (user/assistant)
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text || msg.content || ''
      })),
      { role: "user", content: message }
    ];

    const deepSeekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 1.0,
        stream: false
      })
    });

    if (!deepSeekResponse.ok) {
      const errorText = await deepSeekResponse.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        errorJson = { error: { message: errorText } };
      }
      
      console.error('DeepSeek API Error:', deepSeekResponse.status, errorText);

      if (deepSeekResponse.status === 401) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid API Key.', reply: 'এআই অথেন্টিকেশন সমস্যা হয়েছে।' });
      }
      if (deepSeekResponse.status === 429) {
        return res.status(429).json({ success: false, error: 'Rate limit exceeded.', reply: 'আমি এখন একটু ব্যস্ত, কিছুক্ষণ পর আবার চেষ্টা করো।' });
      }
      if (deepSeekResponse.status >= 500) {
        return res.status(502).json({ success: false, error: 'DeepSeek Server Error.', reply: 'সার্ভারে সমস্যা হচ্ছে, পরে চেষ্টা করো।' });
      }
      
      throw new Error(`DeepSeek API Error: ${errorJson?.error?.message || deepSeekResponse.statusText}`);
    }

    const data = await deepSeekResponse.json();
    const aiReply = data.choices?.[0]?.message?.content || "";

    if (!aiReply) {
      throw new Error('Empty response from AI');
    }

    return res.status(200).json({ 
      success: true,
      reply: aiReply
    });

  } catch (error: any) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message,
      reply: 'দুঃখিত বন্ধু, এই মুহূর্তে আমার মাথায় একটু জট লেগেছে। দয়া করে আবার চেষ্টা করো।'
    });
  }
}