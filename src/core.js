"use strict";
/**
 * Outsourcify — ბირთვი: გზები, ენები, JSON-საცავი, უსაფრთხოების დამხმარეები.
 *
 * მონაცემები:
 *   content/  — საწყისი კონტენტი (git-ში). პირველი გაშვებისას კოპირდება DATA_DIR-ში.
 *   DATA_DIR  — CMS-ის რეალური მონაცემები, ატვირთვები, ჯავშნები (git-ში არ შედის).
 *               ნაგულისხმევად ./data; ჰოსტინგზე სასურველია აპის საქაღალდის გარეთ,
 *               რომ ხელახალმა დეპლოიმ CMS-ში შეტანილი ცვლილებები არ წაშალოს.
 *
 * რენდერი მთლიანად სინქრონულია, ამიტომ „მიმდინარე ენა“ და მოთხოვნის ჰოსტი
 * მოდულის დონეზე უსაფრთხოდ ინახება — ერთი მოთხოვნის რენდერი მეორეს არ ერევა.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const SEED_DIR = path.join(ROOT, "content");
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, "data"));
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const UPLOADS_URL = "/uploads";

const LANGS = ["ka", "en"];
const DEFAULT_LANG = "ka";

/* ------------------------------------------------------ მოთხოვნის კონტექსტი */
const ctx = { lang: DEFAULT_LANG, host: "localhost", https: false };

function setRequest(req) {
  ctx.host = String(req.headers["x-forwarded-host"] || req.headers.host || "localhost").replace(/[^a-z0-9.:-]/gi, "") || "localhost";
  ctx.https = req.secure || req.headers["x-forwarded-proto"] === "https";
}

function lang(set) {
  if (set && LANGS.includes(set)) ctx.lang = set;
  return ctx.lang;
}

/** ორენოვანი მნიშვნელობა {ka, en} → მიმდინარე ენის ტექსტი (ცარიელზე — ქართული) */
function L(v, l) {
  l = l || ctx.lang;
  if (v && typeof v === "object" && !Array.isArray(v) && ("ka" in v || "en" in v)) {
    let x = v[l];
    if (x === undefined || x === null || x === "" || (Array.isArray(x) && !x.length)) {
      x = v[DEFAULT_LANG] !== undefined ? v[DEFAULT_LANG] : v.en !== undefined ? v.en : "";
    }
    return x;
  }
  return v === undefined || v === null ? "" : v;
}
const Ls = (v, l) => String(L(v, l) ?? "");
const La = (v, l) => { const x = L(v, l); return Array.isArray(x) ? x : []; };

/** UI წარწერები (src/strings.js) — ადმინიდან გადაფარვადი */
const STRINGS = require("./strings");
function t(key, l) {
  l = l || ctx.lang;
  const over = (read("site").ui || {})[key];
  if (over && over[l]) return over[l];
  const s = STRINGS[key];
  return s ? (s[l] || s.ka || key) : key;
}

/* ------------------------------------------------------------ JSON საცავი */
const cache = new Map();

/** საწყისი კონტენტის კოპირება DATA_DIR-ში (მხოლოდ იმ ფაილებისა, რაც ჯერ არ არსებობს) */
function ensureData() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  for (const f of fs.readdirSync(SEED_DIR)) {
    if (!f.endsWith(".json")) continue;
    const dst = path.join(DATA_DIR, f);
    if (!fs.existsSync(dst)) fs.copyFileSync(path.join(SEED_DIR, f), dst);
  }
}

function read(name, fallback = {}) {
  const file = path.join(DATA_DIR, path.basename(name) + ".json");
  let st;
  try { st = fs.statSync(file); } catch { return fallback; }
  const c = cache.get(file);
  if (c && c.mtime === st.mtimeMs) return c.data;
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!data || typeof data !== "object") return fallback;
    cache.set(file, { mtime: st.mtimeMs, data });
    return data;
  } catch {
    return fallback;
  }
}

/** ატომური ჩაწერა: დროებითი ფაილი → rename */
function write(name, data) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const file = path.join(DATA_DIR, path.basename(name) + ".json");
    const tmp = file + "." + crypto.randomBytes(4).toString("hex") + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
    cache.set(file, { mtime: fs.statSync(file).mtimeMs, data });
    return true;
  } catch (err) {
    console.error("write failed", name, err);
    return false;
  }
}

/* ------------------------------------------------------------ დამხმარეები */
function e(v) {
  if (v === null || v === undefined || typeof v === "object") return "";
  return String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

/** სათაურებისთვის: დაშვებულია მხოლოდ <em>, <strong>, <b>, <i>, <br> */
function inlineHtml(s) {
  return e(s)
    .replace(/&lt;(\/?)(em|strong|b|i)&gt;/gi, "<$1$2>")
    .replace(/&lt;br\s*\/?&gt;/gi, "<br>");
}

/** strip_tags-ის ანალოგი: დაშვებული ტეგების გარდა ყველა ტეგი იშლება */
function stripTags(html, allowed = []) {
  const ok = new Set(allowed);
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (m, tag) => (ok.has(tag.toLowerCase()) ? m : ""));
}

