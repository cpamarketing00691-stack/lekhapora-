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

  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

  if (!DEEPSEEK_API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY not found');
    return res.status(500).json({ 
      error: 'AI service not configured',
      success: false,
      response: 'সার্ভারে এআই চাবি খুঁজে পাওয়া যায়নি। দয়া করে এডমিনকে জানান।'
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

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text || msg.content
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API Error:', response.status, errorText);
      
      if (response.status === 401) throw new Error('Invalid API Key');
      if (response.status === 429) throw new Error('Rate limit exceeded. Please wait.');
      throw new Error('Upstream AI service error');
    }

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content;

    if (!aiReply) {
      throw new Error('Empty response from AI');
    }

    return res.status(200).json({ 
      success: true,
      response: aiReply,
      usage: data.usage
    });

  } catch (error: any) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message,
      response: 'দুঃখিত বন্ধু, এই মুহূর্তে আমার মাথায় একটু জট লেগেছে। দয়া করে আবার চেষ্টা করো।'
    });
  }
}