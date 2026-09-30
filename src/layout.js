"use strict";
/**
 * გვერდის ჩარჩო: <head> (SEO, Open Graph, hreflang, Schema.org), ჰედერი, mega-menu,
 * მობილური მენიუ, ფუტერი, ჩატ-დაჯავშნის კონფიგურაცია.
 */
const core = require("./core");
const { e, L, Ls, t, richHtml, stripTags, imgUrl, asset, phoneHref, LANGS, DEFAULT_LANG } = core;
const C = require("./content");
const { icon } = require("./icons");
const { logoSprite, logoLockup, logoMark } = require("./logo");
const B = require("./blocks");

const LANG_NAMES = { ka: { short: "ქარ", name: "ქართული" }, en: { short: "EN", name: "English" } };
let currentPath = "/";

function langSwitch(alts, cls = "lang") {
  return '<div class="' + e(cls) + '" role="group" aria-label="' + e(t("lang_switch")) + '">'
    + LANGS.map((l) => '<a href="' + e(alts[l] || "/") + '" hreflang="' + l + '" lang="' + l + '"'
      + (l === core.lang() ? ' aria-current="true" class="is-on"' : "") + ' title="' + e(LANG_NAMES[l].name) + '">' + e(LANG_NAMES[l].short) + "</a>").join("")
    + "</div>";
}

const menuItems = (key) => (C.site().menus || {})[key] || [];

function isCurrent(url) {
  const p = currentPath.replace(/\/+$/, "");
  const u = String(url).replace(/\/+$/, "");
  if (u === "" || u === "/en") return p === u;
  return p === u || p.startsWith(u + "/");
}

function megaMenu() {
  return '<div class="mega" id="mega-services"><div class="mega__in"><ul class="mega__list" role="list">'
    + C.services().map((s) => '<li><a class="mega__item" href="' + e(C.urlService(s)) + '"><span class="mega__ico">' + icon(String(s.icon || "briefcase")) + "</span>"
      + "<span><b>" + e(Ls(s.title)) + "</b><small>" + e(Ls(s.short)) + "</small></span></a></li>").join("")
    + '</ul><div class="mega__promo">' + logoMark("mega__ring")
    + '<p class="mega__promo-title">' + e(t("sidebar_title")) + "</p><p>" + e(t("sidebar_text")) + "</p>"
    + B.btn(t("book_cta"), "page:book", "light") + '<a class="mega__all" href="' + e(C.urlPage("services")) + '">' + e(t("all_services")) + icon("arrow-right") + "</a></div>"
    + "</div></div>";
}

function siteHeader(alts) {
  let h = '<a class="skip" href="#main">' + e(t("skip")) + "</a>"
    + '<header class="hdr" data-header><div class="container hdr__in">'
    + '<a class="hdr__logo" href="' + e(C.urlPage("home")) + '" aria-label="Outsourcify — ' + e(t("home")) + '">' + logoLockup() + "</a>"
    + '<nav class="nav" aria-label="Main"><ul class="nav__list" role="list">';
  for (const m of menuItems("header")) {
    const url = C.linkUrl(String(m.link || ""));
    const label = Ls(m.label);
    const cur = isCurrent(url) ? ' aria-current="page"' : "";
    if (m.mega) {
      h += '<li class="nav__item nav__item--mega" data-mega><a class="nav__link" href="' + e(url) + '"' + cur + ">" + e(label) + "</a>"
        + '<button class="nav__caret" type="button" aria-expanded="false" aria-controls="mega-services" aria-label="' + e(label) + " — " + e(t("menu")) + '">' + icon("chevron-down") + "</button>"
        + megaMenu() + "</li>";
    } else {
      h += '<li class="nav__item"><a class="nav__link" href="' + e(url) + '"' + cur + ">" + e(label) + "</a></li>";
    }
  }
  h += '</ul></nav><div class="hdr__end">' + langSwitch(alts)
    + B.btn(t("book_short"), "page:book", "primary", "calendar", " data-open-chat")
    + '<button class="burger" type="button" aria-expanded="false" aria-controls="drawer" aria-label="' + e(t("menu")) + '"><span></span><span></span><span></span></button>'
    + "</div></div></header>";

  // მობილური მენიუ
  h += '<div class="drawer" id="drawer" hidden><div class="drawer__in"><nav aria-label="Mobile"><ul class="drawer__list" role="list">';
  for (const m of menuItems("header")) {
    const url = C.linkUrl(String(m.link || ""));
    const label = Ls(m.label);
    if (m.mega) {
      h += '<li><details class="drawer__acc"><summary>' + e(label) + icon("chevron-down") + '</summary><ul role="list">'
        + C.services().map((s) => '<li><a href="' + e(C.urlService(s)) + '">' + icon(String(s.icon || "briefcase")) + e(Ls(s.title)) + "</a></li>").join("")
        + '<li><a class="drawer__all" href="' + e(url) + '">' + e(t("all_services")) + icon("arrow-right") + "</a></li></ul></details></li>";
    } else {
      h += '<li><a href="' + e(url) + '"' + (isCurrent(url) ? ' aria-current="page"' : "") + ">" + e(label) + "</a></li>";
    }
  }
  h += '</ul></nav><div class="drawer__foot">' + B.btn(t("book_cta"), "page:book", "primary") + B.contactMini()
    + langSwitch(alts, "lang lang--lg") + "</div></div></div>";
  return h;
}

