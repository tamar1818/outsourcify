"use strict";
/**
 * მფლობელის (პირველი ადმინისტრატორის) შექმნა ბრძანების ხაზიდან — როცა სერვერზე SSH წვდომა გაქვთ.
 *   node tools/create-admin.js <მომხმარებელი> <პაროლი>
 * მუშაობს მხოლოდ მაშინ, როცა ჯერ არცერთი ადმინისტრატორი არ არსებობს.
 */
const core = require("../src/core");
core.ensureData();
const auth = require("../src/auth");
const [user, pw] = process.argv.slice(2);
if (!user || !pw) { console.error("გამოყენება: node tools/create-admin.js <მომხმარებელი> <პაროლი>"); process.exit(1); }
const err = auth.install(user, pw);
if (err) { console.error("✗ " + err); process.exit(1); }
console.log("✓ მფლობელის ანგარიში შეიქმნა: " + user);
