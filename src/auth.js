"use strict";
/**
 * ავტორიზაცია და სესია.
 * - პაროლი: scrypt ჰეში DATA_DIR/auth.json-ში (git-ში არ შედის)
 * - სესია: ხელმოწერილი (HMAC) ქუქი — სერვერის გადატვირთვა არ აგდებს სისტემიდან
 * - შესვლის ბლოკირება: 6 მცდელობა → 15 წუთი (IP-ზე, ფაილში)
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DATA_DIR, read, write } = require("./core");

const MAX_TRIES = 6;
const LOCK_MS = 15 * 60e3;
const COOKIE = "os_cms";
const AUTH_FILE = path.join(DATA_DIR, "auth.json");

/* ----------------------------------------------------------- საიდუმლო გასაღები */
let secret = process.env.SESSION_SECRET || "";
function getSecret() {
  if (secret) return secret;
  const f = path.join(DATA_DIR, "secret.key");
  try {
    secret = fs.readFileSync(f, "utf8").trim();
  } catch {
    secret = crypto.randomBytes(48).toString("hex");
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(f, secret, { mode: 0o600 });
  }
  return secret;
}

/* -------------------------------------------------------------------- სესია */
const sign = (v) => crypto.createHmac("sha256", getSecret()).update(v).digest("base64url");

function parseCookies(header) {
  const out = {};
  for (const part of String(header || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** Express middleware: req.session (ობიექტი), ცვლილებისას ქუქი ავტომატურად ახლდება */
function sessionMiddleware(req, res, next) {
  let data = {};
  const raw = parseCookies(req.headers.cookie)[COOKIE];
  if (raw && raw.includes(".")) {
    const [body, sig] = raw.split(".");
    const expected = sign(body);
    if (sig && sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      try {
        data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) || {};
        if (data.exp && data.exp < Date.now()) data = {};
      } catch { data = {}; }
    }
  }
  const before = JSON.stringify(data);
  req.session = data;
  const writeHead = res.writeHead;
  res.writeHead = function (...args) {
    const now = JSON.stringify(req.session);
    if (now !== before) {
      const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
      if (!req.session || !Object.keys(req.session).length) {
        res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`);
      } else {
        req.session.exp = Date.now() + 12 * 3600e3;
        const body = Buffer.from(JSON.stringify(req.session)).toString("base64url");
        res.setHeader("Set-Cookie", `${COOKIE}=${body}.${sign(body)}; Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`);
      }
    }
    return writeHead.apply(this, args);
  };
  next();
}

/* ---------------------------------------------------------------- CSRF */
function csrf(req) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString("hex");
  return req.session.csrf;
}
function csrfOk(req, token) {
  const a = String(req.session.csrf || "");
  const b = String(token || "");
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/* ----------------------------------------------------------- პაროლი */
function authConfig() {
  try { return JSON.parse(fs.readFileSync(AUTH_FILE, "utf8")); } catch { return {}; }
}
const isInstalled = () => !!authConfig().hash;

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  return "scrypt$" + salt + "$" + crypto.scryptSync(pw, salt, 64).toString("hex");
}
function verifyPassword(pw, stored) {
  const [alg, salt, hex] = String(stored || "").split("$");
  if (alg !== "scrypt" || !salt || !hex) return false;
  const a = crypto.scryptSync(String(pw), salt, 64);
  const b = Buffer.from(hex, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function install(user, pw) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ user, hash: hashPassword(pw) }), { mode: 0o600 });
    return true;
  } catch { return false; }
}

function attempts() {
  const all = read("login-attempts", { ips: {} }).ips || {};
  for (const [k, v] of Object.entries(all)) if (Date.now() - (v.last || 0) > LOCK_MS) delete all[k];
  return all;
}
function lockedFor(ip) {
  const st = attempts()[ip];
  if (st && st.tries >= MAX_TRIES) return Math.max(0, LOCK_MS - (Date.now() - st.last));
  return 0;
}

async function login(req, user, pw) {
  const c = authConfig();
  const userOk = typeof c.user === "string" && c.user.length === user.length && crypto.timingSafeEqual(Buffer.from(c.user), Buffer.from(user));
  const ok = !!c.hash && verifyPassword(pw, c.hash) && userOk;
  const all = attempts();
  if (!ok) {
    all[req.ip] = { tries: ((all[req.ip] || {}).tries || 0) + 1, last: Date.now() };
    write("login-attempts", { ips: all });
    await new Promise((r) => setTimeout(r, 300));
    return false;
  }
  delete all[req.ip];
  write("login-attempts", { ips: all });
  req.session = { uid: c.user, csrf: crypto.randomBytes(24).toString("hex") };
  return true;
}

module.exports = { sessionMiddleware, csrf, csrfOk, authConfig, isInstalled, install, verifyPassword, lockedFor, login };