const RICH_TAGS = ["p", "br", "h2", "h3", "h4", "ul", "ol", "li", "strong", "b", "em", "i", "a", "blockquote", "table", "thead", "tbody", "tr", "th", "td"];

/** მდიდარი ტექსტი: უსაფრთხო ტეგები, ატრიბუტები იშლება (a[href]-ის გარდა) */
function richHtml(html) {
  html = String(html || "").trim();
  if (!html) return "";
  if (!/<(p|h[2-4]|ul|ol|table|blockquote)\b/i.test(html)) {
    html = html.split(/\r?\n\s*\r?\n/).map((p) => "<p>" + p.trim().replace(/\r?\n/g, "<br>") + "</p>").join("");
  }
  html = html.replace(/<(script|style|iframe|object|embed|form|svg|math)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  html = stripTags(html, RICH_TAGS);
  return html.replace(/<(\w+)(\s[^>]*)?>/g, (m, tag, attrs) => {
    tag = tag.toLowerCase();
    if (tag === "a" && attrs) {
      const h = attrs.match(/href\s*=\s*("|')(.*?)\1/i);
      if (h) {
        let href = h[2].replace(/&amp;/g, "&").replace(/&quot;/g, '"');
        if (!/^(https?:|mailto:|tel:|\/|#)/i.test(href)) href = "#";
        const ext = /^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : "";
        return '<a href="' + e(href) + '"' + ext + ">";
      }
    }
    return "<" + tag + ">";
  });
}

const GEO = {
  ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i", კ: "k", ლ: "l", მ: "m", ნ: "n", ო: "o", პ: "p",
  ჟ: "zh", რ: "r", ს: "s", ტ: "t", უ: "u", ფ: "p", ქ: "k", ღ: "gh", ყ: "q", შ: "sh", ჩ: "ch", ც: "ts", ძ: "dz", წ: "ts",
  ჭ: "ch", ხ: "kh", ჯ: "j", ჰ: "h",
};
/** ქართული → ლათინური ტრანსლიტერაცია SEO-მისამართებისთვის */
function slug(v) {
  return String(v || "").trim().toLowerCase().replace(/[ა-ჰ]/g, (c) => GEO[c] || "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** აბსოლუტური საბაზისო მისამართი: პარამეტრებიდან ან მოთხოვნიდან */
function baseUrl() {
  const d = String((read("site").settings || {}).domain || "").trim();
  if (/^https?:\/\//.test(d)) return d.replace(/\/+$/, "");
  return (ctx.https ? "https" : "http") + "://" + ctx.host;
}

/** საჯარო URL → ფაილი დისკზე (assets — public/-ში, uploads — DATA_DIR-ში) */
function publicFile(url) {
  const p = decodeURIComponent(String(url).split("?")[0]);
  if (p.includes("..")) return "";
  if (p.startsWith(UPLOADS_URL + "/")) return path.join(UPLOADS_DIR, p.slice(UPLOADS_URL.length + 1));
  return path.join(PUBLIC, p);
}

const assetCache = new Map();
/** ასეტი ვერსიით (ფაილის შეცვლის დრო) — ქეში ავტომატურად ახლდება */
function asset(p) {
  p = "/" + String(p).replace(/^\/+/, "");
  try {
    const m = fs.statSync(publicFile(p)).mtimeMs;
    return p + "?v=" + crypto.createHash("md5").update(String(m)).digest("hex").slice(0, 8);
  } catch {
    return p;
  }
}

function imgUrl(src) {
  src = String(src || "");
  if (!src || /^(https?:)?\/\//.test(src)) return src;
  return "/" + src.replace(/^\/+/, "");
}

const pad = (n, w = 2) => String(n).padStart(w, "0");
const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const hm = (d) => pad(d.getHours()) + ":" + pad(d.getMinutes());
const nowStamp = () => ymd(new Date()) + " " + hm(new Date());
const phoneHref = (p) => String(p).replace(/[^\d+]/g, "");

module.exports = {
  ROOT, PUBLIC, SEED_DIR, DATA_DIR, UPLOADS_DIR, UPLOADS_URL, LANGS, DEFAULT_LANG,
  setRequest, lang, L, Ls, La, t, ensureData, read, write, e, inlineHtml, stripTags, richHtml, slug,
  baseUrl, publicFile, asset, imgUrl, pad, ymd, hm, nowStamp, phoneHref, assetCache,
};
