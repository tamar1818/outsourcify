"use strict";
/**
 * Outsourcify CMS — მართვის პანელი (/admin).
 * გვერდები (ბლოკების რედაქტორი), სერვისები, FAQ, შეფასებები, ინდუსტრიები, მენიუ, პარამეტრები,
 * ფოტოები, განაცხადები/ჯავშნები, სარეზერვო ასლი. ყველაფერი ორ ენაზე.
 */
const express = require("express");
const multer = require("multer");
const core = require("../core");
const { e, L, Ls, LANGS, read, write, slug, ymd } = core;
const C = require("../content");
const S = require("../schema");
const BK = require("../booking");
const media = require("../media");
const auth = require("../auth");
const STRINGS = require("../strings");
const { logoSprite, logoFull } = require("../logo");
const { icon } = require("../icons");
const U = require("./ui");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: media.MAX + 1024, files: 1 } });
router.use(express.urlencoded({ extended: false, limit: "10mb" }));
router.use((req, res, next) => {
  res.set({ "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store", "X-Frame-Options": "DENY" });
  next();
});

const { f } = S;
const BACKUP_FILES = ["site", "pages", "services", "faqs", "testimonials", "industries", "leads", "bookings"];
const RESERVED = ["en", "ka", "admin", "api", "assets", "uploads", "sitemap-xml", "robots-txt"];
const STATUS = { new: "ახალი", contacted: "დაკავშირებული", done: "დასრულებული", cancelled: "გაუქმებული" };
const TITLES = { dashboard: "მთავარი", pages: "გვერდები", page: "გვერდის რედაქტირება", services: "სერვისები", service: "სერვისი", faqs: "FAQ",
  testimonials: "შეფასებები", industries: "ვისთან ვმუშაობთ", menus: "მენიუ და ფუტერი", media: "ფოტოები", inbox: "განაცხადები და ჯავშნები",
  settings: "პარამეტრები", account: "ანგარიში", backup: "სარეზერვო ასლი" };
const rand = () => Math.random().toString(36).slice(2, 7);

function settingsDefs() {
  return {
    company: f("text", "კომპანიის სახელი"),
    domain: f("text", "საიტის მისამართი (კანონიკური)", { hint: "მაგ. https://outsourcify.ge — გამოიყენება canonical, sitemap და Open Graph ბმულებში" }),
    phone: f("text", "ტელეფონი"),
    email: f("text", "საკონტაქტო ელფოსტა"),
    notify_email: f("text", "შეტყობინებების ელფოსტა", { hint: "სად მოვიდეს ახალი ჯავშნები და განაცხადები. ცარიელზე — საკონტაქტო ელფოსტაზე" }),
    address: f("text", "მისამართი", { i18n: true }),
    city: f("text", "ქალაქი (Schema.org)"),
    hours: f("text", "სამუშაო საათები", { i18n: true }),
    map_embed: f("text", "Google Maps embed ბმული", { hint: "Google Maps → Share → Embed a map → src მისამართი (https://www.google.com/maps/embed?…)" }),
    facebook: f("text", "Facebook"),
    linkedin: f("text", "LinkedIn"),
    instagram: f("text", "Instagram"),
    footer_text: f("textarea", "ფუტერის ტექსტი", { i18n: true }),
    ga_id: f("text", "Google Analytics 4 ID", { hint: "მაგ. G-XXXXXXX — ცარიელზე ანალიტიკა გამორთულია" }),
    gsc_verification: f("text", "Google Search Console ვერიფიკაციის კოდი"),
    noindex_all: f("check", "საიტის დამალვა საძიებოებისგან (მხოლოდ ტესტირებისას!)"),
  };
}

const payload = (req) => {
  try { const d = JSON.parse(String(req.body.payload || "")); return d && typeof d === "object" ? d : {}; } catch { return {}; }
};
const done = (req, res, msg, to) => { req.session.flashOk = msg; res.redirect(to); };
const fail = (req, res, msg, to) => { req.session.flashErr = msg; res.redirect(to); };

/* ============================================================ გასვლა */
router.get("/logout", (req, res) => { req.session = {}; res.redirect("/admin"); });

