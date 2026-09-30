"use strict";
/** ხაზოვანი SVG-ხატულები — კოდშივე, გარე ბიბლიოთეკის გარეშე */
const { e } = require("./core");
const ICONS = require("./icons-data");

function icon(name, cls = "") {
  const body = ICONS[name] || ICONS["check-circle"];
  return '<svg class="ico ' + e(cls) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + "</svg>";
}

module.exports = { ICONS, icon };
