"use strict";
/**
 * Outsourcify — Express სერვერი.
 *   npm start            → http://localhost:3000  (PORT გარემოს ცვლადით იცვლება)
 *
 * გარემოს ცვლადები (ყველა არასავალდებულოა):
 *   PORT            — პორტი (ჰოსტინგი თავად აწვდის)
 *   DATA_DIR        — CMS-ის მონაცემები და ატვირთვები (ნაგულისხმევად ./data)
 *   SESSION_SECRET  — ადმინის სესიის გასაღები (ცარიელზე DATA_DIR/secret.key-ში იქმნება)
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM — ელფოსტის გაგზავნა
 */
process.env.TZ = process.env.TZ || "Asia/Tbilisi"; // ჯავშნები თბილისის დროით

const express = require("express");
const compression = require("compression");
const core = require("./src/core");
const auth = require("./src/auth");

core.ensureData();

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true);

/* უსაფრთხოების ჰედერები + ერთი კანონიკური ჰოსტი (www → არა-www) */
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "SAMEORIGIN",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  });
  const host = String(req.headers.host || "");
  if (/^www\./i.test(host) && (req.method === "GET" || req.method === "HEAD")) {
    return res.redirect(301, (req.secure ? "https" : "http") + "://" + host.slice(4) + req.originalUrl);
  }
  core.setRequest(req);
  next();
});
app.use(compression());

/* სტატიკური ფაილები: ვერსიონირებული ასეტები წლიური ქეშით, HTML — ყოველთვის ახალი */
app.use(express.static(core.PUBLIC, {
  redirect: false,
  index: false,
  setHeaders(res, file) {
    if (/\.(css|js|woff2|webp|jpe?g|png|svg|ico)$/.test(file)) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  },
}));
app.use(core.UPLOADS_URL, express.static(core.UPLOADS_DIR, {
  redirect: false,
  index: false,
  setHeaders(res) {
    res.setHeader("Cache-Control", "public, max-age=2592000");
    res.setHeader("Content-Security-Policy", "script-src 'none'"); // ატვირთულ SVG-ში სკრიპტი არ სრულდება
  },
}));

app.use(auth.sessionMiddleware);
app.use("/api", require("./src/routes/api"));
app.use("/admin", require("./src/admin/router"));
app.use("/", require("./src/routes/site"));

app.use((err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ ok: false, error: "ფაილი 8 MB-ზე დიდია" });
  console.error(err);
  res.status(500).send("Server error");
});

const port = parseInt(process.env.PORT || "3000", 10);
app.listen(port, () => console.log(`Outsourcify → http://localhost:${port}  (data: ${core.DATA_DIR})`));