/* ============================================================ მთავარი ჰენდლერი */
router.all("/", upload.single("file"), async (req, res) => {
  const p = String(req.query.p || "dashboard").replace(/[^a-z_]/g, "") || "dashboard";
  const post = req.method === "POST";
  const body = req.body || {};
  let msg = req.session.flashOk || "";
  let err = req.session.flashErr || "";
  delete req.session.flashOk;
  delete req.session.flashErr;

  /* ---- პირველი გაშვება */
  if (!auth.isInstalled()) {
    if (post) {
      const u = String(body.user || "").trim();
      const pw = String(body.password || "");
      if (!auth.csrfOk(req, body._csrf)) err = "სესია ამოიწურა — სცადეთ თავიდან";
      else if (u.length < 3) err = "მომხმარებლის სახელი — მინიმუმ 3 სიმბოლო";
      else if (pw.length < 10) err = "პაროლი — მინიმუმ 10 სიმბოლო";
      else if (pw !== String(body.password2 || "")) err = "პაროლები არ ემთხვევა";
      else if (auth.install(u, pw)) return done(req, res, "ანგარიში შეიქმნა — შედით სისტემაში", U.aUrl("login"));
      else err = "ჩაწერა ვერ მოხერხდა — შეამოწმეთ DATA_DIR-ის უფლებები";
    }
    return res.send(U.aHead("ანგარიშის შექმნა") + '<body class="auth"><form class="card auth__card" method="post">' + logoSprite() + logoFull()
      + '<h1>CMS-ის პირველი გაშვება</h1><p class="muted">შექმენით ადმინისტრატორის ანგარიში.</p>' + U.flash("", err) + csrfField(req)
      + '<label class="fld"><span class="fld__label">მომხმარებელი</span><input name="user" required autocomplete="username"></label>'
      + '<label class="fld"><span class="fld__label">პაროლი (მინ. 10 სიმბოლო)</span><input name="password" type="password" required minlength="10" autocomplete="new-password"></label>'
      + '<label class="fld"><span class="fld__label">გაიმეორეთ პაროლი</span><input name="password2" type="password" required autocomplete="new-password"></label>'
      + '<button class="btn btn--block">ანგარიშის შექმნა</button></form></body></html>');
  }

  /* ---- შესვლა */
  if (!req.session.uid) {
    if (post && p === "login") {
      const left = auth.lockedFor(req.ip);
      if (!auth.csrfOk(req, body._csrf)) err = "სესია ამოიწურა — სცადეთ თავიდან";
      else if (left > 0) err = "ბევრი მცდელობა. სცადეთ " + Math.ceil(left / 60000) + " წუთში";
      else if (await auth.login(req, String(body.user || "").trim(), String(body.password || ""))) return res.redirect("/admin");
      else err = "მომხმარებელი ან პაროლი არასწორია";
    }
    return res.send(U.aHead("შესვლა") + '<body class="auth"><form class="card auth__card" method="post" action="' + U.aUrl("login") + '">' + logoSprite() + logoFull()
      + "<h1>მართვის პანელი</h1>" + U.flash(msg, err) + csrfField(req)
      + '<label class="fld"><span class="fld__label">მომხმარებელი</span><input name="user" required autocomplete="username" autofocus></label>'
      + '<label class="fld"><span class="fld__label">პაროლი</span><input name="password" type="password" required autocomplete="current-password"></label>'
      + '<button class="btn btn--block">შესვლა</button></form></body></html>');
  }

  /* ============================================================ მოქმედებები */
  if (post) {
    const ajax = body.ajax === "1";
    if (!auth.csrfOk(req, body._csrf)) {
      return ajax ? res.status(403).json({ ok: false, error: "CSRF — განაახლეთ გვერდი" }) : fail(req, res, "უსაფრთხოების შემოწმება ვერ გაიარა — განაახლეთ გვერდი", U.aUrl(p));
    }
    return handleAction(req, res, p, String(body.action || ""), ajax);
  }

  /* ============================================================ ხედები */
  const leads = read("leads", { leads: [] }).leads || [];
  const bookings = BK.bookings();
  const newCount = leads.filter((x) => (x.status || "new") === "new").length + bookings.filter((x) => (x.status || "new") === "new").length;

  if (p === "export") return exportCsv(req, res, leads, bookings);
  if (p === "media_json") return res.json({ ok: true, items: media.list() });
  if (p === "backup" && req.query.download) {
    const files = {};
    for (const n of BACKUP_FILES) files[n] = read(n, null);
    res.set("Content-Disposition", `attachment; filename="outsourcify-backup-${ymd(new Date())}.json"`);
    return res.type("application/json").send(JSON.stringify({ app: "outsourcify", created: new Date().toISOString(), files }, null, 2));
  }

  const view = TITLES[p] ? p : "dashboard";
  let h = U.aHead(TITLES[view]) + '<body data-csrf="' + e(auth.csrf(req)) + '"><div class="shell">' + U.aNav(view, { inbox: newCount }) + '<main class="main">' + U.flash(msg, err);
  h += (VIEWS[view] || VIEWS.dashboard)(req, { leads, bookings, newCount });
  h += '</main></div><dialog class="media-modal" id="media-modal"><div class="media-modal__head"><h2>ფოტოს არჩევა</h2><button type="button" class="link" data-close>დახურვა ✕</button></div><div class="media-modal__grid"></div></dialog>' + U.aFoot();
  res.send(h);
});

const csrfField = (req) => '<input type="hidden" name="_csrf" value="' + e(auth.csrf(req)) + '">';

