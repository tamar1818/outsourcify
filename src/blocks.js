"use strict";
/**
 * კომპონენტების რენდერერები. ყველა გვერდი ამ ბლოკებისგან იკრიბება —
 * ქართული და ინგლისური ვერსიები ერთსა და იმავე მარკაპს იყენებს, იცვლება მხოლოდ ტექსტი.
 */
const fs = require("fs");
const sizeOf = require("image-size");
const core = require("./core");
const { e, Ls, La, t, inlineHtml, richHtml, slug, imgUrl, publicFile, phoneHref } = core;
const C = require("./content");
const { icon } = require("./icons");
const { logoMark } = require("./logo");

/* ---------------------------------------------------- მოთხოვნის მდგომარეობა */
const state = { faq: [], ids: {} };
function resetRender() {
  state.faq = [];
  state.ids = {};
}
const faqRegistry = () => state.faq;

/** სექციის უნიკალური id (ღუზებისთვის) */
function secId(base) {
  const id = slug(base) || "section";
  const n = (state.ids[id] = (state.ids[id] || 0) + 1);
  return n > 1 ? id + "-" + n : id;
}

const nn = (i) => String(i + 1).padStart(2, "0");
const bi = (ka, en) => ({ ka, en });
const both = (key) => bi(t(key, "ka"), t(key, "en"));

/* ----------------------------------------------------------- დამხმარეები */
function btn(label, ref, variant = "primary", iconName = "arrow-right", extra = "") {
  if (!String(label).trim() || !String(ref).trim()) return "";
  const url = C.linkUrl(ref);
  const ext = C.isExternal(url) ? ' target="_blank" rel="noopener"' : "";
  return '<a class="btn btn--' + e(variant) + '" href="' + e(url) + '"' + ext + extra + "><span>" + e(label) + "</span>"
    + (iconName ? icon(iconName, "btn__ico") : "") + "</a>";
}

const ctaBtn = (b, n = "", variant = "primary") => btn(Ls(b[`cta${n}_label`]), String(b[`cta${n}_link`] || ""), variant);

function secHead(b, cls = "", tag = "h2") {
  const eyebrow = Ls(b.eyebrow).trim();
  const title = Ls(b.title).trim();
  const text = Ls(b.text).trim();
  if (!eyebrow && !title && !text) return "";
  if (!text) cls = cls.replace("sec-head--split", ""); // ორსვეტიანი მხოლოდ მაშინ, როცა აღწერაც არის
  let h = '<div class="sec-head ' + e(cls) + '" data-reveal>';
  if (eyebrow) h += '<p class="eyebrow">' + e(eyebrow) + "</p>";
  if (title) h += `<${tag} class="sec-title">` + inlineHtml(title) + `</${tag}>`;
  if (text) h += text.split(/\r?\n\s*\r?\n/).map((p) => '<p class="sec-text">' + inlineHtml(p.trim()) + "</p>").join("");
  return h + "</div>";
}

/** სურათის ზომები — CLS-ის თავიდან ასაცილებლად width/height */
const sizeCache = new Map();
function imgSize(url) {
  if (sizeCache.has(url)) return sizeCache.get(url);
  let r = [0, 0];
  const file = publicFile(url);
  if (file && !file.endsWith(".svg")) {
    try { const d = sizeOf(file); r = [d.width || 0, d.height || 0]; } catch { /* ფაილი არ არის */ }
  }
  sizeCache.set(url, r);
  return r;
}

