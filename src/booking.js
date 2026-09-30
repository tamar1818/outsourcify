"use strict";
/** კონსულტაციების დაჯავშნა — სამუშაო საათები, თავისუფალი დროები, ჯავშნები (ორენოვანი). დრო: Asia/Tbilisi */
const { read, ymd, hm } = require("./core");

const DEFAULTS = { days: [1, 2, 3, 4, 5], start: "10:00", end: "18:00", slot: 30, notice: 3, ahead: 21, blocked: [] };

const WEEKDAYS = {
  ka: { short: ["", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"], full: ["", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი", "კვირა"] },
  en: { short: ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], full: ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
};
const MONTHS = {
  ka: ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
const weekdays = (l, full = false) => WEEKDAYS[l === "en" ? "en" : "ka"][full ? "full" : "short"];
const months = (l) => MONTHS[l === "en" ? "en" : "ka"];
const isoDow = (d) => d.getDay() || 7;
const HM = /^([01]\d|2[0-3]):[0-5]\d$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(s) {
  if (!YMD.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? dt : null;
}
function at(date, time) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function config() {
  const c = (read("site").booking || {});
  const cfg = { ...DEFAULTS };
  for (const [k, v] of Object.entries(c)) if (v !== "" && v !== null && v !== undefined) cfg[k] = v;
  cfg.days = (Array.isArray(cfg.days) ? cfg.days : []).map(Number).filter((d) => d >= 1 && d <= 7);
  cfg.slot = Math.max(15, Math.min(120, parseInt(cfg.slot, 10) || 30));
  cfg.notice = Math.max(0, Math.min(72, parseInt(cfg.notice, 10) || 0));
  cfg.ahead = Math.max(1, Math.min(90, parseInt(cfg.ahead, 10) || 21));
  for (const k of ["start", "end"]) if (!HM.test(String(cfg[k]))) cfg[k] = DEFAULTS[k];
  cfg.blocked = (Array.isArray(cfg.blocked) ? cfg.blocked : []).filter((d) => YMD.test(String(d)));
  return cfg;
}

const bookings = () => read("bookings", { bookings: [] }).bookings || [];

/** დაკავებული დროები: {"Y-m-d H:i": true} (გაუქმებულის გარდა) */
function bookedMap() {
  const map = {};
  for (const b of bookings()) if ((b.status || "new") !== "cancelled" && b.date) map[b.date + " " + (b.time || "")] = true;
  return map;
}

function daySlots(date, cfg = config(), booked = bookedMap()) {
  const day = parseDate(date);
  if (!day || cfg.blocked.includes(date) || !cfg.days.includes(isoDow(day))) return [];
  const earliest = new Date(Date.now() + cfg.notice * 3600e3);
  const end = at(day, cfg.end);
  const out = [];
  for (let tm = at(day, cfg.start); tm.getTime() + cfg.slot * 60e3 <= end.getTime(); tm = new Date(tm.getTime() + cfg.slot * 60e3)) {
    const x = hm(tm);
    if (tm >= earliest && !booked[date + " " + x]) out.push(x);
  }
  return out;
}

/** მომდევნო სამუშაო დღეები თავისუფალი დროებით */
function days(l) {
  const cfg = config();
  const booked = bookedMap();
  const out = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < cfg.ahead; i++, d.setDate(d.getDate() + 1)) {
    if (!cfg.days.includes(isoDow(d))) continue;
    const date = ymd(d);
    out.push({ date, dow: weekdays(l)[isoDow(d)], day: d.getDate(), month: months(l)[d.getMonth()].slice(0, 3), slots: daySlots(date, cfg, booked) });
  }
  return out;
}

/** „ხუთშაბათი, 2 ოქტომბერი, 11:30“ / „Thursday, 2 October, 11:30“ */
function label(date, time, l = "ka") {
  const d = parseDate(String(date));
  if (!d) return (String(date) + " " + String(time)).trim();
  return weekdays(l, true)[isoDow(d)] + ", " + d.getDate() + " " + months(l)[d.getMonth()] + ", " + time;
}

module.exports = { config, bookings, bookedMap, daySlots, days, label, weekdays, at, parseDate };
