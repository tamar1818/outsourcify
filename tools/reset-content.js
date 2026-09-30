"use strict";
/**
 * საწყისი კონტენტის აღდგენა: content/*.json → DATA_DIR
 *   npm run reset-content            # კოპირებს მხოლოდ იმას, რაც DATA_DIR-ში არ არის
 *   npm run reset-content -- --force # გადაწერს კონტენტს (CMS-ში შეტანილი ცვლილებები დაიკარგება!)
 * განაცხადები, ჯავშნები, პაროლი და ატვირთვები არასოდეს იშლება.
 */
const fs = require("fs");
const path = require("path");
const { SEED_DIR, DATA_DIR, ensureData } = require("../src/core");

if (process.argv.includes("--force")) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const f of fs.readdirSync(SEED_DIR).filter((x) => x.endsWith(".json"))) {
    fs.copyFileSync(path.join(SEED_DIR, f), path.join(DATA_DIR, f));
    console.log("reset", f);
  }
}
ensureData();
console.log("DATA_DIR:", DATA_DIR);