function siteFooter(alts) {
  const s = C.site().settings || {};
  const menus = C.site().menus || {};
  let h = '<footer class="ftr"><div class="container"><div class="ftr__top">'
    + '<div class="ftr__brand"><a href="' + e(C.urlPage("home")) + '" class="ftr__logo" aria-label="Outsourcify">' + logoLockup() + "</a>"
    + "<p>" + e(Ls(s.footer_text)) + "</p>" + B.socialLinks("socials socials--dark") + "</div>";
  h += '<div class="ftr__col"><h2 class="ftr__h">' + e(t("services")) + '</h2><ul role="list">'
    + C.services().map((sv) => '<li><a href="' + e(C.urlService(sv)) + '">' + e(Ls(sv.title)) + "</a></li>").join("") + "</ul></div>";
  for (const [menu, titleKey] of [["footer_company", "footer_company_title"], ["footer_legal", "footer_legal_title"]]) {
    const items = menuItems(menu);
    if (!items.length) continue;
    h += '<div class="ftr__col"><h2 class="ftr__h">' + e(Ls(menus[titleKey])) + '</h2><ul role="list">'
      + items.map((m) => '<li><a href="' + e(C.linkUrl(String(m.link || ""))) + '">' + e(Ls(m.label)) + "</a></li>").join("") + "</ul></div>";
  }
  h += '<div class="ftr__col ftr__contact"><h2 class="ftr__h">' + e(t("contacts")) + "</h2>" + B.contactMini();
  const addr = Ls(s.address);
  if (addr) h += '<p class="ftr__addr">' + icon("pin") + e(addr) + "</p>";
  h += "</div></div>";
  h += '<div class="ftr__bottom"><p>© ' + new Date().getFullYear() + " " + e(String(s.company || "Outsourcify")) + ". " + e(t("rights")) + "</p>" + langSwitch(alts, "lang lang--dark") + "</div>"
    + "</div></footer>";

  // მობილურზე მიმაგრებული ზოლი
  h += '<div class="mbar" data-mbar>';
  if (s.phone) h += '<a class="mbar__call" href="tel:' + e(phoneHref(s.phone)) + '" aria-label="' + e(t("call_us")) + '">' + icon("phone") + "</a>";
  return h + B.btn(t("book_cta"), "page:book", "primary", "calendar", " data-open-chat") + "</div>";
}

