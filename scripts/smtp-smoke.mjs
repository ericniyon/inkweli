/**
 * Smoke test: sends one email via .env SMTP (Brevo).
 * Usage: node scripts/smtp-smoke.mjs you@domain.com
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import nodemailer from "nodemailer";

function loadEnv(file) {
  const raw = readFileSync(file, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}

loadEnv(resolve(process.cwd(), ".env"));

const to = process.argv[2];
if (!to) {
  console.error("Usage: node scripts/smtp-smoke.mjs recipient@example.com");
  process.exit(1);
}

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT) || 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const emailFrom = (process.env.EMAIL_FROM || "").trim();
const displayName = (process.env.EMAIL_FROM_NAME || "").trim();

if (!host || !user || !pass) {
  console.error("Missing SMTP_HOST, SMTP_USER, or SMTP_PASS in .env");
  process.exit(1);
}

if (!emailFrom || /@smtp-brevo\.com$/i.test(emailFrom)) {
  console.error(
    "EMAIL_FROM must be an address verified in Brevo (not the SMTP login @smtp-brevo.com)."
  );
  process.exit(1);
}

const from =
  displayName.length > 0 ? { name: displayName, address: emailFrom } : emailFrom;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  requireTLS: port === 587,
  auth: { user, pass },
});

const info = await transporter.sendMail({
  from,
  to,
  subject: "SMTP smoke test",
  text: "If you see this, SMTP + verified From are working.",
  html: "<p>If you see this, SMTP + verified <code>From</code> are working.</p>",
});

console.info("accepted", info.messageId, "|", info.response);
