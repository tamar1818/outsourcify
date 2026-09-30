"use strict";
/**
 * API: /api/slots (თავისუფალი დროები), /api/book (ჩატ-დაჯავშნა), /api/lead (საკონტაქტო ფორმა).
 * დაცვა: honeypot, ვალიდაცია, IP-ზე ლიმიტი. Node ერთ პროცესში სინქრონულად ამოწმებს და წერს —
 * ორმაგი ჯავშანი გამორიცხულია.
 */
const express = require("express");
const crypto = require("crypto");
const core = require("../core");
const { read, write, LANGS, DEFAULT_LANG, Ls, nowStamp, baseUrl } = core;
const C = require("../content");
const BK = require("../booking");
const mail = require("../mail");

const router = express.Router();
router.use(express.json({ limit: "64kb" }));
router.use(express.urlencoded({ extended: false, limit: "64kb" }));
router.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

const get = (b, k, max = 300) => {
  const v = b[k];
  return typeof v === "string" || typeof v === "number" ? core.stripTags(String(v)).trim().slice(0, max) : "";
};
const phoneOk = (p) => p.replace(/\D/g, "").length >= 7;
const pad2 = (n) => String(n).padStart(2, "0");
const gcalStamp = (d) => d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) + "T" + pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + "00Z";

router.get("/slots", (req, res) => {
  const l = LANGS.includes(req.query.lang) ? req.query.lang : DEFAULT_LANG;
  res.json({ ok: true, days: BK.days(l), slot: BK.config().slot });
});

router.post("/book", (req, res) => {
  const b = req.body || {};
  if (b.company_website) return res.json({ ok: true, label: "" }); // honeypot
  const l = LANGS.includes(b.lang) ? b.lang : DEFAULT_LANG;
  const name = get(b, "name", 120);
  const email = get(b, "email", 160);
  const phone = get(b, "phone", 60);
  const date = get(b, "date", 10);
  const time = get(b, "time", 5);
  const flexible = !!b.flexible || (!date && !time);
  const support = (Array.isArray(b.support) ? b.support : []).slice(0, 10).map((x) => core.stripTags(String(x)).slice(0, 80));

  const errors = [];
  if (!name) errors.push("name");
  if (!mail.isEmail(email)) errors.push("email");
  if (!phoneOk(phone)) errors.push("phone");
  if (!flexible && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))) errors.push("slot");
  if (errors.length) return res.status(422).json({ ok: false, fields: errors });

  const store = read("bookings", { bookings: [] });
  const list = store.bookings || [];
  if (list.filter((x) => x.ip === req.ip && Date.now() - x.ts * 1000 < 3600e3).length >= 4) return res.status(429).json({ ok: false, error: "too many requests" });
  if (!flexible && !BK.daySlots(date).includes(time)) return res.status(409).json({ ok: false, error: "taken" });

  const svc = C.serviceById(get(b, "service", 80));
  const item = {
    id: crypto.randomBytes(8).toString("hex"), ts: Math.floor(Date.now() / 1000), created: nowStamp(),
    date: flexible ? "" : date, time: flexible ? "" : time, flexible,
    name, email, phone, service: svc ? Ls(svc.title, "ka") : get(b, "service_label", 120),
    business: get(b, "business", 1500), support, message: get(b, "message", 3000),
    lang: l, page: get(b, "page", 200), status: "new", ip: req.ip,
  };
  list.push(item);
  if (!write("bookings", { ...store, bookings: list.slice(-3000) })) return res.status(500).json({ ok: false, error: "storage" });

  const slot = BK.config().slot;
  const labelKa = flexible ? "დრო შესათანხმებელია" : BK.label(date, time, "ka");
  const label = flexible ? "" : BK.label(date, time, l);
  let gcal = "";
  if (!flexible) {
    const start = BK.at(BK.parseDate(date), time);
    const end = new Date(start.getTime() + slot * 60e3);
    gcal = "https://calendar.google.com/calendar/render?action=TEMPLATE"
      + "&text=" + encodeURIComponent(l === "ka" ? "კონსულტაცია — Outsourcify" : "Consultation — Outsourcify")
      + "&dates=" + gcalStamp(start) + "/" + gcalStamp(end)
      + "&details=" + encodeURIComponent((l === "ka" ? "კითხვები: " : "Questions: ") + mail.teamEmail());
  }
  res.json({ ok: true, label, gcal, flexible });

  // წერილები პასუხის შემდეგ — კლიენტი არ ელოდება SMTP-ს
  mail.send(mail.teamEmail(), "ახალი კონსულტაცია: " + labelKa + " — " + name,
    "ახალი ჯავშანი საიტიდან\n\n" + mail.lines({
      "დრო": flexible ? labelKa : `${labelKa} (${slot} წთ, თბილისის დროით)`,
      "სახელი": name, "ელფოსტა": email, "ტელეფონი": phone, "სერვისი": item.service, "მხარდაჭერა": support, "ენა": l,
    })
    + (item.business ? "\nბიზნესი:\n" + item.business + "\n" : "")
    + (item.message ? "\nშეტყობინება:\n" + item.message + "\n" : "")
    + "\nყველა ჯავშანი: " + baseUrl() + "/admin?p=inbox\n", email);
  const body = l === "ka"
    ? `გამარჯობა, ${name}!\n\nმადლობა — თქვენი მოთხოვნა მიღებულია.\n`
      + (flexible ? "ჩვენი გუნდი მალე დაგიკავშირდებათ მოსახერხებელი დროის შესათანხმებლად.\n"
        : `კონსულტაციის დრო: ${label} (თბილისის დროით, ${slot} წუთი).\nჩვენი გუნდი დაგიკავშირდებათ დათქმულ დროს.\n\nკალენდარში დამატება: ${gcal}\n`)
      + "\nთუ რამე შეიცვალა, უბრალოდ უპასუხეთ ამ წერილს.\n\n— Outsourcify\n" + baseUrl() + "\n"
    : `Hello ${name},\n\nThank you — we have received your request.\n`
      + (flexible ? "Our team will contact you shortly to agree on a convenient time.\n"
        : `Consultation time: ${label} (Tbilisi time, ${slot} minutes).\nOur team will contact you at the agreed time.\n\nAdd to calendar: ${gcal}\n`)
      + "\nIf anything changes, simply reply to this email.\n\n— Outsourcify\n" + baseUrl() + "/en/\n";
  const subject = l === "ka"
    ? (flexible ? "მოთხოვნა მიღებულია — Outsourcify" : "კონსულტაცია დაჯავშნილია — " + label)
    : (flexible ? "Request received — Outsourcify" : "Consultation booked — " + label);
  mail.send(email, subject, body, mail.teamEmail());
});

