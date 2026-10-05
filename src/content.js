"use strict";
/**
 * კონტენტის ჩამტვირთავები, მისამართების აგება და მარშრუტიზაცია.
 *   ქართული (მთავარი): /, /chven-shesakheb, /servisebi/<slug>
 *   ინგლისური:         /en/, /en/about-us, /en/services/<slug>
 */
const core = require("./core");
const { read, L, LANGS, DEFAULT_LANG } = core;

const site = () => read("site");

function setting(key, def = "") {
  const v = (site().settings || {})[key];
  if (v === undefined || v === null) return def;
  return typeof v === "object" ? String(L(v)) : String(v);
}

const pages = () => read("pages", { pages: [] }).pages || [];
const pageById = (id) => pages().find((p) => p.id === id) || null;

const services = (all = false) => (read("services", { services: [] }).services || []).filter((s) => all || !s.hidden);
const serviceById = (id) => services(true).find((s) => s.id === id) || null;

const faqs = (cat = "") => (read("faqs", { items: [] }).items || []).filter((f) => !f.hidden && (!cat || f.category === cat));
const testimonials = () => (read("testimonials", { items: [] }).items || []).filter((x) => !x.hidden && String(L(x.quote || "")).trim() !== "");
const team = () => (read("team", { items: [] }).items || []).filter((x) => !x.hidden && String(L(x.name || "")).trim() !== "");
const clients = () => (read("clients", { items: [] }).items || []).filter((x) => !x.hidden && x.logo);
const industries = () => (read("industries", { items: [] }).items || []).filter((x) => !x.hidden);

/* ------------------------------------------------------------ მისამართები */
const langPrefix = (l) => ((l || core.lang()) === DEFAULT_LANG ? "" : "/" + (l || core.lang()));

function urlPage(id, l) {
  l = l || core.lang();
  const p = pageById(id);
  if (!p) return langPrefix(l) + "/";
  const s = String((p.slug || {})[l] || "");
  if (p.template === "home" || !s) return langPrefix(l) + "/";
  return langPrefix(l) + "/" + s;
}

function servicesBase(l) {
  l = l || core.lang();
  const p = pageById("services");
  return String(((p || {}).slug || {})[l] || (l === "ka" ? "servisebi" : "services"));
}

function urlService(s, l) {
  l = l || core.lang();
  if (typeof s === "string") s = serviceById(s) || {};
  return langPrefix(l) + "/" + servicesBase(l) + "/" + String((s.slug || {})[l] || s.id || "");
}

/** page:about · service:tax-consulting · page:contact#form · https://… · tel:… · mailto:… · #anchor */
function linkUrl(ref, l) {
  ref = String(ref || "").trim();
  if (!ref) return "#";
  const m = ref.match(/^(page|service):([a-z0-9_-]+)(#[\w-]+)?$/i);
  if (m) return (m[1] === "page" ? urlPage(m[2], l) : urlService(m[2], l)) + (m[3] || "");
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(ref)) return ref;
  return "#";
}

const isExternal = (url) => /^https?:\/\//i.test(url) && !url.startsWith(core.baseUrl());

/* ---------------------------------------------------------- მარშრუტიზაცია */
function route(pathname) {
  let p;
  try { p = decodeURIComponent(pathname); } catch { p = pathname; }
  let rest = p.replace(/^\/+|\/+$/g, "");
  let l = DEFAULT_LANG;
  for (const x of LANGS) {
    if (x !== DEFAULT_LANG && (rest === x || rest.startsWith(x + "/"))) {
      l = x;
      rest = rest.slice(x.length).replace(/^\/+/, "");
      break;
    }
  }
  const out = { type: "404", lang: l, path: p };
  if (rest === "") {
    const home = pages().find((pg) => pg.template === "home");
    return home ? { ...out, type: "page", page: home } : out;
  }
  const parts = rest.split("/");
  if (parts.length === 1) {
    const pg = pages().find((x) => x.template !== "home" && (x.slug || {})[l] === parts[0] && !x.hidden);
    if (pg) return { ...out, type: "page", page: pg };
  } else if (parts.length === 2 && parts[0] === servicesBase(l)) {
    const s = services().find((x) => (x.slug || {})[l] === parts[1]);
    if (s) return { ...out, type: "service", service: s };
  }
  return out;
}

/** იგივე გვერდის მისამართი ყველა ენაზე (hreflang, ენის გადამრთველი) */
function alternates(r) {
  const out = {};
  for (const l of LANGS) {
    if (r.service) out[l] = urlService(r.service, l);
    else if (r.page) out[l] = urlPage(r.page.id, l);
    else out[l] = langPrefix(l) + "/";
  }
  return out;
}

module.exports = {
  site, setting, pages, pageById, services, serviceById, faqs, testimonials, team, clients, industries,
  langPrefix, urlPage, servicesBase, urlService, linkUrl, isExternal, route, alternates,
};