/** ჩატ-დაჯავშნის კონფიგურაცია — JS-ს გადაეცემა JSON-ად */
function chatConfig() {
  const keys = ["chat_title", "chat_sub", "chat_open", "chat_nudge", "chat_step", "chat_of", "chat_back", "chat_continue", "chat_skip",
    "chat_edit", "chat_placeholder", "chat_send", "chat_q_service", "chat_q_business", "chat_business_ph", "chat_q_support",
    "chat_q_date", "chat_flexible", "chat_no_slots", "chat_q_name", "chat_q_email", "chat_q_phone", "chat_q_message",
    "chat_message_ph", "chat_q_summary", "chat_confirm", "chat_sending", "chat_done_title", "chat_done_text", "chat_done_flex",
    "chat_gcal", "chat_restart", "chat_taken", "chat_s_service", "chat_s_business", "chat_s_support", "chat_s_time",
    "chat_s_contact", "chat_s_message", "chat_other", "f_bad_email", "f_bad_phone", "f_required", "f_error", "close", "back_home",
    "f_consent", "f_name", "f_email", "f_phone", "f_ok_title", "f_ok_text", "f_sending"];
  const str = {};
  for (const k of keys) str[k] = t(k);
  const cfg = {
    lang: core.lang(), str,
    services: C.services().map((s) => ({ id: s.id, title: Ls(s.title), icon: icon(String(s.icon || "briefcase")) })),
    support: ["sup_ongoing", "sup_onetime", "sup_tax", "sup_fix", "sup_staff", "sup_advice"].map((k) => ({ id: k.slice(4), title: t(k) })),
    slots: "/api/slots?lang=" + core.lang(), book: "/api/book",
    bookUrl: C.urlPage("book"), privacy: C.urlPage("privacy"), home: C.urlPage("home"),
    icons: { check: icon("check"), back: icon("chevron-left"), send: icon("send"), x: icon("x"), cal: icon("calendar"), edit: icon("settings"), msg: icon("message"), ok: icon("check-circle") },
    mark: logoMark("chat__mark"),
  };
  const json = JSON.stringify(cfg).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
  return '<script type="application/json" id="chat-config">' + json + "</script>";
}

/* ------------------------------------------------------------ Schema.org */
function schemaGraph(meta) {
  const base = core.baseUrl();
  const s = C.site().settings || {};
  const orgId = base + "/#organization";
  const org = {
    "@type": ["Organization", "AccountingService"], "@id": orgId,
    name: String(s.company || "Outsourcify"), url: base + C.urlPage("home"),
    logo: { "@type": "ImageObject", url: base + "/assets/img/brand/outsourcify-logo.png", width: 512, height: 512 },
    image: base + "/assets/img/og-image.jpg",
    description: Ls((C.site().seo || {}).org_description),
    areaServed: { "@type": "Country", name: "Georgia" },
    knowsLanguage: ["ka", "en"],
  };
  if (s.email) org.email = s.email;
  if (s.phone) {
    org.telephone = phoneHref(s.phone);
    org.contactPoint = [{ "@type": "ContactPoint", telephone: org.telephone, contactType: "customer service", availableLanguage: ["Georgian", "English"], areaServed: "GE" }];
  }
  const addr = Ls(s.address, "en");
  if (addr) org.address = { "@type": "PostalAddress", streetAddress: addr, addressLocality: String(s.city || "Tbilisi"), addressCountry: "GE" };
  const same = [s.facebook, s.linkedin, s.instagram].filter((u) => String(u || "").startsWith("https://"));
  if (same.length) org.sameAs = same;
  const graph = [org, { "@type": "WebSite", "@id": base + "/#website", url: base + "/", name: "Outsourcify", inLanguage: ["ka-GE", "en"], publisher: { "@id": orgId } }];

  const pageUrl = meta.canonical;
  const inLanguage = core.lang() === "ka" ? "ka-GE" : "en";
  const page = {
    "@type": meta.pageType || "WebPage", "@id": pageUrl + "#webpage", url: pageUrl, name: meta.title, description: meta.description,
    inLanguage, isPartOf: { "@id": base + "/#website" }, about: { "@id": orgId },
  };
  if (meta.crumbs.length > 1) {
    page.breadcrumb = { "@id": pageUrl + "#breadcrumb" };
    graph.push({ "@type": "BreadcrumbList", "@id": pageUrl + "#breadcrumb",
      itemListElement: meta.crumbs.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: base + url })) });
  }
  graph.push(page);
  if (meta.service) {
    const sv = meta.service;
    graph.push({ "@type": "Service", "@id": pageUrl + "#service", name: Ls(sv.title), serviceType: Ls(sv.title, "en"), description: Ls(sv.short),
      url: pageUrl, provider: { "@id": orgId }, areaServed: { "@type": "Country", name: "Georgia" }, availableLanguage: ["ka", "en"] });
  }
  if (meta.listServices) {
    graph.push({ "@type": "ItemList", name: meta.title,
      itemListElement: C.services().map((sv, i) => ({ "@type": "ListItem", position: i + 1, url: base + C.urlService(sv), name: Ls(sv.title) })) });
  }
  const faq = B.faqRegistry();
  if (faq.length) {
    graph.push({ "@type": "FAQPage", "@id": pageUrl + "#faq", inLanguage,
      mainEntity: faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: stripTags(richHtml(x.a)).trim() } })) });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

