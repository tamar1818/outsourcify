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

/* ----------------------------------------------------------- მომხმარებლები
 * DATA_DIR/auth.json: { users: [{ id, user, name, email, perms[], hash, ver, disabled, owner, created }],
 *                      invites: [{ id, hash, kind: "invite"|"reset", uid?, email, name, perms[], expires, created, by }] }
 * ტოკენი მხოლოდ ერთხელ ჩანს (ბმულში); ფაილში მისი SHA-256 ინახება.
 */
const PERMS = ["content", "media", "settings", "inbox", "backup", "users"];
const INVITE_MS = 7 * 24 * 3600e3;
const RESET_MS = 24 * 3600e3;
const newId = () => crypto.randomBytes(8).toString("hex");
const tokenHash = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");
const cleanPerms = (list) => PERMS.filter((p) => (Array.isArray(list) ? list : []).includes(p));

function store() {
  let c = {};
  try { c = JSON.parse(fs.readFileSync(AUTH_FILE, "utf8")) || {}; } catch { c = {}; }
  // ძველი ფორმატი { user, hash } → პირველი (მფლობელი) მომხმარებელი
  if (!Array.isArray(c.users)) {
    c = { users: c.hash ? [{ id: newId(), user: c.user, name: c.user, email: "", perms: [...PERMS], hash: c.hash, ver: 1, owner: true, created: Date.now() }] : [], invites: [] };
    if (c.users.length) save(c);
  }
  c.invites = (c.invites || []).filter((x) => x.expires > Date.now());
  return c;
}
function save(c) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = AUTH_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(c, null, 1), { mode: 0o600 });
    fs.renameSync(tmp, AUTH_FILE);
    return true;
  } catch { return false; }
}
const authConfig = store;
const isInstalled = () => store().users.length > 0;
const publicUser = (u) => ({ id: u.id, user: u.user, name: u.name || u.user, email: u.email || "", perms: u.owner ? [...PERMS] : cleanPerms(u.perms), owner: !!u.owner, disabled: !!u.disabled, created: u.created, last: u.last || 0 });

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

const validLogin = (u) => /^[a-zA-Z0-9._@-]{3,40}$/.test(u);
function checkNew(c, user, pw, exceptId) {
  if (!validLogin(user)) return "მომხმარებლის სახელი: 3–40 სიმბოლო (ლათინური ასოები, ციფრები, . _ - @)";
  if (c.users.some((x) => x.id !== exceptId && x.user.toLowerCase() === user.toLowerCase())) return "ეს მომხმარებლის სახელი დაკავებულია";
  if (String(pw).length < 10) return "პაროლი — მინიმუმ 10 სიმბოლო";
  return "";
}

/** პირველი გაშვება: მხოლოდ მაშინ, როცა არცერთი მომხმარებელი არ არსებობს */
function install(user, pw) {
  const c = store();
  if (c.users.length) return "ანგარიში უკვე არსებობს";
  const err = checkNew(c, user, pw);
  if (err) return err;
  c.users.push({ id: newId(), user, name: user, email: "", perms: [...PERMS], hash: hashPassword(pw), ver: 1, owner: true, created: Date.now() });
  return save(c) ? "" : "ჩაწერა ვერ მოხერხდა — შეამოწმეთ DATA_DIR-ის უფლებები";
}

/** მიმდინარე მომხმარებელი სესიიდან (წაშლილი/გათიშული/პაროლშეცვლილი → null) */
function currentUser(req) {
  const s = req.session || {};
  if (!s.uid) return null;
  const u = store().users.find((x) => x.id === s.uid);
  if (!u || u.disabled || (u.ver || 1) !== s.ver) return null;
  return publicUser(u);
}

/* მოწვევები და პაროლის აღდგენის ბმულები */
function createInvite({ email = "", name = "", perms = [], by = "" }) {
  const c = store();
  const token = crypto.randomBytes(24).toString("base64url");
  const inv = { id: newId(), hash: tokenHash(token), kind: "invite", email: String(email).trim().slice(0, 120), name: String(name).trim().slice(0, 80), perms: cleanPerms(perms), expires: Date.now() + INVITE_MS, created: Date.now(), by };
  c.invites.push(inv);
  return save(c) ? { token, invite: inv } : null;
}
function createReset(uid, by) {
  const c = store();
  const u = c.users.find((x) => x.id === uid);
  if (!u) return null;
  c.invites = c.invites.filter((x) => !(x.kind === "reset" && x.uid === uid));
  const token = crypto.randomBytes(24).toString("base64url");
  const inv = { id: newId(), hash: tokenHash(token), kind: "reset", uid, email: u.email || "", name: u.name || u.user, perms: [], expires: Date.now() + RESET_MS, created: Date.now(), by };
  c.invites.push(inv);
  return save(c) ? { token, invite: inv } : null;
}
function findToken(token) {
  if (!/^[\w-]{20,64}$/.test(String(token || ""))) return null;
  const h = tokenHash(token);
  const c = store();
  const inv = c.invites.find((x) => x.hash.length === h.length && crypto.timingSafeEqual(Buffer.from(x.hash), Buffer.from(h)));
  if (!inv) return null;
  const u = inv.kind === "reset" ? c.users.find((x) => x.id === inv.uid) : null;
  if (inv.kind === "reset" && !u) return null;
  return { inv, user: u };
}
/** მოწვევის მიღება (ახალი ანგარიში) ან პაროლის აღდგენა */
function redeem(token, { user, name, password }) {
  const found = findToken(token);
  if (!found) return { error: "ბმული არასწორია ან ვადა გაუვიდა" };
  const c = store();
  const { inv } = found;
  if (inv.kind === "reset") {
    const u = c.users.find((x) => x.id === inv.uid);
    if (String(password).length < 10) return { error: "პაროლი — მინიმუმ 10 სიმბოლო" };
    u.hash = hashPassword(password);
    u.ver = (u.ver || 1) + 1;
    c.invites = c.invites.filter((x) => x.id !== inv.id);
    return save(c) ? { ok: true, uid: u.id, ver: u.ver } : { error: "შენახვა ვერ მოხერხდა" };
  }
  const err = checkNew(c, user, password);
  if (err) return { error: err };
  const u = { id: newId(), user, name: String(name || inv.name || user).trim().slice(0, 80), email: inv.email, perms: cleanPerms(inv.perms), hash: hashPassword(password), ver: 1, created: Date.now(), invitedBy: inv.by };
  c.users.push(u);
  c.invites = c.invites.filter((x) => x.id !== inv.id);
  return save(c) ? { ok: true, uid: u.id, ver: 1 } : { error: "შენახვა ვერ მოხერხდა" };
}

