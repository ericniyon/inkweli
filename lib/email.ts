/**
 * Send password reset email via SMTP.
 * Required .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, APP_URL (e.g. http://localhost:3000)
 */
import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<{ ok: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@localhost";

  if (!host || !user || !pass) {
    return { ok: false, error: "SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env)" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
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
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
