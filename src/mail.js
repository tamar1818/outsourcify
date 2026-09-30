"use strict";
/**
 * ელფოსტა SMTP-ით (nodemailer). პარამეტრები — გარემოს ცვლადებიდან (პაროლი კოდსა და JSON-ში არ ინახება):
 *   SMTP_HOST=smtp.hostinger.com  SMTP_PORT=465  SMTP_USER=no-reply@outsourcify.ge  SMTP_PASS=…  [MAIL_FROM=…]
 * თუ SMTP არ არის მითითებული, წერილი არ იგზავნება (ჯავშანი/განაცხადი მაინც ინახება ადმინში).
 */
const nodemailer = require("nodemailer");
const { read } = require("./core");

const TEAM_EMAIL = "info@outsourcify.ge";
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").trim());
let transport = null;

function transporter() {
  if (transport !== null) return transport;
  const host = process.env.SMTP_HOST;
  if (!host) return (transport = false);
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  transport = nodemailer.createTransport({
    host, port, secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || "" } : undefined,
  });
  return transport;
}

/** მიმღები: „პარამეტრები → შეტყობინებების ელფოსტა“, შემდეგ საკონტაქტო ელფოსტა */
function teamEmail() {
  const s = read("site").settings || {};
  for (const x of [s.notify_email, s.email]) if (isEmail(x)) return String(x).trim();
  return TEAM_EMAIL;
}

async function send(to, subject, text, replyTo = "") {
  const tr = transporter();
  if (!tr || !isEmail(to)) {
    if (!tr) console.info("[mail] SMTP არ არის კონფიგურირებული — წერილი არ გაიგზავნა:", subject);
    return false;
  }
  try {
    await tr.sendMail({
      from: process.env.MAIL_FROM || `Outsourcify <${process.env.SMTP_USER || "no-reply@outsourcify.ge"}>`,
      to, subject, text, replyTo: isEmail(replyTo) ? replyTo : undefined,
    });
    return true;
  } catch (err) {
    console.error("[mail] გაგზავნა ვერ მოხერხდა:", err.message);
    return false;
  }
}

/** {ლეიბლი: მნიშვნელობა} → ტექსტი, ცარიელები გამოტოვებულია */
function lines(fields) {
  return Object.entries(fields)
    .map(([k, v]) => [k, String(Array.isArray(v) ? v.join(", ") : v ?? "").trim()])
    .filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n") + "\n";
}

module.exports = { send, lines, teamEmail, isEmail };
