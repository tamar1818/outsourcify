"use strict";
/**
 * CMS-ის JSON API — React ადმინ-პანელი (/admin) ამ ენდფოინთებით მუშაობს.
 *
 * ავტორიზაცია: ხელმოწერილი სესიის ქუქი. ყველა ცვლილება (POST/PUT/PATCH/DELETE)
 * მოითხოვს X-CSRF ჰედერს, რომელიც ემთხვევა სესიის ტოკენს.
 */
const express = require("express");
const multer = require("multer");
const core = require("../core");
const { LANGS, Ls, read, write, slug, ymd } = core;
const C = require("../content");
const S = require("../schema");
const BK = require("../booking");
const media = require("../media");
const auth = require("../auth");
const STRINGS = require("../strings");
const { ICONS } = require("../icons");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: media.MAX + 1024, files: 1 } });
const { f } = S;

const BACKUP_FILES = ["site", "pages", "services", "faqs", "testimonials", "team", "clients", "industries", "leads", "bookings"];
const RESERVED = ["en", "ka", "admin", "api", "assets", "uploads", "sitemap-xml", "robots-txt"];
const STATUS = ["new", "contacted", "done", "cancelled"];
const COLLECTIONS = { faqs: "faq", testimonials: "testimonial", team: "member", clients: "client", industries: "industry" };
const rand = () => Math.random().toString(36).slice(2, 7);

router.use(express.json({ limit: "10mb" }));
router.use((req, res, next) => {
  res.set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" });
  next();
});

const bad = (res, error, code = 400) => res.status(code).json({ ok: false, error });

/* ------------------------------------------------------------ სესია */
router.get("/session", (req, res) => {
  res.json({ installed: auth.isInstalled(), user: req.session.uid || null, csrf: auth.csrf(req) });
});

/** CSRF ყველა ცვლილებისთვის */
router.use((req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD") return next();
  if (!auth.csrfOk(req, req.get("X-CSRF"))) return bad(res, "სესია ამოიწურა — განაახლეთ გვერდი", 403);
  next();
});

router.post("/setup", (req, res) => {
  if (auth.isInstalled()) return bad(res, "ანგარიში უკვე არსებობს", 409);
  const u = String(req.body.user || "").trim();
  const pw = String(req.body.password || "");
  if (u.length < 3) return bad(res, "მომხმარებლის სახელი — მინიმუმ 3 სიმბოლო");
  if (pw.length < 10) return bad(res, "პაროლი — მინიმუმ 10 სიმბოლო");
  if (!auth.install(u, pw)) return bad(res, "ჩაწერა ვერ მოხერხდა — შეამოწმეთ DATA_DIR-ის უფლებები", 500);
  res.json({ ok: true });
});

router.post("/login", async (req, res) => {
  const left = auth.lockedFor(req.ip);
  if (left > 0) return bad(res, "ბევრი მცდელობა. სცადეთ " + Math.ceil(left / 60000) + " წუთში", 429);
  if (await auth.login(req, String(req.body.user || "").trim(), String(req.body.password || ""))) {
    return res.json({ ok: true, user: req.session.uid, csrf: req.session.csrf });
  }
  bad(res, "მომხმარებელი ან პაროლი არასწორია", 401);
});

router.post("/logout", (req, res) => {
  req.session = {};
  res.json({ ok: true });
});

/** ყველაფერი ქვემოთ — მხოლოდ შესულ მომხმარებელს */
router.use((req, res, next) => (req.session.uid ? next() : bad(res, "საჭიროა შესვლა", 401)));

