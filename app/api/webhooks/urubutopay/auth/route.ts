import { NextResponse } from "next/server";
import * as jose from "jose";

/**
 * UrubutoPay webhook authentication.
 * They call POST with { user_name, password } to get a Bearer token
 * they use for payment callbacks and payer validation.
 * Token valid for 24 hours per their docs.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const user_name = typeof body.user_name === "string" ? body.user_name.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const expectedUser = process.env.URUBUTOPAY_WEBHOOK_AUTH_USER?.trim();
    const expectedPassword = process.env.URUBUTOPAY_WEBHOOK_AUTH_PASSWORD;
    const secret = process.env.URUBUTOPAY_WEBHOOK_JWT_SECRET;

    if (!expectedUser || !expectedPassword || !secret) {
      console.warn("[webhooks/urubutopay/auth] Missing URUBUTOPAY_WEBHOOK_AUTH_* or JWT secret");
      return NextResponse.json(
        { timestamp: new Date().toISOString().replace("T", " ").slice(0, 19), message: "Invalid credentials", status: 401 },
        { status: 401 }
      );
    }

    if (user_name !== expectedUser || password !== expectedPassword) {
      return NextResponse.json(
        { timestamp: new Date().toISOString().replace("T", " ").slice(0, 19), message: "Invalid credentials", status: 401 },
        { status: 401 }
      );
    }

    const secretBytes = new TextEncoder().encode(secret);
    const jwt = await new jose.SignJWT({ sub: "urubutopay" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secretBytes);

    const token = `Bearer ${jwt}`;
    return NextResponse.json({
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      message: "Successful",
      status: 200,
      data: { token },
    });
  } catch (e) {
    console.error("[webhooks/urubutopay/auth]", e);
    return NextResponse.json(
      { message: "Internal server error", status: 500 },
      { status: 500 }
    );
  }
}
