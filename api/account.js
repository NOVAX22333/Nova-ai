import { timingSafeEqual } from "node:crypto";
import { svc, getUser, rpc, status, cors } from "./_lib.js";

// pro: GH₵15 = 1500 pesewas for 30 days. Keep this in sync with PRO_PRICE in App3.js.
const PLANS = {
  p1: { pesewas: 100, credits: 10 },
  p2: { pesewas: 200, credits: 20 },
  pro: { pesewas: 1500, credits: 0, days: 30 },
};
const tries = new Map();

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: "Please log in first." });
    const { action, code, reference, plan } = req.body || {};

    if (action === "status") return res.status(200).json(await status(user));

    if (action === "admin") {
      const now = Date.now();
      const t = (tries.get(user.id) || []).filter((x) => now - x < 600000);
      if (t.length >= 5) return res.status(429).json({ error: "Too many tries. Wait 10 minutes." });
      t.push(now);
      tries.set(user.id, t);
      const a = Buffer.from(String(code || ""));
      const b = Buffer.from(process.env.ADMIN_CODE || "");
      if (!b.length || a.length !== b.length || !timingSafeEqual(a, b)) {
        return res.status(403).json({ error: "Wrong admin code." });
      }
      await status(user);
      await svc("/rest/v1/accounts?id=eq." + user.id, { method: "PATCH", body: JSON.stringify({ is_admin: true }) });
      return res.status(200).json(await status(user));
    }

    if (action === "verify") {
      const p = PLANS[plan];
      if (!p || typeof reference !== "string" || !/^[\w.-]{6,80}$/.test(reference)) {
        return res.status(400).json({ error: "Invalid payment details." });
      }
      const r = await fetch("https://api.paystack.co/transaction/verify/" + encodeURIComponent(reference), {
        headers: { Authorization: "Bearer " + process.env.PAYSTACK_SECRET_KEY },
      });
      const j = await r.json();
      const d = j && j.data;
      if (
        !r.ok || !d || d.status !== "success" || d.currency !== "GHS" || d.amount < p.pesewas ||
        !d.metadata || d.metadata.uid !== user.id || d.metadata.plan !== plan
      ) {
        return res.status(400).json({ error: "Payment could not be confirmed." });
      }
      // Records the payment once (same reference can never count twice).
      const added = await rpc("add_credits", { uid: user.id, n: p.credits, ref: reference, pl: plan, amt: d.amount });

      if (p.days && added === true) {
        await status(user);
        const r2 = await svc("/rest/v1/accounts?id=eq." + user.id + "&select=pro_until");
        const cur = (await r2.json())[0];
        const base = cur && cur.pro_until && new Date(cur.pro_until) > new Date() ? new Date(cur.pro_until) : new Date();
        base.setDate(base.getDate() + p.days);
        await svc("/rest/v1/accounts?id=eq." + user.id, {
          method: "PATCH",
          body: JSON.stringify({ pro_until: base.toISOString() }),
        });
      }
      return res.status(200).json({ ...(await status(user)), added: added === true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Something went wrong." });
  }
}