/* ------------------------------------------------------------ მეტა */
function settingsDefs() {
  return {
    company: f("text", "კომპანიის სახელი"),
    domain: f("text", "საიტის მისამართი (კანონიკური)", { hint: "მაგ. https://outsourcify.ge — გამოიყენება canonical, sitemap და Open Graph ბმულებში" }),
    phone: f("text", "მობილური ტელეფონი (ზარის ღილაკები)"),
    phone2: f("text", "მთავარი (ქალაქის) ტელეფონი"),
    email: f("text", "საკონტაქტო ელფოსტა"),
    email2: f("text", "დამატებითი ელფოსტა"),
    notify_email: f("text", "შეტყობინებების ელფოსტა", { hint: "სად მოვიდეს ახალი ჯავშნები და განაცხადები. ცარიელზე — საკონტაქტო ელფოსტაზე" }),
    address: f("text", "მისამართი", { i18n: true }),
    city: f("text", "ქალაქი (Schema.org)"),
    hours: f("textarea", "სამუშაო საათები (თითო ხაზზე ერთი)", { i18n: true }),
    map_embed: f("text", "Google Maps embed ბმული", { hint: "Google Maps → Share → Embed a map → src მისამართი, ან https://www.google.com/maps?q=მისამართი&output=embed" }),
    facebook: f("text", "Facebook"),
    linkedin: f("text", "LinkedIn"),
    instagram: f("text", "Instagram"),
    youtube: f("text", "YouTube"),
    tiktok: f("text", "TikTok"),
    footer_text: f("textarea", "ფუტერის ტექსტი", { i18n: true }),
    ga_id: f("text", "Google Analytics 4 ID", { hint: "მაგ. G-XXXXXXX — ცარიელზე ანალიტიკა გამორთულია" }),
    gsc_verification: f("text", "Google Search Console ვერიფიკაციის კოდი"),
    noindex_all: f("check", "საიტის დამალვა საძიებოებისგან (მხოლოდ ტესტირებისას!)"),
  };
}

function pageMetaDefs() {
  return {
    title: f("text", "გვერდის სახელი (მენიუსა და ბილიკში)", { i18n: true }),
    slug: f("text", "URL (slug)", { i18n: true, hint: "მხოლოდ ლათინური; ქართულიდან ავტომატურად ტრანსლიტერირდება. შეცვლისას ძველი ბმულები აღარ იმუშავებს!" }),
    seo_title: f("text", "SEO სათაური (<title>)", { i18n: true, counter: 60, hint: "რეკომენდებულია 50–60 სიმბოლო" }),
    seo_desc: f("textarea", "Meta აღწერა", { i18n: true, counter: 160, hint: "რეკომენდებულია 140–160 სიმბოლო" }),
    keywords: f("text", "საკვანძო სიტყვები (შიდა შენიშვნა, საიტზე არ ჩანს)", { i18n: true }),
    og_image: f("image", "სოციალური გაზიარების სურათი (1200×630)"),
    noindex: f("check", "საძიებოებისგან დამალვა (noindex)"),
    hidden: f("check", "გვერდის გამორთვა (404)"),
  };
}

function linkOptions() {
  return [
    { group: "გვერდები", items: C.pages().map((p) => ({ value: "page:" + p.id, label: Ls(p.title || p.id, "ka") })) },
    { group: "სერვისები", items: C.services(true).map((s) => ({ value: "service:" + s.id, label: Ls(s.title || s.id, "ka") })) },
    { group: "განყოფილებები", items: [{ value: "page:contact#contact-form", label: "კონტაქტი → ფორმა" }, { value: "page:book#booking", label: "დაჯავშნა → ჩატი" }] },
  ];
}

router.get("/meta", (req, res) => {
  const menu = S.recordDefs().menu;
  const { mega, ...plainMenu } = menu;
  res.json({
    langs: LANGS, blockDefs: S.blockDefs(), recordDefs: { ...S.recordDefs(), menuPlain: plainMenu }, settingsDefs: settingsDefs(),
    pageMetaDefs: pageMetaDefs(), icons: ICONS, strings: STRINGS, linkOptions: linkOptions(),
    weekdays: BK.weekdays("ka", true), user: req.session.uid, hasSharp: media.hasSharp,
  });
});

/* ------------------------------------------------------------ დაფა */
function seoIssues() {
  const out = [];
  const lenClass = (s, min, max) => { const n = String(s || "").length; return n === 0 ? "bad" : n < min || n > max + 8 ? "warn" : "ok"; };
  const check = (kind, id, name, tt, dd) => {
    for (const l of LANGS) {
      const t = String((tt || {})[l] || "");
      const d = String((dd || {})[l] || "");
      const ct = lenClass(t, 30, 60);
      const cd = lenClass(d, 120, 160);
      if (ct !== "ok" || cd !== "ok") out.push({ kind, id, name, lang: l, title: t.length, desc: d.length, ct, cd });
    }
  };
  for (const p of C.pages()) check("page", p.id, Ls(p.title, "ka"), (p.seo || {}).title, (p.seo || {}).description);
  for (const s of C.services(true)) check("service", s.id, Ls(s.title, "ka"), s.seo_title, s.seo_desc);
  return out;
}

