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

/** შეტყობინებების მიმღებები: „პარამეტრები → შეტყობინებების ელფოსტა“ (რამდენიმე — მძიმით), ცარიელზე საკონტაქტო ელფოსტა */
function teamEmails() {
  const s = read("site").settings || {};
  const list = String(s.notify_email || "").split(/[,;\s]+/).map((x) => x.trim()).filter(isEmail);
  if (list.length) return [...new Set(list)];
  return [isEmail(s.email) ? String(s.email).trim() : TEAM_EMAIL];
}
/** ერთი მისამართი (Reply-To, კალენდრის აღწერა) — პირველი მიმღები */
const teamEmail = () => teamEmails()[0];

async function send(to, subject, text, replyTo = "") {
  const tr = transporter();
  const rcpt = (Array.isArray(to) ? to : [to]).map((x) => String(x || "").trim()).filter(isEmail);
  if (!tr || !rcpt.length) {
    if (!tr) console.info("[mail] SMTP არ არის კონფიგურირებული — წერილი არ გაიგზავნა:", subject);
    return false;
  }
  try {
    await tr.sendMail({
      from: process.env.MAIL_FROM || `Outsourcify <${process.env.SMTP_USER || "no-reply@outsourcify.ge"}>`,
      to: rcpt.join(", "), subject, text, replyTo: isEmail(replyTo) ? replyTo : undefined,
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

module.exports = { send, lines, teamEmail, teamEmails, isEmail };
