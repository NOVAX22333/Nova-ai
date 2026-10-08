import { createHmac, timingSafeEqual } from "node:crypto";
import { rpc, PLANS } from "./_lib.js";

async function readRaw(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  let body = await readRaw(req);
  if (!body.length && req.body) body = Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body));

  const sig = String(req.headers["x-paystack-signature"] || "");
  const mine = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "").update(body).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(mine);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return res.status(401).end();

  let ev;
  try {
    ev = JSON.parse(body.toString());
  } catch (e) {
    return res.status(400).end();
  }
  if (ev.event !== "charge.success") return res.status(200).end();

  const d = ev.data || {};
  const m = d.metadata || {};
  const p = PLANS[m.plan];
  if (!p || !m.uid || d.status !== "success" || d.currency !== "GHS" || d.amount < p.pesewas || !d.reference) {
    return res.status(200).end();
  }
  try {
    if (p.days) await rpc("add_pro", { uid: m.uid, days: p.days, ref: d.reference, pl: m.plan, amt: d.amount });
    else await rpc("add_credits", { uid: m.uid, n: p.credits, ref: d.reference, pl: m.plan, amt: d.amount });
  } catch (e) {
    console.error("Webhook grant failed:", e);
    return res.status(500).end();
  }
  return res.status(200).end();
}  
