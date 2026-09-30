"use strict";
/** Outsourcify-ის ლოგო — SVG სპრაიტი (ერთხელ <body>-ში) და <use>-ით გამოყენება */
const { e } = require("./core");
const { ring, word } = require("./logo-data");

function logoSprite() {
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
    + '<symbol id="lg-ring" viewBox="100 84 374 418">' + ring + "</symbol>"
    + '<symbol id="lg-word" viewBox="32 244 503 96">' + word + "</symbol>"
    + '<symbol id="lg-full" viewBox="28 82 511 421">' + ring + word + "</symbol>"
    + "</defs></svg>";
}

/** ჰორიზონტალური ვერსია ნავიგაციისთვის: სიმბოლო + სიტყვიერი ნიშანი */
function logoLockup(label = "Outsourcify") {
  return '<svg class="logo" viewBox="0 0 168 40" role="img" aria-label="' + e(label) + '">'
    + '<use href="#lg-ring" x="0" y="0" width="36" height="40"/>'
    + '<use href="#lg-word" x="44" y="8.2" width="124" height="23.6"/></svg>';
}

/** სრული (მთავარი) ლოგო — სიტყვა რგოლში */
function logoFull(label = "Outsourcify") {
  return '<svg class="logo logo--full" viewBox="28 82 511 421" role="img" aria-label="' + e(label) + '"><use href="#lg-full"/></svg>';
}

/** მხოლოდ რგოლი — დეკორატიული */
function logoMark(cls = "") {
  return '<svg class="logo-mark ' + e(cls) + '" viewBox="100 84 374 418" aria-hidden="true" focusable="false"><use href="#lg-ring"/></svg>';
}

module.exports = { logoSprite, logoLockup, logoFull, logoMark };
