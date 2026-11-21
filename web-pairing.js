"use strict";
/**
 * MISS PATHANI MINI BOT - Web pairing site (Railway ready, MULTI-USER)
 *
 *   GET  /              pairing website
 *   GET  /dp.jpg        bot profile picture
 *   GET  /healthz       health check (Railway)
 *   GET  /api/info      brand links + telegram username
 *   GET  /api/stats     live stats (uptime, active sessions, ...)
 *   GET  /api/status?number=923001234567   { linked, running }
 *   POST /api/pair      { number, password? } -> { code }
 *   GET  /admin         admin panel (email + password login)
 *
 * Every number that pairs gets its OWN session (utils/sessionManager.js),
 * so many people can link their WhatsApp at the same time and the
 * "already linked" error of the old single-session design is gone.
 * The same sessions are shared with the Telegram pairing bot.
 *
 * Optional env:  WEB_PASSWORD   (page asks for it before it gives a code)
 *                MAX_SESSIONS   (0 = unlimited)
 *                TELEGRAM_BOT_TOKEN
 */
const fs = require("fs");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const brand = require("./utils/brand");

const WEB_DIR = path.join(__dirname, "web");
const STARTED = Date.now();
const CODE_LIFETIME_S = 120;

let startCore = () => {};
let coreRunning = () => false;
let tgUser = null, tgFetched = false;

const sm = () => require("./utils/sessionManager");
const admin = () => require("./utils/adminStore");
const loginFails = new Map(); // ip -> { n, until }
const cookieOf = (req, name) => { const m = String(req.headers.cookie || "").match(new RegExp("(?:^|; )" + name + "=([^;]+)")); return m ? decodeURIComponent(m[1]) : ""; };
const isAdmin = (req) => admin().verifyToken(cookieOf(req, "pm_admin"));

// ---------- helpers ----------
const hits = new Map(); // ip -> [timestamps]
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  list.push(now); hits.set(ip, list);
  return list.length > 20 || (list.length > 1 && now - list[list.length - 2] < 6000);
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 3600000)) hits.delete(k); }, 600000).unref();