/* მომხმარებლების მართვა */
const fullAdmins = (c) => c.users.filter((x) => !x.disabled && (x.owner || cleanPerms(x.perms).includes("users")));
function updateUser(id, patch, actorId) {
  const c = store();
  const u = c.users.find((x) => x.id === id);
  if (!u) return "მომხმარებელი ვერ მოიძებნა";
  if (u.owner && id !== actorId) return "მფლობელის ანგარიშს მხოლოდ თავად მფლობელი ცვლის";
  if ("name" in patch) u.name = String(patch.name || "").trim().slice(0, 80) || u.user;
  if ("email" in patch) u.email = String(patch.email || "").trim().slice(0, 120);
  if (!u.owner) {
    if ("perms" in patch) u.perms = cleanPerms(patch.perms);
    if ("disabled" in patch) {
      if (id === actorId && patch.disabled) return "საკუთარ ანგარიშს ვერ გათიშავთ";
      u.disabled = !!patch.disabled;
      if (u.disabled) u.ver = (u.ver || 1) + 1;
    }
  }
  if (!fullAdmins(c).length) return "უნდა დარჩეს ერთი ადმინისტრატორი მაინც, რომელსაც მომხმარებლების მართვა შეუძლია";
  return save(c) ? "" : "შენახვა ვერ მოხერხდა";
}
function removeUser(id, actorId) {
  const c = store();
  const u = c.users.find((x) => x.id === id);
  if (!u) return "მომხმარებელი ვერ მოიძებნა";
  if (u.owner) return "მფლობელის ანგარიშის წაშლა შეუძლებელია";
  if (id === actorId) return "საკუთარ ანგარიშს ვერ წაშლით";
  c.users = c.users.filter((x) => x.id !== id);
  c.invites = c.invites.filter((x) => x.uid !== id);
  if (!fullAdmins(c).length) return "უნდა დარჩეს ერთი ადმინისტრატორი მაინც";
  return save(c) ? "" : "შენახვა ვერ მოხერხდა";
}
function removeInvite(id) {
  const c = store();
  const n = c.invites.length;
  c.invites = c.invites.filter((x) => x.id !== id);
  return n !== c.invites.length && save(c);
}
function changePassword(id, current, next) {
  const c = store();
  const u = c.users.find((x) => x.id === id);
  if (!u || !verifyPassword(current, u.hash)) return { error: "მიმდინარე პაროლი არასწორია" };
  if (String(next).length < 10) return { error: "ახალი პაროლი მინიმუმ 10 სიმბოლო უნდა იყოს" };
  u.hash = hashPassword(next);
  u.ver = (u.ver || 1) + 1;
  return save(c) ? { ok: true, ver: u.ver } : { error: "შენახვა ვერ მოხერხდა" };
}
function startSession(req, uid, ver) {
  req.session = { uid, ver, csrf: crypto.randomBytes(24).toString("hex") };
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

/** შესვლა მომხმარებლის სახელით ან ელფოსტით */
async function login(req, login, pw) {
  const c = store();
  const key = String(login || "").trim().toLowerCase();
  const u = c.users.find((x) => x.user.toLowerCase() === key || (x.email && x.email.toLowerCase() === key));
  const ok = !!u && !u.disabled && verifyPassword(pw, u.hash);
  if (!u) verifyPassword(pw, "scrypt$00$00"); // დროის თანაბრობა
  const all = attempts();
  if (!ok) {
    all[req.ip] = { tries: ((all[req.ip] || {}).tries || 0) + 1, last: Date.now() };
    write("login-attempts", { ips: all });
    await new Promise((r) => setTimeout(r, 300));
    return false;
  }
  delete all[req.ip];
  write("login-attempts", { ips: all });
  u.last = Date.now();
  save(c);
  startSession(req, u.id, u.ver || 1);
  return true;
}

module.exports = {
  PERMS, sessionMiddleware, csrf, csrfOk, authConfig, isInstalled, install, verifyPassword, lockedFor, login,
  currentUser, publicUser, store, createInvite, createReset, findToken, redeem, updateUser, removeUser, removeInvite, changePassword, startSession,
};
