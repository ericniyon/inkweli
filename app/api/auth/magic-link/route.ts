import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendMagicLinkEmail } from "@/lib/email";
import { getAppOrigin } from "@/lib/app-origin";

/** Request a magic sign-in link (no password). SMTP must be configured. */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
    if (!emailRaw || !emailRaw.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    const emailNorm = emailRaw.toLowerCase();

    await prisma.magicLinkToken.deleteMany({
      where: { email: emailNorm, usedAt: null },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.magicLinkToken.create({
      data: {
        tokenHash,
        email: emailNorm,
        expiresAt,
      },
    });

    const origin = getAppOrigin();
    const signInLink = `${origin}/login/verify?token=${encodeURIComponent(rawToken)}`;

    const sent = await sendMagicLinkEmail(emailNorm, signInLink);

    if (!sent.ok) {
      await prisma.magicLinkToken.deleteMany({ where: { tokenHash } }).catch(() => {});
      console.warn("[auth/magic-link] email failed:", sent.error ?? "");
      return NextResponse.json(
        { error: sent.error ?? "Could not send sign-in email. Try password sign-in instead." },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/auth/magic-link", e);
    return NextResponse.json({ error: "Could not send sign-in link." }, { status: 500 });
  }
}
