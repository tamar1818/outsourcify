"use strict";
/**
 * ადმინის UI: ველების უნივერსალური რენდერერი (სქემიდან), ლეიაუთი, დამხმარეები.
 * ფორმის მონაცემებს public/admin/admin.js აგროვებს JSON-ად (data-scope / data-f ატრიბუტებით).
 */
const { e, L, Ls, LANGS, imgUrl, asset } = require("../core");
const C = require("../content");
const { ICONS, icon } = require("../icons");
const { logoSprite, logoLockup } = require("../logo");

const LANG_LABEL = { ka: "ქართ", en: "ENG" };

const aUrl = (p, q = {}) => "/admin?" + new URLSearchParams({ p, ...q }).toString();

function linkOptions() {
  const pages = {};
  for (const p of C.pages()) pages["page:" + p.id] = Ls(p.title || p.id, "ka");
  const svc = {};
  for (const s of C.services(true)) svc["service:" + s.id] = Ls(s.title || s.id, "ka");
  return { "გვერდები": pages, "სერვისები": svc, "განყოფილებები": { "page:contact#contact-form": "კონტაქტი → ფორმა", "page:book#booking": "დაჯავშნა → ჩატი" } };
}

const isMap = (v) => v && typeof v === "object" && !Array.isArray(v);

/** ერთი ველი (i18n — ორი სვეტი: ქართული / ინგლისური) */
function field(key, def, value) {
  const label = e(def.label);
  const hint = def.hint ? '<small class="hint">' + e(def.hint) + "</small>" : "";
  if (def.type === "repeater") return repeater(key, def, Array.isArray(value) ? value : []);
  if (def.type === "check") {
    return '<label class="fld fld--check"><input type="checkbox" data-f="' + e(key) + '" data-type="check"' + (value ? " checked" : "") + "> <span>" + label + "</span></label>";
  }
  if (def.i18n) {
    let h = '<div class="fld fld--i18n"><span class="fld__label">' + label + "</span>" + hint + '<div class="i18n">';
    for (const l of LANGS) {
      const v = isMap(value) ? value[l] ?? "" : l === "ka" ? value : "";
      h += '<div class="i18n__col"><span class="flag flag--' + l + '">' + LANG_LABEL[l] + "</span>" + control(key, def, v, l) + "</div>";
    }
    return h + "</div></div>";
  }
  return '<div class="fld"><span class="fld__label">' + label + "</span>" + hint + control(key, def, value, "") + "</div>";
}

const sv = (v) => (v === null || v === undefined || typeof v === "object" ? "" : String(v));

