import { cors, getUser, rpc, status } from "./_lib.js";

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Please log in first." });
  try {
    const st = await status(user);
    if (!st.vip) return res.status(403).json({ error: "Image Studio is a Pro feature. Upgrade to use it." });
    const prompt = String((req.body || {}).prompt || "").trim().slice(0, 1000);
    if (!prompt) return res.status(400).json({ error: "Describe the image first." });
    const ok = await rpc("consume_image", { uid: user.id, lim: st.admin ? 50 : 10 });
    if (ok !== true) return res.status(429).json({ error: "You reached today's image limit. Try again tomorrow." });

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.IMAGE_MODEL || "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [{ role: "user", content: "Create a clear, educational, school-safe image: " + prompt }],
      }),
    });
    const j = await r.json();
    const m = j.choices && j.choices[0] && j.choices[0].message;
    const url = m && m.images && m.images[0] && m.images[0].image_url && m.images[0].image_url.url;
    if (!r.ok || !url) {
      console.error("Image error:", JSON.stringify(j).slice(0, 600));
      return res.status(502).json({ error: "Could not create the image. Try a different description." });
    }
    return res.status(200).json({ image: url });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Something went wrong." });
  }
    }
