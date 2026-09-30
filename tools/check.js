"use strict";
/**
 * სწრაფი შემოწმება: ყველა მოდული იტვირთება და ყველა გვერდი ორივე ენაზე რენდერდება შეცდომის გარეშე.
 *   npm run check
 */
process.env.TZ = process.env.TZ || "Asia/Tbilisi";
const core = require("../src/core");
core.ensureData();
const C = require("../src/content");
const B = require("../src/blocks");
const { renderDocument } = require("../src/layout");
require("../src/admin/api");
require("../src/routes/api");

let n = 0;
for (const l of core.LANGS) {
  core.lang(l);
  for (const p of C.pages()) {
    B.resetRender();
    const html = renderDocument({ title: "t", description: "d", crumbs: [] }, B.renderBlocks(p.blocks || [], { crumbs: [] }), { type: "page", page: p });
    if (!html.includes("</html>")) throw new Error("render failed: " + p.id);
    n++;
  }
  for (const s of C.services()) {
    B.resetRender();
    B.renderService(s, { crumbs: [] });
    n++;
  }
}
console.log("ok —", n, "pages rendered");