function control(key, def, v, l) {
  let attrs = 'data-f="' + e(key) + '"' + (l ? ' data-lang="' + l + '" lang="' + l + '"' : "") + ' data-type="' + e(def.type) + '"';
  const counter = def.counter ? ' data-counter="' + Number(def.counter) + '"' : "";
  switch (def.type) {
    case "textarea": return "<textarea " + attrs + counter + ' rows="3">' + e(sv(v)) + "</textarea>";
    case "rich":
      return '<div class="rich"><div class="rich__bar" role="toolbar">'
        + '<button type="button" data-wrap="strong" title="Bold"><b>B</b></button><button type="button" data-wrap="em" title="Italic"><i>I</i></button>'
        + '<button type="button" data-wrap="h2" title="ქვესათაური">H2</button><button type="button" data-wrap="h3" title="H3">H3</button>'
        + '<button type="button" data-list title="სია">• სია</button><button type="button" data-link title="ბმული">🔗</button></div>'
        + "<textarea " + attrs + ' rows="10" class="mono">' + e(sv(v)) + "</textarea></div>";
    case "list": return "<textarea " + attrs + ' rows="4">' + e((Array.isArray(v) ? v : []).join("\n")) + "</textarea>";
    case "number": return '<input type="number" min="0" max="999" ' + attrs + ' value="' + (parseInt(v, 10) || 0) + '">';
    case "select":
      return "<select " + attrs + ">" + Object.entries(def.options || {}).map(([ov, ol]) => '<option value="' + e(ov) + '"' + (sv(v) === ov ? " selected" : "") + ">" + e(ol) + "</option>").join("") + "</select>";
    case "link": {
      let known = false;
      let h = '<div class="lnk" ' + attrs + '><select class="lnk__sel"><option value="">— ბმულის გარეშე —</option>';
      for (const [group, items] of Object.entries(linkOptions())) {
        h += '<optgroup label="' + e(group) + '">';
        for (const [ov, ol] of Object.entries(items)) {
          const sel = sv(v) === ov;
          known = known || sel;
          h += '<option value="' + e(ov) + '"' + (sel ? " selected" : "") + ">" + e(ol) + "</option>";
        }
        h += "</optgroup>";
      }
      const custom = !known && sv(v) !== "";
      return h + '<option value="__custom"' + (custom ? " selected" : "") + ">სხვა მისამართი (URL, tel:, mailto:)…</option></select>"
        + '<input type="text" class="lnk__url" placeholder="https://… ან tel:+995…" value="' + e(custom ? sv(v) : "") + '"' + (custom ? "" : " hidden") + "></div>";
    }
    case "image": {
      v = sv(v);
      return '<div class="img" ' + attrs + '><div class="img__prev">' + (v ? '<img src="' + e(imgUrl(v)) + '" alt="">' : "<span>სურათი არ არის</span>") + "</div>"
        + '<div class="img__ctl"><input type="text" class="img__url" value="' + e(v) + '" placeholder="/assets/img/…">'
        + '<div class="img__btns"><button type="button" class="btn btn--sm" data-media-pick>ბიბლიოთეკიდან</button>'
        + '<label class="btn btn--sm btn--ghost">ატვირთვა<input type="file" accept="image/*" data-media-upload hidden></label>'
        + '<button type="button" class="link" data-img-clear>წაშლა</button></div></div></div>';
    }
    case "icon": {
      v = sv(v);
      const skip = ["menu", "x", "plus", "minus", "chevron-down", "chevron-left", "chevron-right", "facebook", "linkedin", "instagram"];
      return '<details class="icp" ' + attrs + ' data-value="' + e(v) + '"><summary><span class="icp__cur">' + (v ? icon(v) : "—") + '</span><span class="icp__name">' + e(v || "არჩევა") + "</span></summary>"
        + '<div class="icp__grid"><button type="button" data-icon="" title="ხატულის გარეშე">—</button>'
        + Object.keys(ICONS).filter((n) => !skip.includes(n)).map((n) => '<button type="button" data-icon="' + e(n) + '" title="' + e(n) + '"' + (n === v ? ' class="on"' : "") + ">" + icon(n) + "</button>").join("")
        + "</div></details>";
    }
    default: return '<input type="text" ' + attrs + counter + ' value="' + e(sv(v)) + '">';
  }
}

const fields = (defs, data = {}) => Object.entries(defs).map(([k, def]) => field(k, def, (data || {})[k])).join("");

function repeater(key, def, items) {
  return '<div class="rep" data-f="' + e(key) + '" data-type="repeater"><div class="rep__head"><span class="fld__label">' + e(def.label) + "</span>"
    + '<span class="rep__count">' + items.length + '</span></div><div class="rep__items">' + items.map((it) => repItem(def.fields, it || {})).join("")
    + "</div><template>" + repItem(def.fields, {}) + '</template><button type="button" class="btn btn--sm btn--ghost" data-rep-add>+ ' + e(def.add || "დამატება") + "</button></div>";
}

function repItem(defs, data) {
  let title = "";
  for (const k of ["title", "q", "label", "criterion", "name", "value"]) {
    if (data[k] !== undefined) { title = Ls(data[k], "ka"); break; }
  }
  return '<div class="rep-item" data-scope><div class="rep-item__bar"><button type="button" class="rep-item__toggle" data-collapse aria-expanded="true">'
    + '<span class="rep-item__title">' + e(title || "ახალი ჩანაწერი") + "</span></button>"
    + '<span class="tools"><button type="button" data-up title="ზემოთ">↑</button><button type="button" data-down title="ქვემოთ">↓</button>'
    + '<button type="button" data-dup title="დუბლირება">⧉</button><button type="button" data-del class="danger" title="წაშლა">✕</button></span></div>'
    + '<div class="rep-item__body">' + fields(defs, data) + "</div></div>";
}

