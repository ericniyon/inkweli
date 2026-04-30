import { NextResponse } from "next/server";
import * as jose from "jose";
import { logUrubutuPayEvent } from "@/lib/urubutopay-debug-log";

/**
 * UrubutoPay portal calls POST with { user_name, password } to obtain a Bearer token
 * used for payer validation and payment callbacks when configured.
 */
export async function handleUrubutoPayPortalAuth(request: Request): Promise<Response> {
  try {
    const body = await request.json().catch(() => ({}));
    const user_name = typeof body.user_name === "string" ? body.user_name.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const expectedUser = process.env.URUBUTOPAY_WEBHOOK_AUTH_USER?.trim();
    const expectedPassword = process.env.URUBUTOPAY_WEBHOOK_AUTH_PASSWORD;
    const secret = process.env.URUBUTOPAY_WEBHOOK_JWT_SECRET;

    if (!expectedUser || !expectedPassword || !secret) {
      console.warn(
        "[webhooks/urubutopay/auth] Misconfigured: set URUBUTOPAY_WEBHOOK_AUTH_USER, URUBUTOPAY_WEBHOOK_AUTH_PASSWORD, URUBUTOPAY_WEBHOOK_JWT_SECRET"
      );
      logUrubutuPayEvent("webhook_auth", "misconfigured", {});
      return NextResponse.json(
        {
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
          message: "Webhook auth is not configured",
          status: 503,
        },
        { status: 503 }
      );
    }

    if (user_name !== expectedUser || password !== expectedPassword) {
      logUrubutuPayEvent("webhook_auth", "invalid_credentials", {});
      return NextResponse.json(
        {
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
          message: "Invalid credentials",
          status: 401,
        },
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
    logUrubutuPayEvent("webhook_auth", "token_issued", {
      user_hint:
        expectedUser.length >= 2 ? `${expectedUser.slice(0, 2)}***` : "***",
    });
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