/* ----------------------------------------------------------- მთლიანი გვერდი */
function renderDocument(meta, body, r) {
  const l = core.lang();
  const alts = C.alternates(r);
  const base = core.baseUrl();
  meta.canonical = base + (alts[l] || currentPath);
  let og = meta.image || "";
  og = og ? (/^https?:\/\//.test(og) ? og : base + imgUrl(og)) : base + "/assets/img/og-image.jpg";
  const s = C.site();
  const set = s.settings || {};
  const noindex = meta.noindex || set.noindex_all;
  let h = '<!doctype html><html lang="' + l + '" class="no-js"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
    + "<title>" + e(meta.title) + "</title>"
    + '<meta name="description" content="' + e(meta.description) + '">'
    + (noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">')
    + '<link rel="canonical" href="' + e(meta.canonical) + '">';
  if (r.type !== "404") {
    for (const x of LANGS) h += '<link rel="alternate" hreflang="' + x + '" href="' + e(base + alts[x]) + '">';
    h += '<link rel="alternate" hreflang="x-default" href="' + e(base + alts[DEFAULT_LANG]) + '">';
  }
  h += '<meta property="og:type" content="website"><meta property="og:site_name" content="Outsourcify">'
    + '<meta property="og:title" content="' + e(meta.title) + '"><meta property="og:description" content="' + e(meta.description) + '">'
    + '<meta property="og:url" content="' + e(meta.canonical) + '"><meta property="og:image" content="' + e(og) + '">'
    + '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
    + '<meta property="og:locale" content="' + (l === "ka" ? "ka_GE" : "en_US") + '"><meta property="og:locale:alternate" content="' + (l === "ka" ? "en_US" : "ka_GE") + '">'
    + '<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#0D4E8B">'
    + '<link rel="icon" href="/assets/img/brand/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="32x32">'
    + '<link rel="apple-touch-icon" href="/assets/img/brand/apple-touch-icon.png">'
    + '<link rel="preload" href="/assets/fonts/tbcx-bold.woff2" as="font" type="font/woff2" crossorigin>'
    + '<link rel="preload" href="/assets/fonts/tbcx-regular.woff2" as="font" type="font/woff2" crossorigin>'
    + '<link rel="stylesheet" href="' + e(asset("assets/css/site.css")) + '">'
    + '<script>document.documentElement.classList.replace("no-js","js")</script>';
  const gsc = String(set.gsc_verification || "").trim();
  if (gsc) h += '<meta name="google-site-verification" content="' + e(gsc) + '">';
  h += '<script type="application/ld+json">' + JSON.stringify(schemaGraph(meta)).replace(/</g, "\\u003c") + "</script>";
  const ga = String(set.ga_id || "").trim();
  if (/^G-[A-Z0-9]+$/.test(ga)) {
    h += '<script async src="https://www.googletagmanager.com/gtag/js?id=' + ga + '"></script>'
      + '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","' + ga + '")</script>';
  }
  h += '</head><body class="' + e(meta.bodyClass || "") + '">' + logoSprite() + siteHeader(alts)
    + '<main id="main" tabindex="-1">' + body + "</main>" + siteFooter(alts)
    + chatConfig() + '<script src="' + e(asset("assets/js/site.js")) + '" defer></script></body></html>';
  return h;
}

function seoTitle(item, fallback) {
  const v = String(L((item.seo || {}).title ?? item.seo_title ?? "") || "").trim();
  return v || fallback + " | Outsourcify";
}
function seoDesc(item, fallback = "") {
  const v = String(L((item.seo || {}).description ?? item.seo_desc ?? "") || "").trim();
  return v || fallback;
}

module.exports = { renderDocument, seoTitle, seoDesc, setPath: (p) => { currentPath = "/" + String(p).replace(/^\/+|\/+$/g, ""); } };
