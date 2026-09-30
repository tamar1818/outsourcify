"use strict";
/**
 * ფოტოების ატვირთვა: ტიპი მოწმდება შიგთავსით (magic bytes), არა გაფართოებით.
 * თუ `sharp` დაინსტალირებულია — დიდი ფოტო მცირდება 2000px-მდე და WebP-ად გარდაიქმნება.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { UPLOADS_DIR, UPLOADS_URL, PUBLIC, slug } = require("./core");

let sharp = null;
try { sharp = require("sharp"); } catch { /* არასავალდებულო */ }

const MAX = 8 * 1024 * 1024;

function sniff(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 12 && buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") return "webp";
  const head = buf.slice(0, 1024).toString("utf8").trim();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return "svg";
  return null;
}

/** @returns {Promise<{ok:boolean, file?:string, error?:string}>} */
async function upload(file) {
  if (!file || !file.buffer || !file.buffer.length) return { ok: false, error: "ფაილი არ აირჩიეთ" };
  if (file.buffer.length > MAX) return { ok: false, error: "ფაილი 8 MB-ზე დიდია" };
  const ext = sniff(file.buffer);
  if (!ext) return { ok: false, error: "დაშვებულია მხოლოდ JPG, PNG, WebP და SVG" };
  if (ext === "svg" && /<script|javascript:|\bon\w+\s*=|<foreignObject/i.test(file.buffer.toString("utf8"))) {
    return { ok: false, error: "SVG შეიცავს სკრიპტს — აიკრძალა" };
  }
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  // SEO-მეგობრული სახელი ორიგინალიდან
  const base = (slug(path.parse(file.originalname || "image").name) || "image").slice(0, 60) + "-" + crypto.randomBytes(3).toString("hex");
  if (sharp && ext !== "svg") {
    try {
      const out = base + ".webp";
      await sharp(file.buffer).rotate().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(UPLOADS_DIR, out));
      return { ok: true, file: UPLOADS_URL + "/" + out };
    } catch { /* გადავდივართ ორიგინალის შენახვაზე */ }
  }
  const out = base + "." + ext;
  fs.writeFileSync(path.join(UPLOADS_DIR, out), file.buffer);
  return { ok: true, file: UPLOADS_URL + "/" + out };
}

/* ------------------------------------------------ იმპორტი ბმულიდან (Unsplash / Pexels) */
const IMPORT_HOSTS = /^(images\.unsplash\.com|unsplash\.com|plus\.unsplash\.com|images\.pexels\.com)$/i;

/** Unsplash-ის გვერდის ბმული (unsplash.com/photos/name-ID) → ჩამოტვირთვის ბმული */
function normalizeImportUrl(raw) {
  let u;
  try { u = new URL(String(raw || "").trim()); } catch { return null; }
  if (u.protocol !== "https:" || !IMPORT_HOSTS.test(u.hostname)) return null;
  if (/^unsplash\.com$/i.test(u.hostname)) {
    const m = u.pathname.match(/^\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?photos\/(?:[\w-]*-)?([\w]{11})(?:\/|$)/);
    if (!m) return null;
    return { url: "https://unsplash.com/photos/" + m[1] + "/download?force=true", name: u.pathname.split("/")[2] || m[1] };
  }
  if (/images\.unsplash\.com/i.test(u.hostname)) {
    u.searchParams.set("w", "2000"); u.searchParams.set("q", "80"); u.searchParams.set("fm", "jpg");
    u.searchParams.delete("fit"); u.searchParams.delete("h"); u.searchParams.delete("crop");
  }
  return { url: u.toString(), name: path.basename(u.pathname) || "photo" };
}

/** ფოტოს ჩამოტვირთვა მხოლოდ დაშვებული ჰოსტებიდან (გადამისამართებაც მოწმდება) და upload()-ით შენახვა */
async function importUrl(raw, alt) {
  const n = normalizeImportUrl(raw);
  if (!n) return { ok: false, error: "ჩასვით Unsplash-ის ან Pexels-ის ფოტოს ბმული (https://unsplash.com/photos/… ან https://images.unsplash.com/…)" };
  let url = n.url;
  for (let hop = 0; hop < 5; hop++) {
    let r;
    try {
      r = await fetch(url, { redirect: "manual", headers: { "User-Agent": "Outsourcify-CMS/1.0" }, signal: AbortSignal.timeout(20000) });
    } catch { return { ok: false, error: "ფოტო ვერ ჩამოიტვირთა (კავშირის შეცდომა)" }; }
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
      const next = new URL(r.headers.get("location"), url);
      if (next.protocol !== "https:" || !IMPORT_HOSTS.test(next.hostname)) return { ok: false, error: "ბმული დაუშვებელ მისამართზე გადამისამართდა" };
      url = next.toString();
      continue;
    }
    if (!r.ok) return { ok: false, error: "ფოტო ვერ მოიძებნა (" + r.status + ")" };
    const len = parseInt(r.headers.get("content-length") || "0", 10);
    if (len > MAX) return { ok: false, error: "ფაილი 8 MB-ზე დიდია" };
    const buffer = Buffer.from(await r.arrayBuffer());
    const name = slug(String(alt || "").trim()) || n.name;
    return upload({ buffer, originalname: name });
  }
  return { ok: false, error: "ძალიან ბევრი გადამისამართება" };
}

/** ატვირთული + ბრენდის ფოტოები (ორიგინალები, ზომის ვარიანტების გარეშე) */
function list() {
  const out = [];
  for (const [dir, url, deletable] of [[UPLOADS_DIR, UPLOADS_URL, true], [path.join(PUBLIC, "assets/img/photos"), "/assets/img/photos", false]]) {
    let files = [];
    try { files = fs.readdirSync(dir); } catch { continue; }
    for (const f of files) {
      if (/\.(jpe?g|png|webp|svg)$/i.test(f) && !/-(560|960)\.webp$/.test(f)) {
        out.push({ name: f, url: url + "/" + f, time: fs.statSync(path.join(dir, f)).mtimeMs, deletable });
      }
    }
  }
  return out.sort((a, b) => b.time - a.time);
}

function remove(name) {
  name = path.basename(String(name));
  if (!/^[\w.-]+\.(jpe?g|png|webp|svg)$/i.test(name)) return false;
  try { fs.unlinkSync(path.join(UPLOADS_DIR, name)); return true; } catch { return false; }
}

module.exports = { upload, importUrl, normalizeImportUrl, list, remove, MAX, hasSharp: !!sharp };
