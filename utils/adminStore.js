"use strict";
/**
 * MISS PATHANI MINI BOT - Admin data store + login.
 *  - registry.json : every number that asked for a pairing code (first/last seen, source, blocked)
 *  - stats.json    : page views, unique visitors (hashed), daily counters, activity log
 * Admin login: ADMIN_EMAIL / ADMIN_PASSWORD env variables override the built-in account.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let PROJECT = path.join(__dirname, "..");
if (path.basename(PROJECT) === "bot2") PROJECT = path.dirname(PROJECT);
const SESSIONS_DIR = process.env.SESSIONS_DIR ? path.resolve(process.env.SESSIONS_DIR) : process.env.DATA_DIR ? path.join(path.resolve(process.env.DATA_DIR), "sessions") : path.join(PROJECT, "sessions");
const REG_FILE = path.join(SESSIONS_DIR, "registry.json");
const STATS_FILE = path.join(SESSIONS_DIR, "stats.json");
const SECRET_FILE = path.join(SESSIONS_DIR, ".admin_secret");

// built-in admin (password stored only as a salted scrypt hash)
const DEFAULT_EMAIL = "am77857866@gmail.com";
const DEFAULT_SALT = "8a25b656642460e376d21713c6a01ee7";
const DEFAULT_HASH = "7a5b9b067688f4f31f662af320378ba789a98aed2a59c38d782ce55afc1f2249";

const load = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (_) { return d; } };
let registry = load(REG_FILE, {});
let stats = load(STATS_FILE, { views: 0, uniques: {}, daily: {}, log: [] });
let dirty = false;
function flush() {
  if (!dirty) return;
  dirty = false;
  try {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    fs.writeFileSync(REG_FILE, JSON.stringify(registry));
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats));
  } catch (_) {}
}
setInterval(flush, 5000).unref();
process.on("exit", flush);

const day = () => new Date().toISOString().slice(0, 10);
const cleanNum = (n) => String(n || "").replace(/\D/g, "");
const hashIp = (ip) => crypto.createHash("sha256").update("ip:" + ip).digest("hex").slice(0, 16);

function log(type, text) {
  stats.log.unshift({ t: Date.now(), type, text: String(text).slice(0, 200) });
  if (stats.log.length > 300) stats.log.length = 300;
  dirty = true;
}

// ---------- tracking ----------
function recordVisit(ip, pagePath) {
  const d = day();
  stats.views++;
  stats.daily[d] = stats.daily[d] || { views: 0, uniques: 0, pairs: 0 };
  stats.daily[d].views++;
  const h = hashIp(ip || "unknown");
  const key = d + ":" + h;
  if (!stats.uniques[key]) { stats.uniques[key] = 1; stats.daily[d].uniques++; stats.uniquesTotal = (stats.uniquesTotal || 0) + 1; }
  // keep the unique table small: only today's and yesterday's keys
  const keep = [d, new Date(Date.now() - 86400000).toISOString().slice(0, 10)];
  for (const k of Object.keys(stats.uniques)) if (!keep.includes(k.slice(0, 10))) delete stats.uniques[k];
  const days = Object.keys(stats.daily).sort();
  while (days.length > 60) delete stats.daily[days.shift()];
  dirty = true;
}

function recordPair(number, engine, source, ip) {
  number = cleanNum(number);
  if (!number) return;
  const now = Date.now();
  const r = registry[number] || (registry[number] = { number, firstSeen: now, requests: 0, source, engine, blocked: false });
  r.lastSeen = now; r.requests++; r.engine = engine; r.source = source || r.source;
  if (ip) r.ipHash = hashIp(ip);
  const d = day();
  stats.daily[d] = stats.daily[d] || { views: 0, uniques: 0, pairs: 0 };
  stats.daily[d].pairs++;
  log("pair", "+" + number + " asked for a pairing code (" + (source || "web") + ")");
  dirty = true;
}
function markLinked(number) {
  const r = registry[cleanNum(number)];
  if (r && !r.linkedAt) { r.linkedAt = Date.now(); log("linked", "+" + cleanNum(number) + " linked successfully"); dirty = true; }
}

// ---------- block list ----------
const isBlocked = (number) => !!(registry[cleanNum(number)] && registry[cleanNum(number)].blocked);
function setBlocked(number, blocked, reason) {
  number = cleanNum(number);
  const r = registry[number] || (registry[number] = { number, firstSeen: Date.now(), requests: 0, source: "admin", engine: 1 });
  r.blocked = !!blocked; r.blockReason = blocked ? String(reason || "Misuse").slice(0, 120) : undefined;
  log(blocked ? "block" : "unblock", "+" + number + (blocked ? " blocked: " + (reason || "Misuse") : " unblocked"));
  dirty = true;
}
function forget(number) { delete registry[cleanNum(number)]; dirty = true; }
const getRegistry = () => registry;
const getStats = () => stats;

// ---------- admin login ----------
function adminEmail() { return (process.env.ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase(); }
function checkLogin(email, password) {
  if (String(email || "").trim().toLowerCase() !== adminEmail()) return false;
  const pw = String(password || "");
  if (process.env.ADMIN_PASSWORD) {
    const a = crypto.createHash("sha256").update(pw).digest(), b = crypto.createHash("sha256").update(process.env.ADMIN_PASSWORD).digest();
    return crypto.timingSafeEqual(a, b);
  }
  const h = crypto.scryptSync(pw, DEFAULT_SALT, 32);
  return crypto.timingSafeEqual(h, Buffer.from(DEFAULT_HASH, "hex"));
}
function secret() {
  try { return fs.readFileSync(SECRET_FILE, "utf8"); } catch (_) {}
  const s = crypto.randomBytes(32).toString("hex");
  try { fs.mkdirSync(SESSIONS_DIR, { recursive: true }); fs.writeFileSync(SECRET_FILE, s); } catch (_) {}
  return s;
}
const SECRET = secret();
function makeToken(ttlMs = 12 * 3600 * 1000) {
  const exp = Date.now() + ttlMs;
  const sig = crypto.createHmac("sha256", SECRET).update(String(exp)).digest("hex");
  return exp + "." + sig;
}
function verifyToken(tok) {
  const [exp, sig] = String(tok || "").split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = crypto.createHmac("sha256", SECRET).update(exp).digest("hex");
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}

module.exports = { recordVisit, recordPair, markLinked, isBlocked, setBlocked, forget, getRegistry, getStats, checkLogin, makeToken, verifyToken, log, cleanNum, SESSIONS_DIR };
