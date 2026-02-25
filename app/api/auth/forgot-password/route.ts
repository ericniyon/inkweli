import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const TOKEN_BYTES = 32;
const EXPIRES_HOURS = 1;
const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });

    let devResetLink: string | undefined;

    // Only send reset for accounts that have a password (credentials sign-in)
    if (user?.passwordHash) {
      const token = randomBytes(TOKEN_BYTES).toString("hex");
      const expiresAt = new Date(Date.now() + EXPIRES_HOURS * 60 * 60 * 1000);

      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt },
      });

      const resetLink = `${APP_URL.replace(/\/$/, "")}/reset-password?token=${token}`;
      const result = await sendPasswordResetEmail(user.email, resetLink);

      if (!result.ok) {
        if (process.env.NODE_ENV === "development") {
          console.info("[dev] Password reset link (SMTP not configured or failed):", resetLink);
          devResetLink = resetLink;
        }
      }
    }

    // Always return same message to avoid email enumeration
    const payload: { message: string; devResetLink?: string } = {
      message: "If an account exists with this email, you will receive a password reset link shortly.",
    };
    if (devResetLink) payload.devResetLink = devResetLink;
    return NextResponse.json(payload);
  } catch (e) {
    console.error("POST /api/auth/forgot-password", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
