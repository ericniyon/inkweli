import { NextResponse } from "next/server";
import { handleUrubutoPayPaymentWebhook } from "@/lib/urubutopay-payment-webhook";
import { handleUrubutoPayPortalAuth } from "@/lib/urubutopay-portal-auth";
import { handleUrubutoPayPayerVerify } from "@/lib/urubutopay-payer-verify";
import {
  isUrubutoPayPortalAuthBody,
  isUrubutoPayPayerValidationBody,
} from "@/lib/urubutopay-portal-dispatch";
import { logUrubutuPayEvent } from "@/lib/urubutopay-debug-log";

/**
 * Internal target when UrubutoPay is configured to POST auth, validation, notification,
 * and reversal all to https://your-domain/. Middleware rewrites POST / → here.
 */
export async function POST(request: Request) {
  const rawBody = await request.text().catch(() => "");
  let parsed: Record<string, unknown> = {};
  try {
    if (rawBody.trim()) parsed = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  logUrubutuPayEvent("portal_root", "post_routing", {
    keys: Object.keys(parsed).slice(0, 24).join(","),
  });

  if (isUrubutoPayPortalAuthBody(parsed)) {
    const forward = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: rawBody,
    });
    logUrubutuPayEvent("portal_root", "branch", { to: "webhook_auth" });
    return handleUrubutoPayPortalAuth(forward);
  }

  // Bill lookup before wallet payment / USSD — must return UrubutoPay validation shape,
  // not the payment webhook payload.
  if (isUrubutoPayPayerValidationBody(parsed)) {
    const forward = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: rawBody,
    });
    logUrubutuPayEvent("portal_root", "branch", { to: "payer_verify" });
    return handleUrubutoPayPayerVerify(forward);
  }

  logUrubutuPayEvent("portal_root", "branch", { to: "payment_webhook" });
  return handleUrubutoPayPaymentWebhook(request, rawBody);
}