router.get("/dashboard", (req, res) => {
  const leads = read("leads", { leads: [] }).leads || [];
  const bookings = BK.bookings();
  const today = ymd(new Date());
  const upcoming = bookings.filter((b) => b.status !== "cancelled" && (b.flexible || (b.date || "") >= today))
    .sort((a, b) => ((a.date || "9") + (a.time || "")).localeCompare((b.date || "9") + (b.time || "")))
    .map((b) => ({ ...b, label: b.flexible ? "დრო შესათანხმებელია" : BK.label(b.date, b.time) }));
  res.json({
    newCount: leads.filter((x) => (x.status || "new") === "new").length + bookings.filter((x) => (x.status || "new") === "new").length,
    upcoming: upcoming.slice(0, 8), upcomingCount: upcoming.length,
    pages: C.pages().length, services: C.services(true).length, leads: leads.length, bookings: bookings.length,
    seo: seoIssues(),
  });
});

/* ------------------------------------------------------------ გვერდები */
const pageUrls = (p) => ({ ka: C.urlPage(p.id, "ka"), en: C.urlPage(p.id, "en") });

router.get("/pages", (req, res) => {
  res.json(C.pages().map((p) => ({
    id: p.id, title: p.title, template: p.template, system: !!p.system, hidden: !!p.hidden, noindex: !!p.noindex,
    blocks: (p.blocks || []).length, seo: p.seo || {}, urls: pageUrls(p),
  })));
});

router.get("/pages/:id", (req, res) => {
  const p = C.pageById(req.params.id);
  if (!p) return bad(res, "გვერდი ვერ მოიძებნა", 404);
  const seo = p.seo || {};
  res.json({
    id: p.id, template: p.template, system: !!p.system, urls: pageUrls(p),
    meta: { title: p.title, slug: p.slug, seo_title: seo.title, seo_desc: seo.description, keywords: seo.keywords, og_image: p.og_image || "", hidden: !!p.hidden, noindex: !!p.noindex },
    blocks: p.blocks || [],
  });
});

function savePage(id, data) {
  const all = read("pages", { pages: [] });
  const list = [...(all.pages || [])];
  const idx = id ? list.findIndex((pg) => pg.id === id) : -1;
  if (id && idx < 0) return { error: "გვერდი ვერ მოიძებნა" };
  const isNew = idx < 0;
  const isHome = !isNew && list[idx].template === "home";
  const m = S.clean({
    title: f("text", "", { i18n: true }), slug: f("text", "", { i18n: true }), seo_title: f("text", "", { i18n: true }),
    seo_desc: f("textarea", "", { i18n: true }), keywords: f("text", "", { i18n: true }), og_image: f("image", ""),
    hidden: f("check", ""), noindex: f("check", ""),
  }, data.meta || {});
  if (!String(m.title.ka).trim()) return { error: "გვერდის სათაური (ქართულად) სავალდებულოა" };
  const sl = {};
  for (const l of LANGS) {
    let s = slug(m.slug[l] || m.title[l] || m.title.ka);
    if (isHome) s = "";
    else if (!s || RESERVED.includes(s)) s = "page-" + rand();
    while (s && list.some((pg, i) => i !== idx && (pg.slug || {})[l] === s)) s += "-2";
    sl[l] = s;
  }
  const page = {
    id: isNew ? slug(m.title.en) || sl.en : id,
    template: isNew ? "page" : list[idx].template || "page",
    system: !isNew && !!list[idx].system,
    slug: sl, title: m.title,
    seo: { title: m.seo_title, description: m.seo_desc, keywords: m.keywords },
    og_image: m.og_image, hidden: m.hidden && !isHome, noindex: m.noindex,
    blocks: S.cleanBlocks(Array.isArray(data.blocks) ? data.blocks : []),
  };
  if (isNew) {
    if (list.some((pg) => pg.id === page.id)) page.id += "-" + rand();
    list.push(page);
  } else list[idx] = page;
  return write("pages", { ...all, pages: list }) ? { page } : { error: "შენახვა ვერ მოხერხდა" };
}