/** ერთი ბლოკი გვერდის რედაქტორში */
function blockEditor(b, defs) {
  const d = defs[b.type];
  if (!d) return "";
  const sum = Ls(b.title || "", "ka").replace(/<[^>]*>/g, "").trim();
  return '<div class="blk' + (b.hidden ? " is-hidden" : "") + '" data-scope data-block="' + e(b.type) + '">'
    + '<div class="blk__bar"><button type="button" class="blk__toggle" data-collapse aria-expanded="false"><span class="blk__type">' + e(d.label) + "</span>"
    + '<span class="blk__sum">' + e(sum) + "</span></button>"
    + '<span class="tools"><label class="blk__vis" title="საიტზე ჩვენება"><input type="checkbox" data-f="visible" data-type="check"' + (b.hidden ? "" : " checked") + "> ჩანს</label>"
    + '<button type="button" data-up title="ზემოთ">↑</button><button type="button" data-down title="ქვემოთ">↓</button>'
    + '<button type="button" data-dup title="დუბლირება">⧉</button><button type="button" data-del class="danger" title="წაშლა">✕</button></span></div>'
    + '<div class="blk__body" hidden><p class="muted small">' + e(d.desc) + "</p>" + fields(d.fields, b) + "</div></div>";
}

/* ------------------------------------------------------------ ლეიაუთი */
const aHead = (title) => '<!doctype html><html lang="ka"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
  + '<meta name="robots" content="noindex, nofollow"><title>' + e(title) + " — Outsourcify CMS</title>"
  + '<link rel="icon" href="/assets/img/brand/favicon.svg" type="image/svg+xml">'
  + '<link rel="stylesheet" href="' + e(asset("admin/admin.css")) + '"></head>';

function aNav(cur, badges = {}) {
  const items = [["dashboard", "მთავარი", "bars"], ["pages", "გვერდები", "layers"], ["services", "სერვისები", "briefcase"], ["faqs", "FAQ", "message"],
    ["testimonials", "შეფასებები", "quote"], ["industries", "ვისთან ვმუშაობთ", "building"], ["menus", "მენიუ და ფუტერი", "menu"],
    ["media", "ფოტოები", "folder"], ["inbox", "განაცხადები", "mail"], ["settings", "პარამეტრები", "settings"]];
  let h = '<aside class="side">' + logoSprite() + '<a class="side__brand" href="/admin">' + logoLockup() + "<span>CMS</span></a><nav>";
  for (const [k, label, ic] of items) {
    const on = cur === k || (cur === "page" && k === "pages") || (cur === "service" && k === "services");
    h += '<a href="' + aUrl(k) + '"' + (on ? ' class="on" aria-current="page"' : "") + ">" + icon(ic) + "<span>" + e(label) + "</span>" + (badges[k] ? '<b class="badge">' + Number(badges[k]) + "</b>" : "") + "</a>";
  }
  return h + '</nav><div class="side__foot"><a href="/" target="_blank" rel="noopener">' + icon("arrow-up-right") + " საიტის ნახვა</a>"
    + '<a href="' + aUrl("backup") + '">' + icon("folder") + " სარეზერვო ასლი</a>"
    + '<a href="' + aUrl("account") + '">' + icon("lock") + " პაროლი</a>"
    + '<a href="/admin/logout">' + icon("x") + " გასვლა</a></div></aside>";
}

const aFoot = () => '<script src="' + e(asset("admin/admin.js")) + '" defer></script></body></html>';

const flash = (msg, err) => (msg ? '<div class="alert alert--ok" role="status">' + e(msg) + "</div>" : "") + (err ? '<div class="alert alert--err" role="alert">' + e(err) + "</div>" : "");

function seoLenClass(s, min, max) {
  const n = String(s || "").length;
  return n === 0 ? "bad" : n < min || n > max + 8 ? "warn" : "ok";
}

module.exports = { LANG_LABEL, aUrl, field, fields, repeater, blockEditor, aHead, aNav, aFoot, flash, seoLenClass };
