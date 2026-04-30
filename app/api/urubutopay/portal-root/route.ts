import { NextResponse } from "next/server";
import { handleUrubutoPayPaymentWebhook } from "@/lib/urubutopay-payment-webhook";
import { handleUrubutoPayPortalAuth } from "@/lib/urubutopay-portal-auth";
import { isUrubutoPayPortalAuthBody } from "@/lib/urubutopay-portal-dispatch";

/**
 * Internal target when UrubutoPay is configured to POST notifications/reversal/auth
 * to the site root (/). Middleware rewrites POST / → here.
 */
export async function POST(request: Request) {
  const rawBody = await request.text().catch(() => "");
  let parsed: Record<string, unknown> = {};
  try {
    if (rawBody.trim()) parsed = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (isUrubutoPayPortalAuthBody(parsed)) {
    const forward = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: rawBody,
    });
    return handleUrubutoPayPortalAuth(forward);
  }

  return handleUrubutoPayPaymentWebhook(request, rawBody);
}