router.post("/pages", (req, res) => {
  const r = savePage("", req.body || {});
  r.error ? bad(res, r.error) : res.json({ ok: true, id: r.page.id });
});
router.put("/pages/:id", (req, res) => {
  const r = savePage(req.params.id, req.body || {});
  r.error ? bad(res, r.error) : res.json({ ok: true, id: r.page.id, urls: pageUrls(r.page) });
});
router.delete("/pages/:id", (req, res) => {
  const all = read("pages", { pages: [] });
  const p = (all.pages || []).find((x) => x.id === req.params.id);
  if (!p) return bad(res, "გვერდი ვერ მოიძებნა", 404);
  if (p.system) return bad(res, "სისტემური გვერდის წაშლა შეუძლებელია");
  write("pages", { ...all, pages: all.pages.filter((x) => x.id !== p.id) }) ? res.json({ ok: true }) : bad(res, "წაშლა ვერ მოხერხდა", 500);
});

/* ------------------------------------------------------------ სერვისები */
const svcUrls = (s) => ({ ka: C.urlService(s, "ka"), en: C.urlService(s, "en") });

router.get("/services", (req, res) => res.json(C.services(true).map((s) => ({ ...s, urls: svcUrls(s) }))));
router.get("/services/:id", (req, res) => {
  const s = C.serviceById(req.params.id);
  s ? res.json({ ...s, urls: svcUrls(s) }) : bad(res, "სერვისი ვერ მოიძებნა", 404);
});

function saveService(id, data) {
  const all = read("services", { services: [] });
  const list = [...(all.services || [])];
  const idx = id ? list.findIndex((s) => s.id === id) : -1;
  if (id && idx < 0) return { error: "სერვისი ვერ მოიძებნა" };
  const item = S.clean(S.recordDefs().service, data);
  if (!String(item.title.ka).trim()) return { error: "სერვისის სახელი (ქართულად) სავალდებულოა" };
  for (const l of LANGS) {
    let s = slug(item.slug[l] || item.title[l] || item.title.ka) || "service-" + rand();
    while (list.some((o, i) => i !== idx && (o.slug || {})[l] === s)) s += "-2";
    item.slug[l] = s;
  }
  let newId = id;
  if (idx < 0) {
    newId = slug(item.title.en) || item.slug.en;
    if (list.some((o) => o.id === newId)) newId += "-" + rand();
    list.push({ id: newId, ...item });
  } else list[idx] = { id, ...item };
  return write("services", { ...all, services: list }) ? { id: newId } : { error: "შენახვა ვერ მოხერხდა" };
}

router.post("/services", (req, res) => {
  const r = saveService("", req.body || {});
  r.error ? bad(res, r.error) : res.json({ ok: true, id: r.id });
});
router.put("/services/:id", (req, res) => {
  const r = saveService(req.params.id, req.body || {});
  r.error ? bad(res, r.error) : res.json({ ok: true, id: r.id, urls: svcUrls(C.serviceById(r.id)) });
});
router.delete("/services/:id", (req, res) => {
  const all = read("services", { services: [] });
  write("services", { ...all, services: (all.services || []).filter((s) => s.id !== req.params.id) }) ? res.json({ ok: true }) : bad(res, "წაშლა ვერ მოხერხდა", 500);
});
/** რიგი და ხილვადობა: {order: [id…], hidden: {id: bool}} */
router.post("/services-order", (req, res) => {
  const all = read("services", { services: [] });
  const list = all.services || [];
  const order = Array.isArray(req.body.order) ? req.body.order : list.map((s) => s.id);
  const hidden = req.body.hidden || {};
  const sorted = [...list].sort((a, b) => {
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib);
  }).map((s) => (s.id in hidden ? { ...s, hidden: !!hidden[s.id] } : s));
  write("services", { ...all, services: sorted }) ? res.json({ ok: true }) : bad(res, "შენახვა ვერ მოხერხდა", 500);
});

