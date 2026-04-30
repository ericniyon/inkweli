import { NextResponse } from "next/server";
import {
  syncSubscriptionLedgerFromWebhook,
  verifyGenericPaymentWebhookSignature,
} from "@/lib/subscription-ledger";

const SUCCESS = ["SUCCESS", "success", "paid", "completed", "valid", "PAID", "COMPLETED", "VALID"];
const FAILED = ["FAILED", "failed", "CANCELED", "cancelled", "DECLINED", "declined"];

/**
 * Normalized payment webhook (HMAC-sha256 hex, header X-Payment-Signature: sha256=<hex>).
 * Body JSON: { payment_reference: string, status: string, customer_email?: string }
 */
export async function POST(request: Request) {
  const rawBody = await request.text().catch(() => "");
  const signature =
    request.headers.get("x-payment-signature") ?? request.headers.get("X-Payment-Signature");

  if (!verifyGenericPaymentWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = rawBody.trim() ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payment_reference =
    (typeof body.payment_reference === "string" && body.payment_reference.trim()) ||
    (typeof body.paymentReference === "string" && body.paymentReference.trim()) ||
    "";

  const statusRaw = typeof body.status === "string" ? body.status.trim() : "";
  const customer_email =
    (typeof body.customer_email === "string" && body.customer_email.trim()) ||
    (typeof body.customerEmail === "string" && body.customerEmail.trim()) ||
    null;

  if (!payment_reference) {
    return NextResponse.json({ error: "payment_reference is required" }, { status: 400 });
  }

  const u = statusRaw.toUpperCase();
  const success = SUCCESS.includes(statusRaw) || SUCCESS.map((x) => x.toUpperCase()).includes(u);
  const failedFinal = FAILED.some((x) => x.toUpperCase() === u);

  await syncSubscriptionLedgerFromWebhook({
    refs: [payment_reference],
    success,
    failedFinal,
    gateway: "generic",
    gatewayEmail: customer_email,
    payload: body,
    primaryRef: payment_reference,
  });

  return NextResponse.json({ ok: true });
}
