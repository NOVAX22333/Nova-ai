import OpenAI from "openai";
import { cors, getUser, rpc, FREE, ADMIN_LIMIT } from "./_lib.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const SYSTEM =
  "You are ACE_X AI, a friendly coding and study assistant for students in Ghana (Senior High School, WASSCE and GES curriculum). Teach step by step in simple language. For code, give working, well-commented examples in fenced code blocks and explain how they work. Help with programming, ICT, mathematics and the sciences. " +
  "MATHS FORMAT: write every formula, equation and symbol in LaTeX. Use $...$ for inline maths and $$...$$ on its own line for displayed equations. Never write fractions with a slash like F1/sin(a); use \\frac{F_1}{\\sin\\alpha}. Use \\sin, \\cos, \\theta, \\alpha, \\sqrt{}, x^2, x_1, \\times, \\pm and similar commands. Example of Lami's theorem: $$\\frac{F_1}{\\sin\\alpha}=\\frac{F_2}{\\sin\\beta}=\\frac{F_3}{\\sin\\gamma}$$ " +
  "If you are not sure, say so. Do not help with exam cheating or anything harmful.";

const hits = new Map();

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Please log in first." });

  const now = Date.now();
  const recent = (hits.get(user.id) || []).filter((t) => now - t < 60000);
  if (recent.length >= 20) return res.status(429).json({ error: "Too many messages. Please wait a minute." });
  recent.push(now);
  hits.set(user.id, recent);

  try {
    const { message, history, image, quiz, count } = req.body || {};
    if (typeof message !== "string" || !message.trim()) return res.status(400).json({ error: "Message is required" });
    if (message.length > 25000) return res.status(400).json({ error: "Message is too long" });

    if (quiz === true) {
      const n = Math.min(Math.max(parseInt(count, 10) || 5, 1), 10);
      const q = await rpc("consume_quiz", { uid: user.id, n, free_limit: FREE, admin_limit: ADMIN_LIMIT });
      if (!q) return res.status(500).json({ error: "Could not check your quiz limit. Try again." });
      if (!q.ok) {
        return res.status(402).json({
          error: q.reason === "limit" ? "You reached today's admin limit." : "You don't have enough quiz questions left. Buy more to continue.",
          reason: q.reason,
        });
      }
    }

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
      max_tokens: 3000,
      messages: [{ role: "system", content: SYSTEM }, ...past, { role: "user", content }],
    });

    res.status(200).json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("AI error:", error);
    res.status(500).json({ error: "Failed to get response from AI" });
  }
}
