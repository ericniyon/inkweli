/**
 * Send password reset email via SMTP.
 * Required .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, APP_URL (e.g. http://localhost:3000)
 *
 * Brevo: SMTP_USER is login@smtp-brevo.com — never use that as EMAIL_FROM (verify a real sender in Brevo).
 */
import nodemailer from "nodemailer";

function smtpDebug(): boolean {
  const v = process.env.SMTP_DEBUG?.trim().toLowerCase() ?? "";
  return ["1", "true", "yes"].includes(v);
}

/** From: optional display name via EMAIL_FROM_NAME. */
function mailFromField(): string | { name: string; address: string } {
  const address = (process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@localhost").trim();
  const name = process.env.EMAIL_FROM_NAME?.trim();
  if (name?.length) return { name, address };
  return address;
}

export function createSmtpTransporter(): nodemailer.Transporter {
  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const dbg = smtpDebug();
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: user && pass ? { user, pass } : undefined,
    ...(dbg && { logger: true, debug: true }),
  });
}

export async function sendMagicLinkEmail(
  to: string,
  signInLink: string
): Promise<{ ok: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromAddr = (process.env.EMAIL_FROM || process.env.SMTP_USER || "").trim();

  if (!host || !user || !pass) {
    return { ok: false, error: "SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env)" };
  }

  if (!fromAddr || /@smtp-brevo\.com$/i.test(fromAddr)) {
    return {
      ok: false,
      error:
        "EMAIL_FROM must be a verified sender in Brevo (not your @smtp-brevo.com SMTP login). Brevo will drop mail otherwise.",
    };
  }

  const from = mailFromField();

  try {
    const transporter = createSmtpTransporter();
    await transporter.sendMail({
      from,
      to,
      subject: "Your sign-in link",
      text: `Use this one-time link to sign in (expires in 15 minutes):\n\n${signInLink}\n\nIf you did not request this, you can ignore this email.`,
      html: `
        <p>Use this one-time link to sign in (expires in 15 minutes):</p>
        <p><a href="${signInLink}">Sign in to usethinkup</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `.trim(),
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<{ ok: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromAddr = (process.env.EMAIL_FROM || process.env.SMTP_USER || "").trim();

  if (!host || !user || !pass) {
    return { ok: false, error: "SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env)" };
  }

  if (!fromAddr || /@smtp-brevo\.com$/i.test(fromAddr)) {
    return {
      ok: false,
      error:
        "EMAIL_FROM must be a verified sender in Brevo (not your @smtp-brevo.com SMTP login). Brevo will drop mail otherwise.",
    };
  }

  const from = mailFromField();

  try {
    const transporter = createSmtpTransporter();

    const info = await transporter.sendMail({
      from,
      to,
      subject: "Reset your password",
      text: `You requested a password reset. Open this link to set a new password:\n\n${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
      html: `
        <p>You requested a password reset.</p>
        <p><a href="${resetLink}">Reset your password</a></p>
        <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      `.trim(),
    });
    if (smtpDebug()) {
      console.info("[smtp] accepted", info.messageId, info.response);
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
