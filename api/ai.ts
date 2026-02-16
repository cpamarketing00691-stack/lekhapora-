import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ response: "AI configuration missing.", success: false });
  }

  try {
    const { message, history } = req.body;

    const systemPrompt = `You are "Lekhapora AI", a helpful study assistant for HSC (Higher Secondary Certificate) students in Bangladesh. 
    - Help with Physics, Chemistry, Biology, Higher Math, ICT and other NCTB subjects.
    - Provide clear, concise, educational responses.
    - Use simple language and explain concepts step-by-step.
    - Support both English and Bengali (Bangla).`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text || msg.content
      })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      const status = response.status;
      let msg = "AI Error";
      if (status === 401) msg = "Invalid API Key";
      if (status === 429) msg = "Rate limit exceeded";
      throw new Error(msg);
    }

    const data = await response.json();
    return res.status(200).json({ 
      response: data.choices[0].message.content, 
      success: true,
      usage: data.usage 
    });

  } catch (error: any) {
    console.error("AI Error:", error);
    return res.status(500).json({ response: error.message, success: false });
  }
}