/* ============================================================ მოქმედებები */
async function handleAction(req, res, p, action, ajax) {
  const body = req.body;

  if (action === "upload") {
    const r = await media.upload(req.file);
    if (ajax) return res.status(r.ok ? 200 : 422).json(r);
    return r.ok ? done(req, res, "ფოტო აიტვირთა", U.aUrl("media")) : fail(req, res, r.error || "შეცდომა", U.aUrl("media"));
  }
  if (action === "media_delete") {
    return media.remove(body.name) ? done(req, res, "ფოტო წაიშალა", U.aUrl("media")) : fail(req, res, "წაშლა ვერ მოხერხდა", U.aUrl("media"));
  }

  /* ---- გვერდი */
  if (action === "save_page") {
    const data = payload(req);
    const all = read("pages", { pages: [] });
    const list = [...(all.pages || [])];
    const id = String(body.id || "");
    const idx = list.findIndex((pg) => pg.id === id);
    const isNew = idx < 0;
    const isHome = !isNew && list[idx].template === "home";
    const clean = S.clean({
      title: f("text", "", { i18n: true }), slug: f("text", "", { i18n: true }), seo_title: f("text", "", { i18n: true }),
      seo_desc: f("textarea", "", { i18n: true }), keywords: f("text", "", { i18n: true }), og_image: f("image", ""),
      hidden: f("check", ""), noindex: f("check", ""),
    }, data.meta || {});
    if (!String(clean.title.ka).trim()) return fail(req, res, "გვერდის სათაური (ქართულად) სავალდებულოა", isNew ? U.aUrl("page", { new: 1 }) : U.aUrl("page", { id }));
    const sl = {};
    for (const l of LANGS) {
      let s = slug(clean.slug[l] || clean.title[l] || clean.title.ka);
      if (isHome) s = "";
      else if (!s || RESERVED.includes(s)) s = "page-" + rand();
      while (s && list.some((pg, i) => i !== idx && (pg.slug || {})[l] === s)) s += "-2";
      sl[l] = s;
    }
    const blocks = (Array.isArray(data.blocks) ? data.blocks : []).filter((b) => b && typeof b === "object").map((b) => ({ ...b, hidden: !b.visible }));
    const page = {
      id: isNew ? slug(clean.title.en) || sl.en : id,
      template: isNew ? "page" : list[idx].template || "page",
      system: !isNew && !!list[idx].system,
      slug: sl, title: clean.title,
      seo: { title: clean.seo_title, description: clean.seo_desc, keywords: clean.keywords },
      og_image: clean.og_image, hidden: clean.hidden && !isHome, noindex: clean.noindex,
      blocks: S.cleanBlocks(blocks),
    };
    if (isNew) {
      if (list.some((pg) => pg.id === page.id)) page.id += "-" + rand();
      list.push(page);
    } else list[idx] = page;
    return write("pages", { ...all, pages: list }) ? done(req, res, "გვერდი შენახულია", U.aUrl("page", { id: page.id })) : fail(req, res, "შენახვა ვერ მოხერხდა", U.aUrl("pages"));
  }
  if (action === "delete_page") {
    const all = read("pages", { pages: [] });
    const id = String(body.id || "");
    return write("pages", { ...all, pages: (all.pages || []).filter((pg) => pg.id !== id || pg.system) })
      ? done(req, res, "გვერდი წაიშალა", U.aUrl("pages")) : fail(req, res, "წაშლა ვერ მოხერხდა", U.aUrl("pages"));
  }

  /* ---- სერვისი */
  if (action === "save_service") {
    const all = read("services", { services: [] });
    const list = [...(all.services || [])];
    const id = String(body.id || "");
    const item = S.clean(S.recordDefs().service, payload(req));
    if (!String(item.title.ka).trim()) return fail(req, res, "სერვისის სახელი (ქართულად) სავალდებულოა", id ? U.aUrl("service", { id }) : U.aUrl("service", { new: 1 }));
    const idx = list.findIndex((s) => s.id === id);
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
    return write("services", { ...all, services: list }) ? done(req, res, "სერვისი შენახულია", U.aUrl("service", { id: newId })) : fail(req, res, "შენახვა ვერ მოხერხდა", U.aUrl("services"));
  }
  if (["delete_service", "move_service", "toggle_service"].includes(action)) {
    const all = read("services", { services: [] });
    let list = [...(all.services || [])];
    const i = list.findIndex((s) => s.id === String(body.id || ""));
    if (i >= 0) {
      if (action === "delete_service") list.splice(i, 1);
      else if (action === "toggle_service") list[i] = { ...list[i], hidden: !list[i].hidden };
      else {
        const j = i + (body.dir === "up" ? -1 : 1);
        if (list[j]) [list[i], list[j]] = [list[j], list[i]];
      }
    }
    return write("services", { ...all, services: list }) ? done(req, res, "ცვლილება შენახულია", U.aUrl("services")) : fail(req, res, "შენახვა ვერ მოხერხდა", U.aUrl("services"));
  }

  /* ---- კოლექციები */
  const collections = { save_faqs: ["faqs", "faq"], save_testimonials: ["testimonials", "testimonial"], save_industries: ["industries", "industry"] };
  if (collections[action]) {
    const [file, def] = collections[action];
    const clean = S.clean({ items: f("repeater", "", { fields: S.recordDefs()[def] }) }, payload(req));
    return write(file, { items: clean.items }) ? done(req, res, "შენახულია", U.aUrl(file)) : fail(req, res, "შენახვა ვერ მოხერხდა", U.aUrl(file));
  }

  /* ---- მენიუ */
  if (action === "save_menus") {
    const menu = S.recordDefs().menu;
    const { mega, ...plain } = menu;
    const clean = S.clean({
      header: f("repeater", "", { fields: menu }),
      footer_company_title: f("text", "", { i18n: true }), footer_company: f("repeater", "", { fields: plain }),
      footer_legal_title: f("text", "", { i18n: true }), footer_legal: f("repeater", "", { fields: plain }),
    }, payload(req));
    return write("site", { ...read("site"), menus: clean }) ? done(req, res, "მენიუ შენახულია", U.aUrl("menus")) : fail(req, res, "შენახვა ვერ მოხერხდა", U.aUrl("menus"));
  }

  /* ---- პარამეტრები */
  if (action === "save_settings") {
    const d = payload(req);
    const site = { ...read("site") };
    site.settings = S.clean(settingsDefs(), d.settings || {});
    site.settings.domain = String(site.settings.domain).replace(/\/+$/, "");
    site.seo = S.clean({ org_description: f("textarea", "", { i18n: true }) }, d.seo || {});
    site.process = S.clean({ items: f("repeater", "", { fields: S.recordDefs().step }) }, { items: d.process || [] }).items;
    site.cta = S.clean(S.blockDefs().cta.fields, d.cta || {});
    const bk = d.booking || {};
    site.booking = {
      days: (Array.isArray(bk.days) ? bk.days : []).map(Number).filter((x) => x >= 1 && x <= 7),
      start: String(bk.start || "10:00"), end: String(bk.end || "18:00"),
      slot: parseInt(bk.slot, 10) || 30, notice: parseInt(bk.notice, 10) || 0, ahead: parseInt(bk.ahead, 10) || 21,
      blocked: String(bk.blocked || "").split(/[\s,]+/).map((x) => x.trim()).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)),
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
    return write("site", site) ? done(req, res, "პარამეტრები შენახულია", U.aUrl("settings", { tab: String(body.tab || "") })) : fail(req, res, "შენახვა ვერ მოხერხდა", U.aUrl("settings"));
  }

  /* ---- განაცხადები და ჯავშნები */
  if (["entry_status", "entry_delete"].includes(action)) {
    const kind = body.kind === "leads" ? "leads" : "bookings";
    const store = read(kind, { [kind]: [] });
    let list = [...(store[kind] || [])];
    const id = String(body.id || "");
    if (action === "entry_delete") list = list.filter((x) => x.id !== id);
    else list = list.map((x) => (x.id === id ? { ...x, status: STATUS[body.status] ? body.status : "new" } : x));
    return write(kind, { ...store, [kind]: list }) ? done(req, res, "შენახულია", U.aUrl("inbox", { tab: kind })) : fail(req, res, "შენახვა ვერ მოხერხდა", U.aUrl("inbox"));
  }

  /* ---- სარეზერვო ასლის აღდგენა */
  if (action === "restore") {
    let data;
    try { data = JSON.parse(req.file ? req.file.buffer.toString("utf8") : ""); } catch { data = null; }
    if (!data || data.app !== "outsourcify" || !data.files) return fail(req, res, "ფაილი არ არის Outsourcify-ის სარეზერვო ასლი", U.aUrl("backup"));
    let n = 0;
    for (const name of BACKUP_FILES) {
      const v = data.files[name];
      if (v && typeof v === "object" && write(name, v)) n++;
    }
    return done(req, res, `აღდგენილია ${n} ფაილი`, U.aUrl("backup"));
  }

  /* ---- პაროლი */
  if (action === "password") {
    const c = auth.authConfig();
    const nw = String(body.new || "");
    if (!auth.verifyPassword(String(body.current || ""), c.hash)) return fail(req, res, "მიმდინარე პაროლი არასწორია", U.aUrl("account"));
    if (nw.length < 10 || nw !== String(body.new2 || "")) return fail(req, res, "ახალი პაროლი მინ. 10 სიმბოლო უნდა იყოს და ორივე ველში ერთნაირი", U.aUrl("account"));
    return auth.install(c.user, nw) ? done(req, res, "პაროლი შეიცვალა", U.aUrl("account")) : fail(req, res, "შენახვა ვერ მოხერხდა", U.aUrl("account"));
  }
  return fail(req, res, "უცნობი მოქმედება", U.aUrl("dashboard"));
}

