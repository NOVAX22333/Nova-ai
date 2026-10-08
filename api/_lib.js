export const SB = "https://qlvbuxrmgxpytgpvcguw.supabase.co";
export const PUB = "sb_publishable_GVKoHxwlqBKilE0j90s2Ww_Me0rb9Ua";
export const FREE = 15;
export const ADMIN_LIMIT = 100;
export const FREE_CHAT = parseInt(process.env.FREE_CHAT_LIMIT, 10) || 15;

// Prices in pesewas (GH₵1 = 100). Change prices here, and in index.html / App3.js.
export const PLANS = {
  p1: { pesewas: 100, credits: 10 },
  p2: { pesewas: 200, credits: 20 },
  w1: { pesewas: 200, days: 7 },
  w2: { pesewas: 400, days: 14 },
  w3: { pesewas: 600, days: 21 },
  m1: { pesewas: 800, days: 30 },
  m5: { pesewas: 4000, days: 150 },
  y1: { pesewas: 10000, days: 365 },
};

export function cors(req, res) {
  const origins = (process.env.ALLOWED_ORIGIN || "http://localhost:8000").split(",").map((s) => s.trim());
  if (origins.includes(req.headers.origin)) res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}

export const svc = (path, opt = {}) =>
  fetch(SB + path, {
    ...opt,
    headers: { apikey: process.env.SUPABASE_SECRET_KEY, "Content-Type": "application/json", ...(opt.headers || {}) },
  });

export async function getUser(req) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) return null;
  const r = await fetch(SB + "/auth/v1/user", { headers: { apikey: PUB, Authorization: h } });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? u : null;
}

export async function rpc(fn, args) {
  const r = await svc("/rest/v1/rpc/" + fn, { method: "POST", body: JSON.stringify(args) });
  return r.ok ? r.json() : null;
}

export async function status(u) {
  await svc("/rest/v1/accounts?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify({ id: u.id, email: u.email, name: (u.user_metadata && u.user_metadata.name) || null }),
  });
  const r = await svc("/rest/v1/accounts?id=eq." + u.id + "&select=*");
  const a = (await r.json())[0];
  const today = new Date().toISOString().slice(0, 10);
  const pro = !!(a.pro_until && new Date(a.pro_until) > new Date());
  const vip = !!a.is_admin || pro;
  const used = a.qday === today ? a.qcount : 0;
  const limit = vip ? ADMIN_LIMIT : FREE;
  return {
    credits: a.credits,
    admin: !!a.is_admin,
    pro,
    proUntil: a.pro_until,
    vip,
    used,
    limit,
    left: Math.max(0, limit - used),
    chatLeft: vip ? null : Math.max(0, FREE_CHAT - (a.cday === today ? a.ccount : 0)),
  };
    }