const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const send = (res, code, body, type = "application/json; charset=utf-8", extra = {}) => {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...extra });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 4096) { reject(new Error("body too large")); req.destroy(); } });
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(new Error("bad JSON")); } });
    req.on("error", reject);
  });
}
function cleanNumber(v) {
  let n = String(v || "").replace(/\D/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  return n;
}

async function telegramUsername() {
  if (tgFetched) return tgUser;
  tgFetched = true;
  try {
    let token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
    if (!token) { try { token = fs.readFileSync(path.join(__dirname, "telegram_token.txt"), "utf8").trim(); } catch (_) {} }
    if (!token) return null;
    const axios = require("axios");
    const r = await axios.get(`https://api.telegram.org/bot${token}/getMe`, { timeout: 8000 });
    tgUser = r.data && r.data.result && r.data.result.username ? r.data.result.username : null;
  } catch (_) { tgFetched = false; }
  return tgUser;
}

// ---------- server ----------
function start(opts = {}) {
  startCore = opts.startCore || startCore;
  coreRunning = opts.coreRunning || coreRunning;
  const port = Number(opts.port || process.env.PORT || 3000);

  const server = http.createServer(async (req, res) => {
    try {
      const url = (req.url || "/").split("?")[0];
      const query = new URLSearchParams((req.url || "").split("?")[1] || "");
      const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();

      if (req.method === "GET" && (url === "/healthz" || url === "/health")) return send(res, 200, "ok", "text/plain");
      if (req.method === "GET" && (url === "/" || url === "/index.html" || url === "/pair")) {
        try { admin().recordVisit(ip, url); } catch (_) {}
      }
      if (req.method === "GET" && (url === "/" || url === "/index.html" || url === "/pair"))
        return send(res, 200, fs.readFileSync(path.join(WEB_DIR, "index.html")), "text/html; charset=utf-8");
      if (req.method === "GET" && url === "/dp.jpg")
        return send(res, 200, fs.readFileSync(path.join(WEB_DIR, "dp.jpg")), "image/jpeg", { "Cache-Control": "public, max-age=86400" });

      // ================= ADMIN PANEL =================
      if (req.method === "GET" && (url === "/admin" || url === "/admin/"))
        return send(res, 200, fs.readFileSync(path.join(WEB_DIR, "admin.html")), "text/html; charset=utf-8", { "X-Frame-Options": "DENY", "Cache-Control": "no-store" });

      if (url.startsWith("/admin/api/")) {
        const ad = admin();
        if (req.method === "POST" && url === "/admin/api/login") {
          const f = loginFails.get(ip) || { n: 0, until: 0 };
          if (f.until > Date.now()) return send(res, 429, { error: "Too many wrong attempts. Try again in a few minutes." });
          const body = await readBody(req);
          if (!ad.checkLogin(body.email, body.password)) {
            f.n++; if (f.n >= 5) { f.until = Date.now() + 10 * 60 * 1000; f.n = 0; }
            loginFails.set(ip, f); ad.log("security", "Failed admin login attempt");
            return send(res, 401, { error: "Wrong email or password." });
          }
          loginFails.delete(ip); ad.log("security", "Admin logged in");
          const secure = String(req.headers["x-forwarded-proto"] || "").includes("https") ? "; Secure" : "";
          return send(res, 200, { ok: true }, "application/json; charset=utf-8", { "Set-Cookie": "pm_admin=" + ad.makeToken() + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200" + secure });
        }
        if (req.method === "POST" && url === "/admin/api/logout")
          return send(res, 200, { ok: true }, "application/json; charset=utf-8", { "Set-Cookie": "pm_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" });
        if (!isAdmin(req)) return send(res, 401, { error: "Not logged in." });

        if (req.method === "GET" && url === "/admin/api/overview") {
          const s = sm(), reg = ad.getRegistry(), st = ad.getStats();
          const live = s.listAll();
          const map = new Map(live.map((x) => [x.number, x]));
          const rows = [];
          for (const x of live) {
            const r = reg[x.number] || {};
            rows.push({ number: x.number, engine: x.engine, linked: x.linked, running: x.running, source: r.source || "unknown", firstSeen: r.firstSeen || null, lastSeen: r.lastSeen || null, linkedAt: r.linkedAt || null, requests: r.requests || 0, blocked: !!r.blocked });
          }
          for (const r of Object.values(reg)) {
            if (map.has(r.number)) continue;
            rows.push({ number: r.number, engine: r.engine || 1, linked: false, running: false, source: r.source, firstSeen: r.firstSeen, lastSeen: r.lastSeen, linkedAt: r.linkedAt || null, requests: r.requests, blocked: !!r.blocked });
          }
          rows.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
          const today = new Date().toISOString().slice(0, 10);
          const d = st.daily[today] || { views: 0, uniques: 0, pairs: 0 };
          return send(res, 200, {
            totals: { views: st.views, uniqueVisitors: st.uniquesTotal || 0, numbers: rows.length, linked: rows.filter((r) => r.linked).length, running: rows.filter((r) => r.running).length, blocked: rows.filter((r) => r.blocked).length },
            today: d,
            daily: Object.entries(st.daily).sort().slice(-14).map(([date, v]) => ({ date, ...v })),
            sessions: rows,
            log: st.log.slice(0, 100),
            server: { uptime: Math.floor((Date.now() - STARTED) / 1000), memoryMB: Math.round(process.memoryUsage().rss / 1048576), node: process.version },
          });
        }

        if (req.method === "POST" && url === "/admin/api/remove") {
          const body = await readBody(req);
          const number = cleanNumber(body.number), engine = Number(body.engine) === 2 ? 2 : 1;
          if (number.length < 6) return send(res, 400, { error: "Invalid number." });
          await sm().adminRemove(engine, number);
          if (body.block) ad.setBlocked(number, true, body.reason || "Misuse");
          ad.log("remove", "Admin removed +" + number + (body.block ? " and blocked it" : ""));
          return send(res, 200, { ok: true });
        }
        if (req.method === "POST" && url === "/admin/api/block") {
          const body = await readBody(req); const number = cleanNumber(body.number);
          if (number.length < 6) return send(res, 400, { error: "Invalid number." });
          ad.setBlocked(number, !!body.blocked, body.reason);
          return send(res, 200, { ok: true });
        }
        if (req.method === "POST" && url === "/admin/api/forget") {
          const body = await readBody(req); const number = cleanNumber(body.number);
          ad.forget(number); ad.log("forget", "Admin cleared the record of +" + number);
          return send(res, 200, { ok: true });
        }
        return send(res, 404, { error: "not found" });
      }

      if (req.method === "GET" && url === "/api/info") {
        const tg = await telegramUsername();
        return send(res, 200, {
          name: brand.BOT_NAME, developer: brand.DEVELOPER, tagline: brand.TAGLINE,
          channel: brand.CHANNEL_URL, group: brand.GROUP_URL,
          telegram: tg ? "https://t.me/" + tg : null, telegramUser: tg ? "@" + tg : null,
          passwordRequired: !!process.env.WEB_PASSWORD,
          codeSeconds: CODE_LIFETIME_S,
        });
      }

      if (req.method === "GET" && url === "/api/stats") {
        let sessions = 0; try { sessions = sm().count(); } catch (_) {}
        const mem = process.memoryUsage();
        return send(res, 200, {
          online: true,
          uptime: Math.floor((Date.now() - STARTED) / 1000),
          sessions: sessions + (coreRunning() ? 1 : 0),
          memoryMB: Math.round(mem.rss / 1048576),
          node: process.version,
          now: Date.now(),
        });
      }

      if (req.method === "GET" && url === "/api/status") {
        const number = cleanNumber(query.get("number"));
        if (number.length < 8 || number.length > 15) return send(res, 400, { error: "Invalid number." });
        const s = sm();
        return send(res, 200, { number, linked: s.isLinked(1, number), running: s.isRunning(1, number) });
      }

      if (req.method === "POST" && url === "/api/pair") {
        if (limited(ip)) return send(res, 429, { error: "Too many requests. Please wait a few seconds and try again." });
        const body = await readBody(req);
        if (process.env.WEB_PASSWORD && !safeEq(body.password || "", process.env.WEB_PASSWORD))
          return send(res, 401, { error: "Wrong password." });
        const number = cleanNumber(body.number);
        if (number.length < 8 || number.length > 15)
          return send(res, 400, { error: "Invalid number. Use the country code, no + or spaces. Example: 923001234567" });
        if (admin().isBlocked(number)) return send(res, 403, { error: "This number has been blocked by the administrator." });
        const s = sm();
        if (s.isLinked(1, number)) {
          // make sure it is running, then tell the user it is done
          try { await s.requestPairing(1, number, null, ip); } catch (_) {}
          return send(res, 200, { alreadyLinked: true, number });
        }
        const code = await s.requestPairing(1, number, null, ip);
        return send(res, 200, { code, number, secondsLeft: CODE_LIFETIME_S });
      }
      return send(res, 404, { error: "not found" });
    } catch (e) {
      console.error("[WEB]", e.message);
      const m = String(e.message || "Something went wrong");
      return send(res, /already linked/i.test(m) ? 409 : /in progress|full/i.test(m) ? 429 : 500, { error: m.replace(/✅/g, "").trim() });
    }
  });
  server.on("error", (e) => console.error("[WEB] server error:", e.message));
  server.listen(port, "0.0.0.0", () => console.log("🌐 Pairing website is running on port " + port));
  return server;
}

module.exports = { start };
