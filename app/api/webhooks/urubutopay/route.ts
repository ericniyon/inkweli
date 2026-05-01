import { handleUrubutoPayPaymentWebhook } from "@/lib/urubutopay-payment-webhook";

/** Optional POST mirror for inspecting payloads (webhook.site, etc.). Must be set in env or stays disabled. */
const WEBHOOK_DEBUG_FORWARD_URL =
  process.env.WEBHOOK_DEBUG_FORWARD_URL?.trim() ?? "";

async function forwardWebhookDebug(rawBody: string, request: Request) {
  if (!WEBHOOK_DEBUG_FORWARD_URL) return;

  try {
    const inboundHeaders = request.headers;
    const forwardedHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-forwarded-from": "urubutopay-webhook",
    };

    const auth = inboundHeaders.get("authorization");
    const signature =
      inboundHeaders.get("x-urubutopay-signature") ??
      inboundHeaders.get("X-UrubutoPay-Signature");

    if (auth) forwardedHeaders["x-original-authorization"] = auth;
    if (signature) forwardedHeaders["x-original-signature"] = signature;

    await fetch(WEBHOOK_DEBUG_FORWARD_URL, {
      method: "POST",
      headers: forwardedHeaders,
      body: rawBody,
    });
  } catch (e) {
    console.warn("[webhooks/urubutopay] Debug forward failed", e);
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  void forwardWebhookDebug(rawBody, request);
  return handleUrubutoPayPaymentWebhook(request, rawBody);
}