function exportCsv(req, res, leads, bookings) {
  const kind = req.query.kind === "leads" ? "leads" : "bookings";
  const rows = kind === "leads" ? leads : bookings;
  const cols = kind === "leads"
    ? ["date", "name", "company", "email", "phone", "service", "message", "lang", "status"]
    : ["created", "date", "time", "flexible", "name", "email", "phone", "service", "support", "business", "message", "lang", "status"];
  const cell = (v) => {
    v = Array.isArray(v) ? v.join("; ") : typeof v === "boolean" ? (v ? "yes" : "") : String(v ?? "");
    if (/^[=+\-@]/.test(v)) v = "'" + v; // ცხრილის ფორმულის ინექციისგან დაცვა
    return '"' + v.replace(/"/g, '""') + '"';
  };
  const csv = "﻿" + cols.join(",") + "\n" + [...rows].reverse().map((r) => cols.map((c) => cell(r[c])).join(",")).join("\n");
  res.set("Content-Disposition", `attachment; filename="outsourcify-${kind}-${ymd(new Date())}.csv"`);
  res.type("text/csv").send(csv);
}

/* ============================================================ ხედები */
const hidden = (name, value) => '<input type="hidden" name="' + e(name) + '" value="' + e(value) + '">';
const editorStart = (req, action, extra = "") => '<form method="post" class="editor" data-editor>' + csrfField(req) + hidden("action", action) + extra + '<input type="hidden" name="payload">';

const VIEWS = {
  dashboard(req, { bookings, newCount }) {
    const today = ymd(new Date());
    const upcoming = bookings.filter((b) => b.status !== "cancelled" && (b.flexible || (b.date || "") >= today))
      .sort((a, b) => ((a.date || "9") + (a.time || "")).localeCompare((b.date || "9") + (b.time || "")));
    let h = "<h1>გამარჯობა, " + e(req.session.uid) + ' 👋</h1><div class="tiles">'
      + '<a class="tile" href="' + U.aUrl("inbox") + '"><b>' + newCount + "</b><span>ახალი განაცხადი / ჯავშანი</span></a>"
      + '<a class="tile" href="' + U.aUrl("inbox", { tab: "bookings" }) + '"><b>' + upcoming.length + "</b><span>მომავალი კონსულტაცია</span></a>"
      + '<a class="tile" href="' + U.aUrl("pages") + '"><b>' + C.pages().length + "</b><span>გვერდი</span></a>"
      + '<a class="tile" href="' + U.aUrl("services") + '"><b>' + C.services(true).length + "</b><span>სერვისი</span></a></div>";
    h += '<div class="grid2"><section class="card"><div class="head"><h2>მომავალი კონსულტაციები</h2><a class="link" href="' + U.aUrl("inbox", { tab: "bookings" }) + '">ყველა →</a></div>';
    if (!upcoming.length) h += '<p class="muted">ჯერ არცერთი ჯავშანი არ არის.</p>';
    for (const b of upcoming.slice(0, 6)) {
      h += '<div class="row-item"><b>' + e(b.flexible ? "დრო შესათანხმებელია" : BK.label(b.date, b.time)) + "</b><span>" + e(b.name) + " · " + e(b.service || "") + "</span></div>";
    }
    h += '</section><section class="card"><div class="head"><h2>SEO შემოწმება</h2></div><p class="muted small">სათაური: 30–60 სიმბოლო, აღწერა: 120–160 სიმბოლო (ორივე ენაზე).</p><ul class="seo-check">';
    let issues = 0;
    const check = (name, url, tt, dd) => {
      for (const l of LANGS) {
        const a = String((tt || {})[l] || "");
        const d = String((dd || {})[l] || "");
        const ct = U.seoLenClass(a, 30, 60);
        const cd = U.seoLenClass(d, 120, 160);
        if (ct !== "ok" || cd !== "ok") {
          issues++;
          h += '<li><a href="' + e(url) + '">' + e(name) + '</a> <span class="flag flag--' + l + '">' + U.LANG_LABEL[l] + "</span>"
            + ' <span class="pill pill--' + ct + '">სათაური ' + a.length + '</span> <span class="pill pill--' + cd + '">აღწერა ' + d.length + "</span></li>";
        }
      }
    };
    for (const pg of C.pages()) check(Ls(pg.title, "ka"), U.aUrl("page", { id: pg.id }), (pg.seo || {}).title, (pg.seo || {}).description);
    for (const s of C.services(true)) check(Ls(s.title, "ka"), U.aUrl("service", { id: s.id }), s.seo_title, s.seo_desc);
    if (!issues) h += '<li class="ok">✓ ყველა გვერდის SEO სათაური და აღწერა რეკომენდებულ ფარგლებშია.</li>';
    h += "</ul></section></div>";
    return h + '<section class="card"><h2>სწრაფი ბმულები</h2><div class="quick">'
      + '<a class="btn btn--ghost" href="' + U.aUrl("page", { id: "home" }) + '">მთავარი გვერდის რედაქტირება</a>'
      + '<a class="btn btn--ghost" href="' + U.aUrl("service", { new: 1 }) + '">+ ახალი სერვისი</a>'
      + '<a class="btn btn--ghost" href="' + U.aUrl("page", { new: 1 }) + '">+ ახალი გვერდი</a>'
      + '<a class="btn btn--ghost" href="' + U.aUrl("settings") + '">კონტაქტები</a>'
      + '<a class="btn btn--ghost" href="/sitemap.xml" target="_blank">sitemap.xml</a></div></section>';
  },

  pages() {
    let h = '<div class="head"><h1>გვერდები</h1><a class="btn" href="' + U.aUrl("page", { new: 1 }) + '">+ ახალი გვერდი</a></div>'
      + '<table class="table"><thead><tr><th>გვერდი</th><th>მისამართი (ქართ / ENG)</th><th>SEO</th><th></th></tr></thead><tbody>';
    for (const pg of C.pages()) {
      const st = Ls((pg.seo || {}).title, "ka");
      const sd = Ls((pg.seo || {}).description, "ka");
      h += '<tr><td><a href="' + U.aUrl("page", { id: pg.id }) + '"><b>' + e(Ls(pg.title, "ka")) + "</b></a>"
        + (pg.hidden ? ' <span class="pill pill--off">დამალული</span>' : "") + (pg.noindex ? ' <span class="pill pill--warn">noindex</span>' : "")
        + '<br><small class="muted">' + (pg.blocks || []).length + " ბლოკი</small></td>"
        + '<td><a href="' + e(C.urlPage(pg.id, "ka")) + '" target="_blank">' + e(C.urlPage(pg.id, "ka")) + '</a><br><a class="muted" href="' + e(C.urlPage(pg.id, "en")) + '" target="_blank">' + e(C.urlPage(pg.id, "en")) + "</a></td>"
        + '<td><span class="pill pill--' + U.seoLenClass(st, 30, 60) + '">T ' + st.length + '</span> <span class="pill pill--' + U.seoLenClass(sd, 120, 160) + '">D ' + sd.length + "</span></td>"
        + '<td class="right"><a class="btn btn--sm btn--ghost" href="' + U.aUrl("page", { id: pg.id }) + '">რედაქტირება</a></td></tr>';
    }
    return h + "</tbody></table>";
  },

  page(req) {
    const isNew = !!req.query.new;
    const defs = S.blockDefs();
    const pg = isNew
      ? { id: "", template: "page", title: { ka: "", en: "" }, slug: { ka: "", en: "" }, blocks: [{ type: "page_hero", title: { ka: "", en: "" } }, { type: "richtext" }, { type: "cta", ...(C.site().cta || {}) }] }
      : C.pageById(String(req.query.id || ""));
    if (!pg) return "<p>გვერდი ვერ მოიძებნა.</p>";
    const isHome = pg.template === "home";
    const seo = pg.seo || {};
    const meta = { title: pg.title, slug: pg.slug, seo_title: seo.title, seo_desc: seo.description, keywords: seo.keywords, og_image: pg.og_image || "", hidden: !!pg.hidden, noindex: !!pg.noindex };
    const metaDefs = {
      title: f("text", "გვერდის სახელი (მენიუსა და ბილიკში)", { i18n: true }),
      slug: f("text", "URL (slug)", { i18n: true, hint: isHome ? "მთავარ გვერდს მისამართი არ აქვს" : "მხოლოდ ლათინური; ქართულიდან ავტომატურად ტრანსლიტერირდება. შეცვლისას ძველი ბმულები აღარ იმუშავებს!" }),
      seo_title: f("text", "SEO სათაური (<title>)", { i18n: true, counter: 60, hint: "რეკომენდებულია 50–60 სიმბოლო" }),
      seo_desc: f("textarea", "Meta აღწერა", { i18n: true, counter: 160, hint: "რეკომენდებულია 140–160 სიმბოლო" }),
      keywords: f("text", "საკვანძო სიტყვები (შიდა შენიშვნა, საიტზე არ ჩანს)", { i18n: true }),
      og_image: f("image", "სოციალური გაზიარების სურათი (1200×630, არასავალდებულო)"),
      noindex: f("check", "საძიებოებისგან დამალვა (noindex)"),
      ...(isHome ? {} : { hidden: f("check", "გვერდის გამორთვა (404)") }),
    };
    let h = editorStart(req, "save_page", hidden("id", pg.id))
      + '<div class="head sticky"><div><a class="link" href="' + U.aUrl("pages") + '">← გვერდები</a><h1>' + e(isNew ? "ახალი გვერდი" : Ls(pg.title, "ka")) + '</h1></div><div class="head__act">';
    if (!isNew) h += '<a class="btn btn--ghost" href="' + e(C.urlPage(pg.id, "ka")) + '" target="_blank">ქართ ↗</a><a class="btn btn--ghost" href="' + e(C.urlPage(pg.id, "en")) + '" target="_blank">ENG ↗</a>';
    h += '<button class="btn">შენახვა</button></div></div>'
      + '<details class="card"' + (isNew ? " open" : "") + '><summary><h2>გვერდის პარამეტრები და SEO</h2></summary><div data-scope data-meta>' + U.fields(metaDefs, meta) + "</div></details>"
      + '<h2 class="sub">ბლოკები <small class="muted">— დააჭირეთ ბლოკს გასაშლელად; ↑↓ რიგის შესაცვლელად</small></h2><div class="blocks" data-blocks>'
      + (pg.blocks || []).map((b) => U.blockEditor(b, defs)).join("")
      + '</div><div class="card add-block"><label class="fld"><span class="fld__label">ახალი ბლოკის დამატება</span><select data-add-type>'
      + Object.entries(defs).map(([k, d]) => '<option value="' + e(k) + '">' + e(d.label + " — " + d.desc) + "</option>").join("")
      + '</select></label><button type="button" class="btn btn--ghost" data-add-block>+ დამატება</button></div>'
      + Object.keys(defs).map((k) => '<template data-tpl="' + e(k) + '">' + U.blockEditor({ type: k }, defs).replace('<div class="blk__body" hidden>', '<div class="blk__body">') + "</template>").join("")
      + "</form>";
    if (!isNew && !pg.system) {
      h += '<form method="post" class="danger-zone" onsubmit="return confirm(\'წავშალოთ გვერდი?\')">' + csrfField(req) + hidden("action", "delete_page") + hidden("id", pg.id) + '<button class="link link--danger">გვერდის წაშლა</button></form>';
    }
    return h;
  },

  services(req) {
    const list = C.services(true);
    const act = (s, a, label, extra = {}, cls = "link") => '<form method="post" class="inline">' + csrfField(req) + hidden("action", a) + hidden("id", s.id)
      + Object.entries(extra).map(([k, v]) => hidden(k, v)).join("")
      + '<button class="' + cls + '"' + (a === "delete_service" ? " onclick=\"return confirm('წავშალოთ სერვისი?')\"" : "") + ">" + label + "</button></form>";
    let h = '<div class="head"><h1>სერვისები</h1><a class="btn" href="' + U.aUrl("service", { new: 1 }) + '">+ ახალი სერვისი</a></div>'
      + '<p class="muted">სერვისები ავტომატურად ჩნდება მენიუში, მთავარ გვერდზე, ფუტერში, ჩატ-დაჯავშნასა და sitemap-ში. თითოეულს აქვს საკუთარი SEO-გვერდი ორ ენაზე.</p>'
      + '<table class="table"><thead><tr><th>#</th><th>სერვისი</th><th>მისამართი</th><th>სტატუსი</th><th></th></tr></thead><tbody>';
    list.forEach((s, i) => {
      h += '<tr><td class="nowrap">' + (i > 0 ? act(s, "move_service", "↑", { dir: "up" }) : "") + (i < list.length - 1 ? act(s, "move_service", "↓", { dir: "down" }) : "") + "</td>"
        + '<td><span class="svc-ico">' + icon(String(s.icon || "briefcase")) + '</span><a href="' + U.aUrl("service", { id: s.id }) + '"><b>' + e(Ls(s.title, "ka")) + '</b></a><br><small class="muted">' + e(Ls(s.title, "en")) + "</small></td>"
        + '<td><a href="' + e(C.urlService(s, "ka")) + '" target="_blank">' + e(C.urlService(s, "ka")) + '</a><br><a class="muted" href="' + e(C.urlService(s, "en")) + '" target="_blank">' + e(C.urlService(s, "en")) + "</a></td>"
        + "<td>" + (s.hidden ? '<span class="pill pill--off">დამალული</span>' : '<span class="pill pill--ok">ჩანს</span>') + "</td>"
        + '<td class="right nowrap"><a class="btn btn--sm btn--ghost" href="' + U.aUrl("service", { id: s.id }) + '">რედაქტირება</a> '
        + act(s, "toggle_service", s.hidden ? "გამოჩენა" : "დამალვა") + " " + act(s, "delete_service", "წაშლა", {}, "link link--danger") + "</td></tr>";
    });
    return h + "</tbody></table>";
  },

  service(req) {
    const isNew = !!req.query.new;
    const s = isNew ? { id: "", icon: "briefcase" } : C.serviceById(String(req.query.id || ""));
    if (!s) return "<p>სერვისი ვერ მოიძებნა.</p>";
    const defs = S.recordDefs().service;
    const groups = { "ძირითადი": ["title", "slug", "hidden", "icon", "image", "image_alt", "short", "intro"], "გვერდის შინაარსი": ["body", "audience", "includes", "benefits"], FAQ: ["faq"], SEO: ["seo_title", "seo_desc", "keywords"] };
    let h = editorStart(req, "save_service", hidden("id", s.id))
      + '<div class="head sticky"><div><a class="link" href="' + U.aUrl("services") + '">← სერვისები</a><h1>' + e(isNew ? "ახალი სერვისი" : Ls(s.title, "ka")) + '</h1></div><div class="head__act">';
    if (!isNew) h += '<a class="btn btn--ghost" href="' + e(C.urlService(s, "ka")) + '" target="_blank">ქართ ↗</a><a class="btn btn--ghost" href="' + e(C.urlService(s, "en")) + '" target="_blank">ENG ↗</a>';
    h += '<button class="btn">შენახვა</button></div></div><div data-scope data-root>';
    for (const [g, keys] of Object.entries(groups)) h += '<section class="card"><h2>' + e(g) + "</h2>" + keys.map((k) => U.field(k, defs[k], s[k])).join("") + "</section>";
    return h + "</div></form>";
  },

  faqs: (req) => collectionView(req, "faqs", "faq", "კითხვები FAQ გვერდზე, მთავარ გვერდსა და სხვა გვერდების FAQ ბლოკებში. კატეგორია განსაზღვრავს, სად გამოჩნდება. Google-ისთვის FAQ schema ავტომატურად იქმნება.", "კითხვის დამატება"),
  testimonials: (req) => collectionView(req, "testimonials", "testimonial", "შეფასებების ბლოკი საიტზე მხოლოდ მაშინ ჩნდება, როცა ერთი შეფასება მაინც არის დამატებული. დაამატეთ მხოლოდ რეალური კლიენტების შეფასებები, მათი თანხმობით.", "შეფასების დამატება"),
  industries: (req) => collectionView(req, "industries", "industry", "კლიენტების ტიპები „ვისთან ვმუშაობთ“ ბლოკისთვის.", "ჩანაწერის დამატება"),

  menus(req) {
    const m = C.site().menus || {};
    const menu = S.recordDefs().menu;
    const { mega, ...plain } = menu;
    return editorStart(req, "save_menus") + '<div class="head sticky"><h1>მენიუ და ფუტერი</h1><button class="btn">შენახვა</button></div><div data-scope data-root>'
      + '<section class="card"><h2>მთავარი მენიუ (ჰედერი)</h2><p class="muted small">„სერვისების ჩამოსაშლელი მენიუ“ ავტომატურად აჩვენებს ყველა სერვისს.</p>' + U.repeater("header", f("repeater", "პუნქტები", { fields: menu, add: "პუნქტის დამატება" }), m.header || []) + "</section>"
      + '<section class="card"><h2>ფუტერი — სვეტი 1</h2>' + U.field("footer_company_title", f("text", "სვეტის სათაური", { i18n: true }), m.footer_company_title || {}) + U.repeater("footer_company", f("repeater", "ბმულები", { fields: plain, add: "ბმულის დამატება" }), m.footer_company || []) + "</section>"
      + '<section class="card"><h2>ფუტერი — სვეტი 2</h2>' + U.field("footer_legal_title", f("text", "სვეტის სათაური", { i18n: true }), m.footer_legal_title || {}) + U.repeater("footer_legal", f("repeater", "ბმულები", { fields: plain, add: "ბმულის დამატება" }), m.footer_legal || []) + "</section>"
      + '<p class="muted small">სერვისების სვეტი და საკონტაქტო ინფორმაცია ფუტერში ავტომატურად ივსება. ფუტერის ტექსტი — პარამეტრებში.</p></div></form>';
  },

  settings(req) {
    const site = C.site();
    const tab = String(req.query.tab || "contacts").replace(/[^a-z]/g, "") || "contacts";
    const bk = BK.config();
    const tabs = { contacts: "კონტაქტები", seo: "SEO და ანალიტიკა", booking: "დაჯავშნის განრიგი", process: "პროცესი და CTA", ui: "ინტერფეისის ტექსტები" };
    const sd = settingsDefs();
    const pick = (keys) => Object.fromEntries(keys.map((k) => [k, sd[k]]));
    const pane = (k) => '<div class="tabpane" data-pane="' + k + '"' + (tab === k ? "" : " hidden") + ">";
    let h = editorStart(req, "save_settings", hidden("tab", tab)) + '<div class="head sticky"><h1>პარამეტრები</h1><button class="btn">შენახვა</button></div><nav class="tabs" role="tablist">'
      + Object.entries(tabs).map(([k, l]) => '<button type="button" role="tab" data-tab="' + k + '" aria-selected="' + (k === tab) + '">' + e(l) + "</button>").join("") + "</nav><div>";
    h += pane("contacts") + '<section class="card" data-scope data-group="settings">'
      + U.fields(pick(["company", "phone", "email", "notify_email", "address", "city", "hours", "map_embed", "facebook", "linkedin", "instagram", "footer_text"]), site.settings) + "</section></div>";
    h += pane("seo") + '<section class="card" data-scope data-group="settings">' + U.fields(pick(["domain", "ga_id", "gsc_verification", "noindex_all"]), site.settings) + "</section>"
      + '<section class="card" data-scope data-group="seo">' + U.field("org_description", f("textarea", "კომპანიის აღწერა (Organization schema)", { i18n: true }), (site.seo || {}).org_description) + "</section>"
      + '<section class="card"><h2>ტექნიკური SEO</h2><ul class="muted small"><li>sitemap.xml: <a href="/sitemap.xml" target="_blank">/sitemap.xml</a> — ავტომატურად ახლდება</li><li>robots.txt: <a href="/robots.txt" target="_blank">/robots.txt</a></li><li>Schema.org: Organization/AccountingService, WebSite, WebPage, BreadcrumbList, Service, FAQPage — ავტომატურად</li><li>hreflang (ka/en/x-default) და canonical — ავტომატურად</li></ul></section></div>';
    const dn = BK.weekdays("ka", true);
    h += pane("booking") + '<section class="card" data-scope data-group="booking"><h2>კონსულტაციის განრიგი</h2><div class="fld"><span class="fld__label">სამუშაო დღეები</span><div class="days">'
      + [1, 2, 3, 4, 5, 6, 7].map((n) => '<label class="fld--check"><input type="checkbox" data-f="days" data-type="multi" value="' + n + '"' + (bk.days.includes(n) ? " checked" : "") + "> " + e(dn[n]) + "</label>").join("")
      + '</div></div><div class="row"><label class="fld"><span class="fld__label">დაწყება</span><input type="time" data-f="start" value="' + e(bk.start) + '"></label>'
      + '<label class="fld"><span class="fld__label">დასრულება</span><input type="time" data-f="end" value="' + e(bk.end) + '"></label></div><div class="row3">'
      + '<label class="fld"><span class="fld__label">ხანგრძლივობა (წთ)</span><input type="number" min="15" max="120" step="5" data-f="slot" value="' + bk.slot + '"></label>'
      + '<label class="fld"><span class="fld__label">მინ. საათი ჯავშნამდე</span><input type="number" min="0" max="72" data-f="notice" value="' + bk.notice + '"></label>'
      + '<label class="fld"><span class="fld__label">რამდენი დღით წინ</span><input type="number" min="1" max="90" data-f="ahead" value="' + bk.ahead + '"></label></div>'
      + '<label class="fld"><span class="fld__label">დაკეტილი თარიღები (უქმეები, შვებულება)</span><small class="hint">ფორმატი: 2026-01-01, თითო ხაზზე ან მძიმით</small><textarea data-f="blocked" rows="3">' + e(bk.blocked.join("\n")) + "</textarea></label></section></div>";
    h += pane("process") + '<section class="card" data-scope data-group="_root"><h2>საერთო პროცესი</h2><p class="muted small">გამოიყენება „პროცესი“ ბლოკებში (მონიშნული „საერთო ნაბიჯები“) და ყველა სერვისის გვერდზე.</p>'
      + U.repeater("process", f("repeater", "ნაბიჯები", { fields: S.recordDefs().step, add: "ნაბიჯის დამატება" }), site.process || []) + "</section>"
      + '<section class="card" data-scope data-group="cta"><h2>საერთო CTA ბლოკი</h2><p class="muted small">ჩნდება სერვისების გვერდების ბოლოს.</p>' + U.fields(S.blockDefs().cta.fields, site.cta || {}) + "</section></div>";
    const ui = site.ui || {};
    h += pane("ui") + '<section class="card" data-scope data-group="ui"><h2>ინტერფეისის ტექსტები</h2><p class="muted small">ღილაკები, ფორმის ლეიბლები და ჩატის კითხვები. ცარიელი ველი = ნაგულისხმევი ტექსტი (ნაცრისფრად ჩანს). {name} — კლიენტის სახელი.</p><div class="ui-list">'
      + Object.entries(STRINGS).map(([k, v]) => '<div class="fld fld--i18n"><span class="fld__label mono small">' + e(k) + '</span><div class="i18n">'
        + LANGS.map((l) => '<div class="i18n__col"><span class="flag flag--' + l + '">' + U.LANG_LABEL[l] + '</span><input type="text" data-f="' + e(k) + '" data-lang="' + l + '" placeholder="' + e(v[l] || "") + '" value="' + e((ui[k] || {})[l] || "") + '"></div>').join("")
        + "</div></div>").join("") + "</div></section></div>";
    return h + "</div></form>";
  },

  media(req) {
    return '<h1>ფოტოები</h1><form class="card upload" method="post" enctype="multipart/form-data">' + csrfField(req) + hidden("action", "upload")
      + '<label class="fld"><span class="fld__label">ფოტოს ატვირთვა (JPG, PNG, WebP, SVG — მაქს. 8 MB)</span><input type="file" name="file" accept="image/*" required></label>'
      + '<button class="btn">ატვირთვა</button><small class="muted">ფაილის სახელი SEO-სთვის ორიგინალიდან აიღება — ატვირთვამდე დაარქვით აღწერითი სახელი (მაგ. accountant-office-tbilisi.jpg).'
      + (media.hasSharp ? " დიდი ფოტოები ავტომატურად მცირდება (2000px) და WebP-ად გარდაიქმნება." : "") + '</small></form><div class="media-grid">'
      + media.list().map((m) => '<figure class="shot"><img src="' + e(m.url) + '" alt="" loading="lazy"><figcaption><code>' + e(m.name) + "</code>"
        + '<button type="button" class="btn btn--sm btn--ghost" data-copy="' + e(m.url) + '">მისამართის კოპირება</button>'
        + (m.deletable
          ? '<form method="post" onsubmit="return confirm(\'წავშალოთ ფოტო? შეამოწმეთ, რომ არსად გამოიყენება.\')">' + csrfField(req) + hidden("action", "media_delete") + hidden("name", m.name) + '<button class="link link--danger">წაშლა</button></form>'
          : '<small class="muted">ბრენდის ფოტო</small>') + "</figcaption></figure>").join("") + "</div>";
  },

  inbox(req, { leads, bookings }) {
    const tab = req.query.tab === "leads" ? "leads" : "bookings";
    const rows = [...(tab === "leads" ? leads : bookings)].reverse();
    let h = '<div class="head"><h1>განაცხადები და ჯავშნები</h1><a class="btn btn--ghost" href="' + U.aUrl("export", { kind: tab }) + '">CSV ექსპორტი</a></div>'
      + '<nav class="tabs"><a href="' + U.aUrl("inbox", { tab: "bookings" }) + '" aria-selected="' + (tab === "bookings") + '">კონსულტაციები (' + bookings.length + ")</a>"
      + '<a href="' + U.aUrl("inbox", { tab: "leads" }) + '" aria-selected="' + (tab === "leads") + '">საკონტაქტო ფორმა (' + leads.length + ")</a></nav>";
    if (!rows.length) h += '<div class="card"><p class="muted">ჯერ ჩანაწერი არ არის.</p></div>';
    const fieldsMap = tab === "bookings"
      ? [["ელფოსტა", "email"], ["ტელეფონი", "phone"], ["ბიზნესი", "business"], ["მხარდაჭერა", "support"], ["შეტყობინება", "message"], ["ენა", "lang"], ["გაიგზავნა", "created"], ["გვერდი", "page"]]
      : [["ელფოსტა", "email"], ["ტელეფონი", "phone"], ["კომპანია", "company"], ["შეტყობინება", "message"], ["ენა", "lang"], ["გვერდი", "page"]];
    for (const r of rows) {
      const st = r.status || "new";
      const when = tab === "bookings" ? (r.flexible ? "დრო შესათანხმებელია" : BK.label(r.date || "", r.time || "")) : String(r.date || "");
      h += '<details class="card entry entry--' + e(st) + '"><summary><span class="entry__main"><b>' + e(r.name) + '</b><span class="muted">' + e(r.service || "") + "</span></span>"
        + '<span class="entry__when">' + e(when) + '</span><span class="pill pill--st-' + e(st) + '">' + e(STATUS[st] || st) + '</span></summary><dl class="entry__dl">';
      for (const [lab, k] of fieldsMap) {
        let v = r[k];
        v = Array.isArray(v) ? v.join(", ") : String(v ?? "");
        if (!v) continue;
        if (k === "email") v = '<a href="mailto:' + e(v) + '">' + e(v) + "</a>";
        else if (k === "phone") v = '<a href="tel:' + e(core.phoneHref(v)) + '">' + e(v) + "</a>";
        else v = e(v).replace(/\r?\n/g, "<br>");
        h += "<dt>" + e(lab) + "</dt><dd>" + v + "</dd>";
      }
      h += '</dl><div class="entry__act"><form method="post" class="inline">' + csrfField(req) + hidden("action", "entry_status") + hidden("kind", tab) + hidden("id", r.id)
        + '<select name="status" onchange="this.form.submit()">' + Object.entries(STATUS).map(([k, l]) => '<option value="' + k + '"' + (k === st ? " selected" : "") + ">" + e(l) + "</option>").join("") + "</select></form>"
        + '<form method="post" class="inline" onsubmit="return confirm(\'წავშალოთ ჩანაწერი?\')">' + csrfField(req) + hidden("action", "entry_delete") + hidden("kind", tab) + hidden("id", r.id)
        + '<button class="link link--danger">წაშლა</button></form></div></details>';
    }
    if (tab === "bookings") h += '<p class="muted small">„გაუქმებული“ სტატუსი დროს ისევ ათავისუფლებს ონლაინ დაჯავშნისთვის.</p>';
    return h;
  },

  backup(req) {
    return '<h1>სარეზერვო ასლი</h1><section class="card"><h2>ჩამოტვირთვა</h2><p class="muted">ერთ ფაილში ინახება მთელი კონტენტი (გვერდები, სერვისები, FAQ, პარამეტრები, მენიუ) და განაცხადები/ჯავშნები. '
      + "რეკომენდებულია ყოველი დიდი ცვლილების შემდეგ და ყოველ ხელახალ დეპლოიმდე. ატვირთული ფოტოები ცალკე ინახება (DATA_DIR/uploads).</p>"
      + '<a class="btn" href="' + U.aUrl("backup", { download: 1 }) + '">სარეზერვო ასლის ჩამოტვირთვა</a></section>'
      + '<form class="card" method="post" enctype="multipart/form-data" onsubmit="return confirm(\'აღდგენა გადაწერს მიმდინარე კონტენტს. გავაგრძელოთ?\')">' + csrfField(req) + hidden("action", "restore")
      + '<h2>აღდგენა</h2><label class="fld"><span class="fld__label">სარეზერვო ფაილი (.json)</span><input type="file" name="file" accept="application/json,.json" required></label>'
      + '<button class="btn btn--ghost">აღდგენა</button></form>';
  },

  account(req) {
    return '<h1>პაროლის შეცვლა</h1><form method="post" class="card narrow">' + csrfField(req) + hidden("action", "password")
      + '<label class="fld"><span class="fld__label">მიმდინარე პაროლი</span><input type="password" name="current" required autocomplete="current-password"></label>'
      + '<label class="fld"><span class="fld__label">ახალი პაროლი (მინ. 10)</span><input type="password" name="new" required minlength="10" autocomplete="new-password"></label>'
      + '<label class="fld"><span class="fld__label">გაიმეორეთ</span><input type="password" name="new2" required autocomplete="new-password"></label>'
      + '<button class="btn">შეცვლა</button></form>';
  },
};

function collectionView(req, file, def, note, addLabel) {
  const items = read(file, { items: [] }).items || [];
  return editorStart(req, "save_" + file) + '<div class="head sticky"><h1>' + e(TITLES[file]) + '</h1><button class="btn">შენახვა</button></div><p class="muted">' + e(note) + "</p>"
    + '<div class="card" data-scope data-root>' + U.repeater("items", f("repeater", "ჩანაწერები", { fields: S.recordDefs()[def], add: addLabel }), items) + "</div></form>";
}

module.exports = router;
