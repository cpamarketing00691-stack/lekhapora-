/**
 * Lekhapora AI Proxy - DeepSeek Integration
 * Handles secure communication between the frontend and DeepSeek API.
 */

export const config = {
  runtime: 'edge', // Using Edge runtime for faster global response
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!API_KEY) {
    console.error("CRITICAL: DEEPSEEK_API_KEY is missing in Vercel Environment Variables.");
    return new Response(JSON.stringify({ response: "AI configuration error. Please contact admin.", success: false }), { status: 500 });
  }

  try {
    const { message, history } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    }

    const systemPrompt = `You are "Lekhapora AI", an elite study assistant for HSC (Higher Secondary Certificate) students in Bangladesh. 
    - Help with Physics, Chemistry, Biology, Higher Math, and ICT strictly following the NCTB curriculum.
    - Provide clear, step-by-step explanations for complex formulas or concepts.
    - Use a friendly, encouraging "Study Partner" tone.
    - Support both English and Bengali. If the user asks in Bengali, reply in Bengali.
    - Keep responses concise but comprehensive.`;

    // Prepare message payload for DeepSeek
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text || msg.content
      })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) throw new Error("Invalid API key provided to DeepSeek.");
      if (response.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
      throw new Error(errorData.error?.message || "DeepSeek API Error");
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      response: aiResponse, 
      success: true,
      usage: data.usage 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("DeepSeek Integration Error:", error.message);
    let status = 500;
    let friendlyMessage = "দুঃখিত, এআই সার্ভারে সমস্যা হচ্ছে। একটু পর চেষ্টা করো।";

    if (error.message.includes("Rate limit")) {
      status = 429;
      friendlyMessage = "অতিরিক্ত রিকোয়েস্ট পাঠানো হয়েছে। দয়া করে কিছুক্ষণ অপেক্ষা করো।";
    }

    return new Response(JSON.stringify({ 
      response: friendlyMessage, 
      success: false,
      error: error.message 
    }), {
      status: status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}