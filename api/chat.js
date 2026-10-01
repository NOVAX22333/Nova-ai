import OpenAI from "openai";

const openai = new OpenAI({ 
     apiKey: process.env.OPENAI_API_KEY,
     baseURL: "https://openrouter.ai/api/v1" 
   });

export default async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:8000";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
  { role: "system", content: "“I’m Nova AI. ✨ An intelligent assistant built to help you explore ideas, solve problems, learn faster, and turn your thoughts into reality. Think of me as your digital partner for getting things done.”" },
  { role: "user", content: message }
],
    });

    res.status(200).json({ reply: response.choices[0].message.content });
    
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: "Failed to get response from AI" });
  }
    }