router.post("/lead", (req, res) => {
  const b = req.body || {};
  if (b.company_website) return res.json({ ok: true });
  const name = get(b, "name", 120);
  const email = get(b, "email", 160);
  const phone = get(b, "phone", 60);
  const errors = [];
  if (!name) errors.push("name");
  if (!mail.isEmail(email)) errors.push("email");
  if (!phoneOk(phone)) errors.push("phone");
  if (b.consent !== "yes") errors.push("consent");
  if (errors.length) return res.status(422).json({ ok: false, fields: errors });

  const store = read("leads", { leads: [] });
  const leads = store.leads || [];
  if (leads.filter((x) => x.ip === req.ip && Date.now() - x.ts * 1000 < 600e3).length >= 5) return res.status(429).json({ ok: false, error: "too many requests" });
  const svc = C.serviceById(get(b, "service", 80));
  const lead = {
    id: crypto.randomBytes(8).toString("hex"), ts: Math.floor(Date.now() / 1000), date: nowStamp(),
    name, email, phone, company: get(b, "company", 160), service: svc ? Ls(svc.title, "ka") : "",
    message: get(b, "message", 4000), lang: LANGS.includes(b.lang) ? b.lang : "ka", page: get(b, "page", 200), status: "new", ip: req.ip,
  };
  leads.push(lead);
  if (!write("leads", { ...store, leads: leads.slice(-3000) })) return res.status(500).json({ ok: false, error: "storage" });
  res.json({ ok: true });

  mail.send(mail.teamEmail(), "ახალი შეტყობინება საიტიდან — " + name,
    "ახალი შეტყობინება საკონტაქტო ფორმიდან\n\n" + mail.lines({
      "სახელი": name, "კომპანია": lead.company, "ელფოსტა": email, "ტელეფონი": phone, "სერვისი": lead.service, "ენა": lead.lang, "გვერდი": lead.page,
    }) + (lead.message ? "\n" + lead.message + "\n" : "") + "\nყველა შეტყობინება: " + baseUrl() + "/admin?p=inbox\n", email);
});

module.exports = router;