/** <img> srcset-ით: /assets/img/photos/NAME.webp-ს აქვს -960 და -560 ვერსიები. eager — LCP სურათი */
function picture(src, alt, sizes = "100vw", cls = "", eager = false) {
  if (!src) return "";
  const url = imgUrl(src);
  const [w, h] = imgSize(url);
  let srcset = "";
  const m = url.match(/^(\/assets\/img\/photos\/[\w-]+)\.webp$/);
  if (m && w) {
    const parts = [];
    for (const [suf, wd] of [["-560", 560], ["-960", 960]]) {
      if (fs.existsSync(publicFile(m[1] + suf + ".webp"))) parts.push(m[1] + suf + ".webp " + wd + "w");
    }
    if (parts.length) {
      parts.push(url + " " + w + "w");
      srcset = ' srcset="' + e(parts.join(", ")) + '" sizes="' + e(sizes) + '"';
    }
  }
  return '<img class="' + e(cls) + '" src="' + e(url) + '"' + srcset + ' alt="' + e(alt) + '"'
    + (w ? ' width="' + w + '" height="' + h + '"' : "")
    + (eager ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"') + ">";
}

function checkList(items, cls = "checks") {
  if (!items || !items.length) return "";
  return '<ul class="' + e(cls) + '">' + items.map((i) => "<li>" + icon("check", "checks__ico") + "<span>" + inlineHtml(String(i)) + "</span></li>").join("") + "</ul>";
}

/* ---------------------------------------------------------------- ბლოკები */
const R = {};

function renderBlocks(blocks, ctx = {}) {
  let out = "";
  for (const b of blocks || []) {
    if (b.hidden || !R[b.type]) continue;
    out += R[b.type](b, ctx);
  }
  return out;
}

R.hero = (b) => {
  const img = String(b.image || "");
  let h = '<section class="hero" aria-labelledby="hero-title">'
    + '<div class="hero__bg" aria-hidden="true"><span class="hero__glow hero__glow--1"></span><span class="hero__glow hero__glow--2"></span></div>'
    + '<div class="container hero__grid"><div class="hero__copy">';
  const ey = Ls(b.eyebrow);
  if (ey) h += '<p class="eyebrow eyebrow--live" data-reveal><span class="eyebrow__dot"></span>' + e(ey) + "</p>";
  h += '<h1 class="hero__title" id="hero-title" data-reveal>' + inlineHtml(Ls(b.title)) + "</h1>";
  const tx = Ls(b.text);
  if (tx) h += '<p class="hero__lead" data-reveal>' + inlineHtml(tx) + "</p>";
  h += '<div class="hero__actions" data-reveal>' + ctaBtn(b, "1", "primary") + ctaBtn(b, "2", "ghost") + ctaBtn(b, "3", "link") + "</div>";
  h += "<div data-reveal>" + checkList(La(b.points), "hero__points") + "</div>";
  h += '</div><div class="hero__visual" aria-hidden="' + (img ? "false" : "true") + '">' + logoMark("hero__ring");
  if (img) h += '<div class="hero__photo">' + picture(img, Ls(b.image_alt), "(max-width: 900px) 92vw, 46vw", "", true) + "</div>";
  for (const [k, ic, cls, progress] of [["card1", "file-check", "fc fc--1", true], ["card2", "bars", "fc fc--2", false], ["card3", "shield", "fc fc--3", false]]) {
    const txt = Ls(b[k]);
    if (!txt) continue;
    h += '<div class="' + cls + '"><span class="fc__ico">' + icon(ic) + '</span><span class="fc__txt">' + e(txt) + "</span>";
    if (progress) h += '<span class="fc__bar"><i></i></span>';
    if (k === "card2") h += '<span class="fc__chart"><i style="--h:40%"></i><i style="--h:62%"></i><i style="--h:48%"></i><i style="--h:80%"></i><i style="--h:70%"></i><i style="--h:94%"></i></span>';
    h += "</div>";
  }
  return h + "</div></div></section>";
};

function breadcrumbsHtml(crumbs) {
  if (!crumbs || crumbs.length < 2) return "";
  const last = crumbs.length - 1;
  return '<nav class="crumbs" aria-label="' + e(t("breadcrumbs")) + '"><ol>'
    + crumbs.map(([name, url], i) => (i === last
      ? '<li><span aria-current="page">' + e(name) + "</span></li>"
      : '<li><a href="' + e(url) + '">' + e(name) + "</a>" + icon("chevron-right", "crumbs__sep") + "</li>")).join("")
    + "</ol></nav>";
}

R.page_hero = (b, ctx) => {
  const img = String(b.image || "");
  let h = '<section class="phero' + (img ? " phero--img" : "") + '"><div class="phero__bg" aria-hidden="true"></div>'
    + '<div class="container phero__grid"><div class="phero__copy">' + breadcrumbsHtml(ctx.crumbs);
  const ey = Ls(b.eyebrow);
  if (ey) h += '<p class="eyebrow" data-reveal>' + e(ey) + "</p>";
  h += '<h1 class="phero__title" data-reveal>' + inlineHtml(Ls(b.title)) + "</h1>";
  const tx = Ls(b.text);
  if (tx) h += '<p class="phero__lead" data-reveal>' + inlineHtml(tx) + "</p>";
  const c = ctaBtn(b);
  if (c) h += '<div class="phero__actions" data-reveal>' + c + "</div>";
  h += "</div>";
  if (img) h += '<div class="phero__media" data-reveal>' + picture(img, Ls(b.image_alt), "(max-width: 900px) 92vw, 40vw", "", true) + logoMark("phero__ring") + "</div>";
  return h + "</div></section>";
};

R.cards = (b) => {
  const variant = String(b.variant || "grid");
  const items = Array.isArray(b.items) ? b.items : [];
  const dark = variant === "bento";
  let h = '<section class="section' + (dark ? " section--dark" : "") + " cards-sec cards-sec--" + e(variant) + '" id="' + e(secId(Ls(b.title || "cards", "en"))) + '">';
  if (dark) h += '<div class="section--dark__glow" aria-hidden="true"></div>';
  h += '<div class="container">' + secHead(b, variant === "strip" ? "sec-head--center" : "sec-head--split");
  const tag = variant === "numbered" ? "ol" : "ul";
  const ht = Ls(b.title).trim() === "" ? "h2" : "h3"; // სათაურის გარეშე სექციაში იერარქია არ წყდება
  h += `<${tag} class="cards cards--` + e(variant) + " cards--n" + items.length + '" role="list">';
  items.forEach((it, i) => {
    h += '<li class="card" data-reveal style="--d:' + (i % 4) + '">';
    if (variant === "numbered") h += '<span class="card__num">' + nn(i) + "</span>";
    else if (it.icon) h += '<span class="card__ico">' + icon(String(it.icon)) + "</span>";
    h += '<div class="card__body"><' + ht + ' class="card__title">' + inlineHtml(Ls(it.title)) + "</" + ht + ">";
    const tx = Ls(it.text);
    if (tx) h += '<p class="card__text">' + inlineHtml(tx) + "</p>";
    h += "</div></li>";
  });
  h += `</${tag}>`;
  const c = ctaBtn(b, "", dark ? "light" : "primary");
  if (c) h += '<div class="sec-actions" data-reveal>' + c + "</div>";
  return h + "</div></section>";
};

function serviceCard(s, i) {
  return '<li class="svc" data-reveal style="--d:' + (i % 3) + '"><a class="svc__link" href="' + e(C.urlService(s)) + '">'
    + '<span class="svc__ico">' + icon(String(s.icon || "briefcase")) + "</span>"
    + '<span class="svc__num">' + nn(i) + "</span>"
    + '<h3 class="svc__title">' + e(Ls(s.title)) + "</h3>"
    + '<p class="svc__text">' + e(Ls(s.short)) + "</p>"
    + '<span class="svc__more"><span>' + e(t("learn_more")) + '</span><span class="svc__go">' + icon("arrow-up-right") + "</span></span></a></li>";
}

R.services = (b, ctx) => {
  let list = C.services();
  if (ctx.exclude) list = list.filter((s) => s.id !== ctx.exclude);
  const limit = parseInt(b.limit, 10) || 0;
  if (limit > 0) list = list.slice(0, limit);
  if (!list.length) return "";
  let h = '<section class="section services-sec" id="' + e(secId("services")) + '"><div class="container">' + secHead(b, "sec-head--split");
  if (b.layout === "list") {
    h += '<ol class="svc-list" role="list">' + list.map((s, i) => '<li data-reveal><a class="svc-row" href="' + e(C.urlService(s)) + '">'
      + '<span class="svc-row__num">' + nn(i) + "</span>"
      + '<span class="svc-row__ico">' + icon(String(s.icon || "briefcase")) + "</span>"
      + '<span class="svc-row__main"><h3 class="svc-row__title">' + e(Ls(s.title)) + "</h3>"
      + '<span class="svc-row__text">' + e(Ls(s.short)) + "</span></span>"
      + '<span class="svc-row__go">' + icon("arrow-up-right") + "</span></a></li>").join("") + "</ol>";
  } else {
    h += '<ul class="svc-grid" role="list">' + list.map(serviceCard).join("") + "</ul>";
  }
  const c = ctaBtn(b, "", "ghost");
  if (c) h += '<div class="sec-actions" data-reveal>' + c + "</div>";
  return h + "</div></section>";
};

R.split = (b) => {
  const img = String(b.image || "");
  let h = '<section class="section split' + (b.reverse ? " split--rev" : "") + '" id="' + e(secId(Ls(b.title || "split", "en"))) + '">'
    + '<div class="container split__grid"><div class="split__copy">' + secHead(b)
    + "<div data-reveal>" + checkList(La(b.points)) + "</div>";
  const c = ctaBtn(b);
  if (c) h += '<div class="sec-actions sec-actions--left" data-reveal>' + c + "</div>";
  h += "</div>";
  if (img) {
    h += '<div class="split__media" data-reveal><div class="split__photo">' + picture(img, Ls(b.image_alt), "(max-width: 900px) 92vw, 44vw") + "</div>";
    const bt = Ls(b.badge_title);
    if (bt) h += '<div class="split__badge"><span class="split__badge-ico">' + icon("check-circle") + "</span><span><b>" + e(bt) + "</b>" + e(Ls(b.badge_text)) + "</span></div>";
    h += "</div>";
  }
  return h + "</div></section>";
};

R.steps = (b) => {
  const items = b.use_global ? C.site().process || [] : Array.isArray(b.items) ? b.items : [];
  if (!items.length) return "";
  let h = '<section class="section steps-sec" id="' + e(secId("process")) + '"><div class="container">' + secHead(b, "sec-head--center")
    + '<ol class="steps steps--n' + items.length + '" data-steps>'
    + items.map((s, i) => '<li class="step" data-reveal style="--d:' + i + '"><span class="step__num">' + (i + 1) + "</span>"
      + '<h3 class="step__title">' + e(Ls(s.title)) + "</h3>"
      + '<p class="step__text">' + inlineHtml(Ls(s.text)) + "</p></li>").join("") + "</ol>";
  const c = ctaBtn(b);
  if (c) h += '<div class="sec-actions" data-reveal>' + c + "</div>";
  return h + "</div></section>";
};

R.compare = (b) => {
  const rows = Array.isArray(b.rows) ? b.rows : [];
  if (!rows.length) return "";
  const a = Ls(b.col_a);
  const bb = Ls(b.col_b);
  return '<section class="section compare-sec" id="' + e(secId("compare")) + '"><div class="container container--mid">' + secHead(b, "sec-head--center")
    + '<div class="compare" data-reveal><table><thead><tr><th scope="col">' + e(t("compare_criteria")) + "</th>"
    + '<th scope="col">' + e(a) + '</th><th scope="col" class="compare__us">' + logoMark("compare__mark") + e(bb) + "</th></tr></thead><tbody>"
    + rows.map((r) => '<tr><th scope="row">' + e(Ls(r.criterion)) + "</th>"
      + '<td data-label="' + e(a) + '">' + e(Ls(r.a)) + "</td>"
      + '<td data-label="' + e(bb) + '" class="compare__us">' + icon("check-circle", "compare__ok") + "<span>" + e(Ls(r.b)) + "</span></td></tr>").join("")
    + "</tbody></table></div></div></section>";
};

R.industries = (b) => {
  const list = C.industries();
  if (!list.length) return "";
  let h = '<section class="section section--soft ind-sec" id="' + e(secId("industries")) + '"><div class="container">' + secHead(b, "sec-head--split")
    + '<ul class="ind-grid" role="list">'
    + list.map((it, i) => '<li class="ind" data-reveal style="--d:' + (i % 3) + '"><span class="ind__ico">' + icon(String(it.icon || "building")) + "</span>"
      + '<h3 class="ind__title">' + e(Ls(it.title)) + "</h3>"
      + '<p class="ind__text">' + inlineHtml(Ls(it.text)) + "</p></li>").join("") + "</ul>";
  const c = ctaBtn(b);
  if (c) h += '<div class="sec-actions" data-reveal>' + c + "</div>";
  return h + "</div></section>";
};

R.testimonials = (b) => {
  const list = C.testimonials();
  if (!list.length) return ""; // გამოგონილ შეფასებებს არ ვაჩვენებთ
  let h = '<section class="section testi-sec" id="' + e(secId("testimonials")) + '"><div class="container">' + secHead(b, "sec-head--split")
    + '<div class="testi" data-carousel><div class="testi__track" data-carousel-track tabindex="0">';
  for (const x of list) {
    h += '<figure class="testi__card">' + icon("quote", "testi__q") + "<blockquote><p>" + e(Ls(x.quote)) + "</p></blockquote><figcaption>";
    h += x.photo
      ? '<img src="' + e(imgUrl(String(x.photo))) + '" alt="" width="48" height="48" loading="lazy">'
      : '<span class="testi__avatar" aria-hidden="true">' + e(Array.from(String(x.name || "?"))[0] || "?") + "</span>";
    h += "<span><b>" + e(String(x.name || "")) + "</b><small>" + e(Ls(x.role)) + "</small></span></figcaption></figure>";
  }
  h += "</div>";
  if (list.length > 1) {
    h += '<div class="testi__nav"><button type="button" class="icon-btn" data-carousel-prev aria-label="' + e(t("prev")) + '">' + icon("chevron-left") + "</button>"
      + '<button type="button" class="icon-btn" data-carousel-next aria-label="' + e(t("next")) + '">' + icon("chevron-right") + "</button></div>";
  }
  return h + "</div></div></section>";
};

function faqList(items) {
  const group = secId("faq-list");
  let h = '<div class="faq__list" data-accordion>';
  items.forEach((x, i) => {
    const q = Ls(x.q);
    const a = Ls(x.a);
    if (!q) return;
    state.faq.push({ q, a });
    h += '<details class="faq__item" name="' + e(group) + '" data-reveal' + (i === 0 ? " open" : "") + '><summary><h3 class="faq__q">' + e(q) + "</h3>"
      + '<span class="faq__toggle" aria-hidden="true">' + icon("plus") + "</span></summary>"
      + '<div class="faq__a"><div>' + richHtml(a) + "</div></div></details>";
  });
  return h + "</div>";
}

R.faq = (b, ctx) => {
  let items = ctx.faqItems || C.faqs(String(b.category || ""));
  const limit = parseInt(b.limit, 10) || 0;
  if (limit > 0) items = items.slice(0, limit);
  if (!items.length) return "";
  let h = '<section class="section faq-sec" id="' + e(secId("faq")) + '"><div class="container">' + secHead(b, "sec-head--split")
    + '<div class="faq">' + faqList(items) + '<aside class="faq__aside"><div class="faq__help" data-reveal><span class="faq__help-ico">' + icon("message") + "</span>"
    + "<p><b>" + e(t("sidebar_title")) + "</b>" + e(t("sidebar_text")) + "</p>"
    + btn(t("book_cta"), "page:book", "primary") + "</div>";
  const c = ctaBtn(b, "", "ghost");
  if (c) h += '<div class="sec-actions sec-actions--left">' + c + "</div>";
  return h + "</aside></div></div></section>";
};

/** ინტერაქტიული ჩანართები: ზემოთ ჩანართები, ქვემოთ ბარათი (ტექსტი + სურათი).
 *  საკუთარი ჩანართები (b.items) თუ არ არის — სერვისები ავტომატურად */
R.showcase = (b) => {
  const custom = (Array.isArray(b.items) ? b.items : []).filter((x) => Ls(x.title));
  const list = custom.length
    ? custom.map((x) => ({ title: Ls(x.title), text: Ls(x.text), points: La(x.points).slice(0, 6), icon: x.icon, image: x.image, alt: Ls(x.image_alt), link: String(x.link || "") }))
    : C.services().map((s) => ({ title: Ls(s.title), text: Ls(s.short), points: (s.includes || []).slice(0, 4).map((x) => Ls(x.title)), icon: s.icon, image: s.image, alt: Ls(s.image_alt), link: "service:" + s.id }));
  if (!list.length) return "";
  const id = secId("showcase");
  let tabs = "";
  let panels = "";
  list.forEach((s, i) => {
    const on = i === 0;
    tabs += '<button type="button" role="tab" class="sc__tab" id="' + id + "-t" + i + '" aria-controls="' + id + "-p" + i + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '">'
      + '<span class="sc__num">' + nn(i) + '</span><span class="sc__label">' + e(s.title) + "</span></button>";
    panels += '<div class="sc__panel" role="tabpanel" id="' + id + "-p" + i + '" aria-labelledby="' + id + "-t" + i + '"' + (on ? "" : " hidden") + ">"
      + (s.image ? '<div class="sc__media">' + picture(String(s.image), s.alt, "(max-width: 900px) 92vw, 50vw") + '<span class="sc__badge">' + icon(String(s.icon || "briefcase")) + "</span></div>" : "")
      + '<div class="sc__body"><h3 class="sc__title">' + e(s.title) + "</h3>" + (s.text ? '<p class="sc__text">' + inlineHtml(s.text) + "</p>" : "")
      + (s.points.length ? '<ul class="sc__list">' + s.points.map((x) => "<li>" + icon("check", "sc__check") + "<span>" + e(x) + "</span></li>").join("") + "</ul>" : "")
      + (s.link ? btn(t("learn_more"), s.link, "primary") : "") + "</div></div>";
  });
  const c = ctaBtn(b, "", "ghost");
  return '<section class="section showcase-sec" id="' + e(id) + '"><div class="container">' + secHead(b, "sec-head--split")
    + '<div class="sc" data-tabs data-reveal><div class="sc__tabs" role="tablist" aria-orientation="horizontal">' + tabs + '</div><div class="sc__panels">' + panels + "</div></div>"
    + (c ? '<div class="sec-actions" data-reveal>' + c + "</div>" : "") + "</div></section>";
};

/** ფასები: ჯგუფები ჩანართებად, თითოეულში ქვეჯგუფების ბარათები სტრიქონებით */
R.pricing = (b) => {
  const groups = (Array.isArray(b.groups) ? b.groups : []).filter((g) => Ls(g.title) && (g.sections || []).length);
  if (!groups.length) return "";
  const id = secId("pricing");
  const price = (v) => '<span class="pr__price">' + e(String(v)) + " <small>" + e(t("currency")) + "</small></span>";
  let tabs = "";
  let panels = "";
  groups.forEach((g, i) => {
    const on = i === 0;
    tabs += '<button type="button" role="tab" class="sc__tab" id="' + id + "-t" + i + '" aria-controls="' + id + "-p" + i + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '">'
      + '<span class="sc__num">' + (i + 1) + '</span><span class="sc__label">' + e(Ls(g.title)) + "</span></button>";
    const secs = g.sections.filter((x) => (x.rows || []).length);
    panels += '<div class="pr__panel pr__panel--n' + Math.min(secs.length, 3) + '" role="tabpanel" id="' + id + "-p" + i + '" aria-labelledby="' + id + "-t" + i + '"' + (on ? "" : " hidden") + ">"
      + secs.map((x) => {
        const st = Ls(x.title);
        return '<div class="pr__card">' + (st ? '<h3 class="pr__title">' + e(st) + "</h3>" : "") + '<ul class="pr__rows" role="list">'
          + x.rows.map((r) => {
            const lb = Ls(r.label);
            const pv = String(r.price || "").trim();
            return pv ? '<li class="pr__row"><span>' + e(lb) + "</span>" + price(pv) + "</li>" : '<li class="pr__sub">' + e(lb) + "</li>";
          }).join("") + "</ul></div>";
      }).join("") + "</div>";
  });
  const note = Ls(b.note);
  const c = ctaBtn(b, "", "primary");
  return '<section class="section pricing-sec" id="' + e(id) + '"><div class="container">' + secHead(b, "sec-head--split")
    + '<div class="pr" data-tabs data-reveal><div class="sc__tabs" role="tablist" aria-orientation="horizontal">' + tabs + "</div>" + panels + "</div>"
    + (note ? '<p class="pr__note">' + inlineHtml(note) + "</p>" : "")
    + (c ? '<div class="sec-actions" data-reveal>' + c + "</div>" : "") + "</div></section>";
};

/** მისია / განცხადება — დიდი ტექსტი ცენტრში */
R.statement = (b) => {
  const text = Ls(b.text).trim();
  if (!text) return "";
  const ey = Ls(b.eyebrow).trim();
  return '<section class="section statement-sec"><div class="container container--mid"><div class="statement" data-reveal>'
    + (ey ? '<p class="eyebrow">' + e(ey) + "</p>" : "") + '<p class="statement__text">' + inlineHtml(text) + "</p></div></div></section>";
};

/** კლიენტების ლოგოები — უსასრულო მოძრავი ზოლი (კოლექცია „კლიენტები“) */
R.logos = (b) => {
  const list = C.clients();
  if (!list.length) return "";
  const one = list.map((c) => {
    const img = '<img src="' + e(imgUrl(String(c.logo))) + '" alt="' + e(String(c.name || "")) + '" loading="lazy" decoding="async" height="40">';
    const url = String(c.url || "");
    return "<li>" + (/^https?:\/\/\S+$/i.test(url) ? '<a href="' + e(url) + '" target="_blank" rel="noopener nofollow">' + img + "</a>" : img) + "</li>";
  }).join("");
  // ზოლი ეკრანზე ფართო რომ იყოს — მცირე რაოდენობისას ვიმეორებთ
  const row = one.repeat(Math.max(1, Math.ceil(10 / list.length)));
  const title = Ls(b.title);
  return '<section class="logos" aria-label="' + e(title || t("clients")) + '"><div class="container">'
    + (title ? '<p class="logos__title">' + inlineHtml(title) + "</p>" : "") + "</div>"
    + '<div class="logos__mask"><div class="logos__track"><ul role="list">' + row + '</ul><ul role="list" aria-hidden="true">' + row.replace(/ alt="[^"]*"/g, ' alt=""').replace(/<a /g, '<a tabindex="-1" ') + "</ul></div></div></section>";
};

R.stats = (b) => {
  const items = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return "";
  return '<section class="section stats-sec"><div class="container">' + secHead(b, "sec-head--center") + '<dl class="stats">'
    + items.map((s, i) => '<div class="stat" data-reveal style="--d:' + i + '"><dt>' + e(Ls(s.label)) + "</dt>"
      + '<dd data-count="' + e(String(s.value || "")) + '">' + e(String(s.value || "")) + "</dd></div>").join("")
    + "</dl></div></section>";
};

R.richtext = (b) => {
  let body = richHtml(Ls(b.body));
  let toc = "";
  if (b.toc) {
    let n = 0;
    let links = "";
    body = body.replace(/<h2>([\s\S]*?)<\/h2>/g, (m, inner) => {
      n++;
      links += '<li><a href="#s' + n + '">' + core.stripTags(inner) + "</a></li>";
      return '<h2 id="s' + n + '">' + inner + "</h2>";
    });
    if (links) toc = '<aside class="prose__toc"><nav aria-label="TOC"><ol>' + links + "</ol></nav></aside>";
  }
  let h = '<section class="section prose-sec"><div class="container' + (toc ? " prose-wrap" : " container--narrow") + '">' + toc + '<div class="prose">';
  if (Ls(b.title)) h += secHead({ eyebrow: b.eyebrow || "", title: b.title || "" });
  return h + body + "</div></div></section>";
};

R.booking = (b) => '<section class="section book-sec" id="booking"><div class="container book"><div class="book__aside">' + secHead(b)
  + "<div data-reveal>" + checkList(La(b.points)) + "</div>" + contactMini() + "</div>"
  + '<div class="book__chat" data-reveal><div class="chat chat--inline" data-chat-inline>'
  + '<noscript><p class="chat__noscript">' + e(t("f_error")) + "</p></noscript></div></div></div></section>";

function contactMini() {
  const phone = C.setting("phone");
  const email = C.setting("email");
  let h = '<ul class="cmini" role="list">';
  const phone2 = C.setting("phone2");
  if (phone2) h += '<li><a href="tel:' + e(phoneHref(phone2)) + '">' + icon("phone") + "<span><small>" + e(t("phone_main")) + "</small>" + e(phone2) + "</span></a></li>";
  if (phone) h += '<li><a href="tel:' + e(phoneHref(phone)) + '">' + icon("phone") + "<span><small>" + e(phone2 ? t("phone_mobile") : t("call_us")) + "</small>" + e(phone) + "</span></a></li>";
  if (email) h += '<li><a href="mailto:' + e(email) + '">' + icon("mail") + "<span><small>" + e(t("write_us")) + "</small>" + e(email) + "</span></a></li>";
  return h + "</ul>";
}

function contactForm(title = "") {
  const opts = '<option value="">' + e(t("f_service_any")) + "</option>"
    + C.services().map((s) => '<option value="' + e(s.id) + '">' + e(Ls(s.title)) + "</option>").join("");
  const field = (name, label, type = "text", req = true, auto = "") => '<div class="field"><label for="f-' + name + '">' + e(label) + (req ? ' <span aria-hidden="true">*</span>' : "") + "</label>"
    + '<input id="f-' + name + '" name="' + name + '" type="' + type + '"' + (req ? ' required aria-required="true"' : "")
    + (auto ? ' autocomplete="' + auto + '"' : "") + ' aria-describedby="f-' + name + '-err">'
    + '<p class="field__err" id="f-' + name + '-err" aria-live="polite"></p></div>';
  return '<form class="form" data-lead-form novalidate action="/api/lead" method="post">'
    + (title ? '<h2 class="form__title">' + e(title) + "</h2>" : "")
    + '<div class="form__row">' + field("name", t("f_name"), "text", true, "name") + field("company", t("f_company"), "text", false, "organization") + "</div>"
    + '<div class="form__row">' + field("email", t("f_email"), "email", true, "email") + field("phone", t("f_phone"), "tel", true, "tel") + "</div>"
    + '<div class="field"><label for="f-service">' + e(t("f_service")) + '</label><div class="select"><select id="f-service" name="service">' + opts + "</select>" + icon("chevron-down") + "</div></div>"
    + '<div class="field"><label for="f-message">' + e(t("f_message")) + '</label><textarea id="f-message" name="message" rows="4"></textarea></div>'
    + '<div class="field field--check"><input id="f-consent" name="consent" type="checkbox" value="yes" required aria-describedby="f-consent-err">'
    + '<label for="f-consent">' + e(t("f_consent")) + ' <a href="' + e(C.urlPage("privacy")) + '">↗</a></label><p class="field__err" id="f-consent-err" aria-live="polite"></p></div>'
    + '<div class="hp" aria-hidden="true"><label>Website<input name="company_website" tabindex="-1" autocomplete="off"></label></div>'
    + '<input type="hidden" name="lang" value="' + e(core.lang()) + '">'
    + '<button class="btn btn--primary btn--block" type="submit"><span>' + e(t("f_send")) + "</span>" + icon("send", "btn__ico") + "</button>"
    + '<p class="form__status" role="status" aria-live="polite"></p></form>';
}

R.contact = (b) => {
  const s = C.site().settings || {};
  const cards = [];
  if (s.phone2) cards.push(["phone", t("phone_main"), String(s.phone2), "tel:" + phoneHref(s.phone2)]);
  if (s.phone) cards.push(["phone", s.phone2 ? t("phone_mobile") : t("call_us"), String(s.phone), "tel:" + phoneHref(s.phone)]);
  if (s.email) cards.push(["mail", t("write_us"), String(s.email), "mailto:" + s.email]);
  if (s.email2) cards.push(["mail", t("write_us"), String(s.email2), "mailto:" + s.email2]);
  const addr = Ls(s.address);
  if (addr) cards.push(["pin", t("visit_us"), addr, ""]);
  const hours = Ls(s.hours);
  if (hours) cards.push(["clock", t("hours"), hours, ""]);
  let h = '<section class="section contact-sec" id="contact-form"><div class="container contact"><div class="contact__info">' + secHead(b) + '<ul class="ccards" role="list">';
  cards.forEach(([ic, label, val, href], i) => {
    const inner = '<span class="ccard__ico">' + icon(ic) + "</span><span><small>" + e(label) + "</small><b>" + e(val).replace(/\r?\n/g, "<br>") + "</b></span>";
    h += '<li class="ccard" data-reveal style="--d:' + i + '">' + (href ? '<a href="' + e(href) + '">' + inner + "</a>" : "<div>" + inner + "</div>") + "</li>";
  });
  h += "</ul>" + socialLinks() + '</div><div class="contact__form" data-reveal>' + contactForm(Ls(b.form_title)) + "</div></div>";
  const map = String(s.map_embed || "").trim();
  if (b.show_map && /^https:\/\/(www\.|maps\.)?google\.[a-z.]+\/maps(\/embed\?|\?[^"<>]*output=embed)/.test(map)) {
    h += '<div class="container"><div class="map" data-reveal><iframe src="' + e(map) + '" title="' + e(t("visit_us")) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div></div>';
  }
  return h + "</section>";
};

function socialLinks(cls = "socials") {
  const s = C.site().settings || {};
  const h = [["facebook", "Facebook"], ["linkedin", "LinkedIn"], ["instagram", "Instagram"], ["youtube", "YouTube"], ["tiktok", "TikTok"]]
    .filter(([k]) => /^https:\/\//.test(String(s[k] || "").trim()))
    .map(([k, name]) => '<li><a href="' + e(String(s[k]).trim()) + '" target="_blank" rel="noopener" aria-label="' + name + '">' + icon(k) + "</a></li>").join("");
  return h ? '<ul class="' + e(cls) + '" role="list">' + h + "</ul>" : "";
}

R.cta = (b) => {
  const phone = C.setting("phone");
  const img = String(b.image || "");
  let h = '<section class="section cta-sec"><div class="container"><div class="cta' + (img ? " cta--img" : "") + '" data-reveal>'
    + '<div class="cta__deco" aria-hidden="true">' + logoMark("cta__ring") + '</div>'
    + (img ? '<div class="cta__media">' + picture(img, Ls(b.image_alt), "(max-width: 900px) 92vw, 40vw") + "</div>" : "")
    + '<div class="cta__copy">';
  const ey = Ls(b.eyebrow);
  if (ey) h += '<p class="eyebrow eyebrow--light">' + e(ey) + "</p>";
  h += '<h2 class="cta__title">' + inlineHtml(Ls(b.title)) + "</h2>";
  const tx = Ls(b.text);
  if (tx) h += '<p class="cta__text">' + inlineHtml(tx) + "</p>";
  h += '<div class="cta__actions">' + ctaBtn(b, "1", "light") + ctaBtn(b, "2", "outline-light");
  if (phone) h += '<a class="cta__phone" href="tel:' + e(phoneHref(phone)) + '">' + icon("phone") + e(phone) + "</a>";
  return h + "</div></div></div></div></section>";
};

/* ----------------------------------------------------------- სერვისის გვერდი */
function renderService(s, ctx) {
  let h = R.page_hero({
    eyebrow: both("services"), title: s.title || "", text: s.intro || "", image: s.image || "", image_alt: s.image_alt || "",
    cta_label: both("book_cta"), cta_link: "page:book",
  }, ctx);
  const aud = La(s.audience);
  h += '<section class="section svc-detail"><div class="container svc-detail__grid"><div class="prose" data-reveal>' + richHtml(Ls(s.body));
  if (aud.length) h += "<h2>" + e(t("for_whom")) + "</h2>" + checkList(aud);
  h += '</div><aside class="svc-aside" data-reveal><div class="svc-aside__card"><span class="svc-aside__ico">' + icon(String(s.icon || "briefcase")) + "</span>"
    + '<h2 class="svc-aside__title">' + e(t("sidebar_title")) + "</h2><p>" + e(t("sidebar_text")) + "</p>"
    + btn(t("book_cta"), "page:book", "primary", "calendar", ' data-service="' + e(s.id) + '"')
    + contactMini() + "</div></aside></div></section>";
  if (s.includes && s.includes.length) h += R.cards({ title: both("included"), variant: "grid", items: s.includes }, ctx);
  if (s.benefits && s.benefits.length) {
    h += R.cards({ eyebrow: bi("რატომ Outsourcify", "Why Outsourcify"), title: bi("რას იღებთ ჩვენთან თანამშრომლობით", "What you gain by working with us"), variant: "bento", items: s.benefits }, ctx);
  }
  h += R.steps({ eyebrow: bi("პროცესი", "Process"), title: bi("როგორ ვიწყებთ თანამშრომლობას", "How we get started"), use_global: true }, ctx);
  if (s.faq && s.faq.length) h += R.faq({ eyebrow: bi("FAQ", "FAQ"), title: both("service_faq") }, { ...ctx, faqItems: s.faq });
  h += R.services({ eyebrow: both("services"), title: both("related"), limit: 3, cta_label: both("all_services"), cta_link: "page:services" }, { ...ctx, exclude: s.id });
  const cta = C.site().cta;
  if (cta && Object.keys(cta).length) h += R.cta(cta);
  return h;
}

module.exports = { resetRender, faqRegistry, btn, secHead, picture, checkList, renderBlocks, renderService, contactMini, socialLinks, breadcrumbsHtml };
