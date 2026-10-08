"use strict";
/** საჯარო გვერდები: გვერდები, სერვისები, /sitemap.xml, /robots.txt და 404 */
const express = require("express");
const fs = require("fs");
const path = require("path");
const core = require("../core");
const { e, t, Ls, DATA_DIR, LANGS, DEFAULT_LANG } = core;
const C = require("../content");
const B = require("../blocks");
const { renderDocument, seoTitle, seoDesc, setPath } = require("../layout");
const { logoMark } = require("../logo");

const router = express.Router();

const mtime = (f) => {
  try { return core.ymd(new Date(fs.statSync(path.join(DATA_DIR, f + ".json")).mtimeMs)); } catch { return core.ymd(new Date()); }
};

router.get("/sitemap.xml", (req, res) => {
  const base = core.baseUrl();
  const entry = (alts, lastmod, prio) => Object.values(alts).map((u) => "  <url><loc>" + e(base + u) + "</loc><lastmod>" + lastmod + "</lastmod><priority>" + prio + "</priority>"
    + Object.entries(alts).map(([l2, u2]) => '<xhtml:link rel="alternate" hreflang="' + l2 + '" href="' + e(base + u2) + '"/>').join("")
    + '<xhtml:link rel="alternate" hreflang="x-default" href="' + e(base + alts[DEFAULT_LANG]) + '"/></url>\n').join("");
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
  for (const p of C.pages()) {
    if (p.hidden || p.noindex) continue;
    const alts = Object.fromEntries(LANGS.map((l) => [l, C.urlPage(p.id, l)]));
    xml += entry(alts, mtime("pages"), p.template === "home" ? "1.0" : ["privacy", "terms"].includes(p.id) ? "0.3" : "0.8");
  }
  for (const s of C.services()) {
    xml += entry(Object.fromEntries(LANGS.map((l) => [l, C.urlService(s, l)])), mtime("services"), "0.9");
  }
  res.type("application/xml").send(xml + "</urlset>");
});

/** Search Console — HTML ფაილით ვერიფიკაცია (google<code>.html) */
router.get(/^\/(google[0-9a-f]{10,40}\.html)$/, (req, res, next) => {
  const want = String((C.site().settings || {}).gsc_file || "").trim().replace(/^.*\//, "");
  if (!want || want !== req.params[0]) return next();
  res.type("text/html").send("google-site-verification: " + want);
});

router.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  if ((C.site().settings || {}).noindex_all) return res.send("User-agent: *\nDisallow: /\n");
  res.send("User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: " + core.baseUrl() + "/sitemap.xml\n");
});

router.get("*", (req, res) => {
  const p = req.path;
  // ერთი კანონიკური ფორმა: ბოლო სლეში მხოლოდ /en/-ზე
  if (p === "/en") return res.redirect(301, "/en/");
  if (p !== "/" && p !== "/en/" && p.endsWith("/")) return res.redirect(301, p.replace(/\/+$/, "") + (req.url.slice(p.length) || ""));

  const r = C.route(p);
  core.lang(r.lang);
  setPath(p);
  B.resetRender();
  const homeCrumb = [t("home"), C.urlPage("home")];

  if (r.type === "page") {
    const pg = r.page;
    const name = Ls(pg.title);
    const isHome = pg.template === "home";
    const crumbs = isHome ? [homeCrumb] : [homeCrumb, [name, C.urlPage(pg.id)]];
    const body = B.renderBlocks(pg.blocks || [], { crumbs });
    const types = { about: "AboutPage", contact: "ContactPage", services: "CollectionPage", book: "ContactPage" };
    return res.send(renderDocument({
      title: seoTitle(pg, name), description: seoDesc(pg), crumbs, image: String(pg.og_image || ""),
      noindex: !!pg.noindex, pageType: types[pg.id] || "WebPage", listServices: pg.id === "services",
      bodyClass: "page-" + core.slug(pg.id) + (pg.id === "book" ? " is-booking" : ""),
    }, body, r));
  }

  if (r.type === "service") {
    const s = r.service;
    const name = Ls(s.title);
    const sp = C.pageById("services");
    const crumbs = [homeCrumb, [Ls((sp || {}).title) || t("services"), C.urlPage("services")], [name, C.urlService(s)]];
    const body = B.renderService(s, { crumbs });
    return res.send(renderDocument({
      title: seoTitle(s, name), description: seoDesc(s, Ls(s.short)), crumbs, image: String(s.image || ""),
      service: s, bodyClass: "page-service",
    }, body, r));
  }

  const body = '<section class="nf"><div class="container nf__in">' + logoMark("nf__ring")
    + '<p class="nf__code" aria-hidden="true">404</p><h1 class="nf__title">' + e(t("not_found_title")) + "</h1>"
    + '<p class="nf__text">' + e(t("not_found_text")) + '</p><div class="nf__actions">'
    + B.btn(t("back_home"), "page:home", "primary") + B.btn(t("explore"), "page:services", "ghost") + "</div></div></section>";
  res.status(404).send(renderDocument({
    title: t("not_found_title") + " | Outsourcify", description: t("not_found_text"), crumbs: [], noindex: true, bodyClass: "page-404",
  }, body, r));
});

module.exports = router;