/* ------------------------------------------------------------ კოლექციები */
router.get("/collections/:name", (req, res) => {
  if (!COLLECTIONS[req.params.name]) return bad(res, "უცნობი კოლექცია", 404);
  res.json(read(req.params.name, { items: [] }).items || []);
});
router.put("/collections/:name", (req, res) => {
  const def = COLLECTIONS[req.params.name];
  if (!def) return bad(res, "უცნობი კოლექცია", 404);
  const clean = S.clean({ items: f("repeater", "", { fields: S.recordDefs()[def] }) }, { items: req.body.items || [] });
  write(req.params.name, { items: clean.items }) ? res.json({ ok: true }) : bad(res, "შენახვა ვერ მოხერხდა", 500);
});

/* ------------------------------------------------------------ მენიუ */
router.get("/menus", (req, res) => res.json(C.site().menus || {}));
router.put("/menus", (req, res) => {
  const menu = S.recordDefs().menu;
  const { mega, ...plain } = menu;
  const clean = S.clean({
    header: f("repeater", "", { fields: menu }),
    footer_company_title: f("text", "", { i18n: true }), footer_company: f("repeater", "", { fields: plain }),
    footer_legal_title: f("text", "", { i18n: true }), footer_legal: f("repeater", "", { fields: plain }),
  }, req.body || {});
  write("site", { ...read("site"), menus: clean }) ? res.json({ ok: true }) : bad(res, "შენახვა ვერ მოხერხდა", 500);
});

/* ------------------------------------------------------------ პარამეტრები */
router.get("/settings", (req, res) => {
  const s = C.site();
  res.json({ settings: s.settings || {}, seo: s.seo || {}, process: s.process || [], cta: s.cta || {}, booking: BK.config(), ui: s.ui || {} });
});
router.put("/settings", (req, res) => {
  const d = req.body || {};
  const site = { ...read("site") };
  site.settings = S.clean(settingsDefs(), d.settings || {});
  site.settings.domain = String(site.settings.domain).replace(/\/+$/, "");
  site.seo = S.clean({ org_description: f("textarea", "", { i18n: true }) }, d.seo || {});
  site.process = S.clean({ items: f("repeater", "", { fields: S.recordDefs().step }) }, { items: d.process || [] }).items;
  site.cta = S.clean(S.blockDefs().cta.fields, d.cta || {});
  const bk = d.booking || {};
  site.booking = {
    days: (Array.isArray(bk.days) ? bk.days : []).map(Number).filter((x) => x >= 1 && x <= 7),
    start: /^([01]\d|2[0-3]):[0-5]\d$/.test(bk.start) ? bk.start : "10:00",
    end: /^([01]\d|2[0-3]):[0-5]\d$/.test(bk.end) ? bk.end : "18:00",
    slot: parseInt(bk.slot, 10) || 30, notice: parseInt(bk.notice, 10) || 0, ahead: parseInt(bk.ahead, 10) || 21,
    blocked: (Array.isArray(bk.blocked) ? bk.blocked : String(bk.blocked || "").split(/[\s,]+/)).map((x) => String(x).trim()).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)),
  };
  const ui = {};
  for (const [k, v] of Object.entries(d.ui || {})) {
    if (!STRINGS[k] || !v || typeof v !== "object") continue;
    for (const l of LANGS) {
      const tx = core.stripTags(String(v[l] || "")).trim();
      if (tx) (ui[k] = ui[k] || {})[l] = tx.slice(0, 600);
    }
  }
  site.ui = ui;
  write("site", site) ? res.json({ ok: true }) : bad(res, "შენახვა ვერ მოხერხდა", 500);
});

/* ------------------------------------------------------------ მედია */
router.get("/media", (req, res) => res.json(media.list()));
router.post("/media", upload.single("file"), async (req, res) => {
  const r = await media.upload(req.file);
  res.status(r.ok ? 200 : 422).json(r);
});
router.post("/media/import", async (req, res) => {
  const r = await media.importUrl((req.body || {}).url, (req.body || {}).name);
  return r.ok ? res.json(r) : bad(res, r.error);
});
router.delete("/media/:name", (req, res) => (media.remove(req.params.name) ? res.json({ ok: true }) : bad(res, "წაშლა ვერ მოხერხდა")));

