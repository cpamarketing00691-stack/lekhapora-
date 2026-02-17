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

  // 1. SECURE KEY RETRIEVAL
  // UPDATED KEY provided by user
  const API_KEY = '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';

  if (!API_KEY) {
    console.error('❌ API_KEY missing');
    return res.status(500).json({ 
      error: 'AI service not configured',
      success: false,
      reply: 'সার্ভারে এআই চাবি (API Key) কনফিগার করা নেই।'
    });
  }

  try {
    const { message, history = [], userProfile = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 2. CONTEXT & SYSTEM PROMPT
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
    - Maximum 3 paragraphs per response unless explaining a derivation.
    - Use Markdown for bolding key terms.`;

    // 3. MESSAGE FORMATTING
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text || msg.content || ''
      })),
      { role: "user", content: message }
    ];

    // 4. PROVIDER CONFIGURATION (OpenRouter)
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    const modelId = 'deepseek/deepseek-chat'; // DeepSeek V3 via OpenRouter

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'HTTP-Referer': 'https://lekhapora.app', // Required by OpenRouter
      'X-Title': 'Lekhapora HSC Tracker' // Required by OpenRouter
    };

    // 5. API CALL
    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: modelId,
        messages: messages,
        temperature: 0.7, 
        max_tokens: 1500,
        stream: false
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Provider Error:', aiResponse.status, errorText);

      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        errorJson = { error: { message: errorText } };
      }

      const specificMessage = errorJson?.error?.message || aiResponse.statusText;

      if (aiResponse.status === 401) {
        return res.status(401).json({ 
          success: false, 
          error: `Unauthorized: ${specificMessage}`, 
          reply: 'এআই কী (Key) টি সঠিক নয় বা মেয়াদ শেষ হয়েছে। দয়া করে ব্যালেন্স চেক করো।' 
        });
      }
      if (aiResponse.status === 402) {
        return res.status(402).json({ 
          success: false, 
          error: `Payment Required: ${specificMessage}`, 
          reply: 'এআই অ্যাকাউন্টে পর্যাপ্ত ক্রেডিট নেই। দয়া করে রিচার্জ করো।' 
        });
      }
      if (aiResponse.status === 429) {
        return res.status(429).json({ success: false, error: 'Rate limit exceeded.', reply: 'আমি এখন একটু ব্যস্ত, কিছুক্ষণ পর আবার চেষ্টা করো।' });
      }
      
      throw new Error(`AI Provider Error (${aiResponse.status}): ${specificMessage}`);
    }

    const data = await aiResponse.json();
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
      reply: 'দুঃখিত বন্ধু, সংযোগে সমস্যা হচ্ছে। দয়া করে একটু পর আবার চেষ্টা করো।'
    });
  }
}