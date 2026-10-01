import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const SYSTEM =
  "You are Nova AI, a friendly coding and study assistant for students in Ghana (Senior High School, WASSCE and GES curriculum). Teach step by step in simple language. For code, give working, well-commented examples in fenced code blocks and explain how they work. Help with programming, ICT, mathematics and the sciences. If you are not sure, say so. Do not help with exam cheating or anything harmful.";

const hits = new Map();

export default async function handler(req, res) {
  const origins = (process.env.ALLOWED_ORIGIN || "http://localhost:8000").split(",").map((s) => s.trim());
  const origin = req.headers.origin;
  if (origins.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0] || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
  if (recent.length >= 20) return res.status(429).json({ error: "Too many messages. Please wait a minute." });
  recent.push(now);
  hits.set(ip, recent);

  try {
    const { message, history, image } = req.body || {};
    if (typeof message !== "string" || !message.trim()) return res.status(400).json({ error: "Message is required" });
    if (message.length > 25000) return res.status(400).json({ error: "Message is too long" });

    const past = Array.isArray(history)
      ? history
          .slice(-20)
          .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }))
      : [];

    let content = message;
    if (typeof image === "string" && image) {
      if (!image.startsWith("data:image/") || image.length > 3000000) {
        return res.status(400).json({ error: "Invalid or too large image" });
      }
      content = [
        { type: "text", text: message },
        { type: "image_url", image_url: { url: image } },
      ];
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "openai/gpt-4o-mini",
      max_tokens: 1500,
      messages: [{ role: "system", content: SYSTEM }, ...past, { role: "user", content }],
    });

    res.status(200).json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("AI error:", error);
    res.status(500).json({ error: "Failed to get response from AI" });
  }
       }