/* ------------------------------------------------------------ განაცხადები */
router.get("/inbox", (req, res) => {
  const bookings = BK.bookings().map((b) => ({ ...b, label: b.flexible ? "დრო შესათანხმებელია" : BK.label(b.date || "", b.time || "") }));
  res.json({ leads: [...(read("leads", { leads: [] }).leads || [])].reverse(), bookings: bookings.reverse() });
});
const kindOf = (k) => (k === "leads" ? "leads" : k === "bookings" ? "bookings" : null);
router.patch("/inbox/:kind/:id", (req, res) => {
  const kind = kindOf(req.params.kind);
  if (!kind || !STATUS.includes(req.body.status)) return bad(res, "არასწორი მოთხოვნა");
  const store = read(kind, { [kind]: [] });
  const list = (store[kind] || []).map((x) => (x.id === req.params.id ? { ...x, status: req.body.status } : x));
  write(kind, { ...store, [kind]: list }) ? res.json({ ok: true }) : bad(res, "შენახვა ვერ მოხერხდა", 500);
});
router.delete("/inbox/:kind/:id", (req, res) => {
  const kind = kindOf(req.params.kind);
  if (!kind) return bad(res, "არასწორი მოთხოვნა");
  const store = read(kind, { [kind]: [] });
  write(kind, { ...store, [kind]: (store[kind] || []).filter((x) => x.id !== req.params.id) }) ? res.json({ ok: true }) : bad(res, "წაშლა ვერ მოხერხდა", 500);
});
router.get("/inbox/:kind/export", (req, res) => {
  const kind = kindOf(req.params.kind);
  if (!kind) return bad(res, "არასწორი მოთხოვნა");
  const rows = kind === "leads" ? read("leads", { leads: [] }).leads || [] : BK.bookings();
  const cols = kind === "leads"
    ? ["date", "name", "company", "email", "phone", "service", "message", "lang", "status"]
    : ["created", "date", "time", "flexible", "name", "email", "phone", "service", "support", "business", "message", "lang", "status"];
  const cell = (v) => {
    v = Array.isArray(v) ? v.join("; ") : typeof v === "boolean" ? (v ? "yes" : "") : String(v ?? "");
    if (/^[=+\-@]/.test(v)) v = "'" + v; // ცხრილის ფორმულის ინექციისგან დაცვა
    return '"' + v.replace(/"/g, '""') + '"';
  };
  res.set("Content-Disposition", `attachment; filename="outsourcify-${kind}-${ymd(new Date())}.csv"`);
  res.type("text/csv").send("﻿" + cols.join(",") + "\n" + [...rows].reverse().map((r) => cols.map((c) => cell(r[c])).join(",")).join("\n"));
});

/* ------------------------------------------------------------ სარეზერვო ასლი */
router.get("/backup", (req, res) => {
  const files = {};
  for (const n of BACKUP_FILES) files[n] = read(n, null);
  res.set("Content-Disposition", `attachment; filename="outsourcify-backup-${ymd(new Date())}.json"`);
  res.type("application/json").send(JSON.stringify({ app: "outsourcify", created: new Date().toISOString(), files }, null, 2));
});
router.post("/backup", upload.single("file"), (req, res) => {
  let data;
  try { data = JSON.parse(req.file ? req.file.buffer.toString("utf8") : ""); } catch { data = null; }
  if (!data || data.app !== "outsourcify" || !data.files) return bad(res, "ფაილი არ არის Outsourcify-ის სარეზერვო ასლი");
  let n = 0;
  for (const name of BACKUP_FILES) {
    const v = data.files[name];
    if (v && typeof v === "object" && write(name, v)) n++;
  }
  res.json({ ok: true, restored: n });
});

/* ------------------------------------------------------------ პაროლი */
router.post("/password", (req, res) => {
  const c = auth.authConfig();
  const nw = String(req.body.new || "");
  if (!auth.verifyPassword(String(req.body.current || ""), c.hash)) return bad(res, "მიმდინარე პაროლი არასწორია");
  if (nw.length < 10) return bad(res, "ახალი პაროლი მინიმუმ 10 სიმბოლო უნდა იყოს");
  auth.install(c.user, nw) ? res.json({ ok: true }) : bad(res, "შენახვა ვერ მოხერხდა", 500);
});

router.use((req, res) => bad(res, "ვერ მოიძებნა", 404));

module.exports = router;
