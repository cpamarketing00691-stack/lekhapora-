import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Set CORS headers for security and browser compatibility
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!API_KEY) {
    console.error("CRITICAL: DEEPSEEK_API_KEY is missing in Vercel environment.");
    return res.status(500).json({ 
      response: "AI system is unconfigured. Please add DEEPSEEK_API_KEY in Vercel dashboard.", 
      success: false 
    });
  }

  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = `You are "Lekhapora AI", an elite study assistant for HSC (Higher Secondary Certificate) students in Bangladesh. 
    - Help with Physics, Chemistry, Biology, Higher Math, and ICT strictly following the NCTB curriculum.
    - Provide clear, step-by-step explanations for complex formulas or concepts.
    - Use a friendly, encouraging tone.
    - Support both English and Bengali. If the user asks in Bengali, reply in Bengali.
    - Keep responses concise but comprehensive.`;

    // Map legacy history format to DeepSeek format
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((msg: any) => ({
        role: (msg.role === 'model' || msg.role === 'assistant') ? 'assistant' : 'user',
        content: msg.text || msg.content
      })),
      { role: "user", content: message }
    ];

    console.log("📨 Dispatching request to DeepSeek API...");

    const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
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

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error(`❌ DeepSeek API Error (${deepseekResponse.status}):`, errorText);
      
      if (deepseekResponse.status === 401) throw new Error("Invalid API key configured.");
      if (deepseekResponse.status === 429) throw new Error("Rate limit exceeded. Please wait.");
      throw new Error("DeepSeek upstream service error.");
    }

    const data = await deepseekResponse.json();
    const aiResponse = data.choices[0].message.content;

    console.log("✅ AI Response successful. Token usage:", data.usage);

    return res.status(200).json({ 
      response: aiResponse, 
      success: true 
    });

  } catch (error: any) {
    console.error("DeepSeek Integration Handler Failed:", error.message);
    
    let friendlyMessage = "দুঃখিত দোস্ত, সার্ভারে সমস্যা হচ্ছে। একটু পর চেষ্টা করো।";
    let statusCode = 500;

    if (error.message.includes("Rate limit")) {
      statusCode = 429;
      friendlyMessage = "অতিরিক্ত রিকোয়েস্ট পাঠানো হয়েছে। দয়া করে কিছুক্ষণ অপেক্ষা করো।";
    }

    return res.status(statusCode).json({ 
      response: friendlyMessage, 
      success: false,
      error: error.message 
    });
  }
}