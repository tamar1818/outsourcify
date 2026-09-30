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

module.exports = { upload, list, remove, MAX, hasSharp: !!sharp };
