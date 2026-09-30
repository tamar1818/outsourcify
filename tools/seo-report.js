"use strict";
/**
 * SEO-ს ცხრილის გენერატორი: npm run seo  (→ SEO.md)
 * კითხულობს CMS-ის მონაცემებს — ანგარიში ემთხვევა საიტზე რეალურად გამოტანილს.
 */
const core = require("../src/core");
const C = require("../src/content");

core.ensureData();
const { Ls } = core;
const base = String((C.site().settings || {}).domain || "https://outsourcify.ge").replace(/\/+$/, "");
const kw = (s) => { const [a, b] = String(s || "").split(";"); return [(a || "").trim(), (b || "").trim()]; };

const rows = [];
for (const p of C.pages()) {
  if (p.hidden) continue;
  rows.push({ name: Ls(p.title, "ka") + " / " + Ls(p.title, "en"), ka: C.urlPage(p.id, "ka"), en: C.urlPage(p.id, "en"), t: (p.seo || {}).title || {}, d: (p.seo || {}).description || {}, k: (p.seo || {}).keywords || {} });
}
for (const s of C.services()) {
  rows.push({ name: Ls(s.title, "ka") + " / " + Ls(s.title, "en"), ka: C.urlService(s, "ka"), en: C.urlService(s, "en"), t: s.seo_title || {}, d: s.seo_desc || {}, k: s.keywords || {} });
}

let out = "# Outsourcify — SEO სათაურები, აღწერები და URL-ები\n\n"
  + "გენერირებულია `npm run seo`-ით " + core.ymd(new Date()) + "-ს — წყარო: CMS-ის კონტენტი. ქართული ვერსია მთავარია (`/`), ინგლისური — `/en/`. "
  + "რიცხვი ფრჩხილებში — სიმბოლოების რაოდენობა (რეკომენდაცია: სათაური ≈50–60, აღწერა ≈140–160). საკვანძო სიტყვები შიდა შენიშვნაა — საიტზე meta keywords არ გამოიტანება.\n\n";
rows.forEach((r, i) => {
  const [mk, sk] = kw(r.k.ka);
  const [mke, ske] = kw(r.k.en);
  const c = (s) => `${s || ""} (${String(s || "").length})`;
  out += `## ${i + 1}. ${r.name}\n\n| | ქართული (მთავარი) | English |\n|---|---|---|\n`
    + `| **SEO Title** | ${c(r.t.ka)} | ${c(r.t.en)} |\n`
    + `| **Meta Description** | ${c(r.d.ka)} | ${c(r.d.en)} |\n`
    + `| **URL** | \`${base}${r.ka}\` | \`${base}${r.en}\` |\n`
    + `| **Main keyword** | ${mk || "—"} | ${mke || "—"} |\n`
    + `| **Supporting keywords** | ${sk || "—"} | ${ske || "—"} |\n\n`;
});
process.stdout.write(out);
