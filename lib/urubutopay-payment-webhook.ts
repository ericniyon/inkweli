import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SubscriptionTier } from "@prisma/client";
import * as jose from "jose";
import crypto from "crypto";
import { requestAuthorizationMatchesUrubutoApiKey } from "@/lib/urubutopay-request-api-key-match";
import {
  logUrubutuPayEvent,
  logUrubutuPayVerbose,
  maskEmail,
} from "@/lib/urubutopay-debug-log";
import { urubutuPayUsesLiveGateway } from "@/lib/urubutopay";

const SUCCESS_STATUSES = ["VALID", "success", "completed", "paid", "SUCCESS", "COMPLETED", "PAID"];

function planIdToTier(planId: string | undefined): SubscriptionTier {
  if (!planId) return "ONE_ARTICLE";
  const p = String(planId).toLowerCase();
  if (p === "plan_annual" || p.includes("annual")) return "UNLIMITED";
  if (p === "plan_per_article" || p.includes("article")) return "ONE_ARTICLE";
  return "ONE_ARTICLE";
}

async function verifyBearerToken(request: Request): Promise<boolean> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice(7);
  const secret = process.env.URUBUTOPAY_WEBHOOK_JWT_SECRET;
  if (!secret) return false;
  try {
    await jose.jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string | undefined): boolean {
  if (!secret || !signatureHeader) return !secret;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const expected = "sha256=" + hmac.digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

type Payload = Record<string, unknown>;

function getStr(p: Payload, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/** UrubutoPay may send ids as strings or numbers; normalize for lookups. */
function getRefStr(p: Payload, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return null;
}

type WebhookTxRefCandidates = {
  transaction_id: string | null;
  internal_transaction_id: string | null;
  payer_code: string | null;
  slip_number: string | null;
  external_transaction_id: string | null;
};

function collectRefFields(p: Payload): WebhookTxRefCandidates {
  return {
    transaction_id: getRefStr(p, "transaction_id", "transactionId"),
    internal_transaction_id: getRefStr(p, "internal_transaction_id", "internalTransactionId"),
    payer_code: getRefStr(p, "payer_code", "payerCode"),
    slip_number: getRefStr(p, "slip_number", "slipNumber"),
    external_transaction_id: getRefStr(p, "external_transaction_id", "externalTransactionId"),
  };
}

function mergeRefCandidates(a: WebhookTxRefCandidates, b: WebhookTxRefCandidates): WebhookTxRefCandidates {
  return {
    transaction_id: a.transaction_id ?? b.transaction_id,
    internal_transaction_id: a.internal_transaction_id ?? b.internal_transaction_id,
    payer_code: a.payer_code ?? b.payer_code,
    slip_number: a.slip_number ?? b.slip_number,
    external_transaction_id: a.external_transaction_id ?? b.external_transaction_id,
  };
}

/**
 * Collect every transaction reference UrubutoPay might send so we match DB rows regardless of
 * which field carries the merchant ref vs gateway id.
 */
export function extractWebhookTransactionRefs(payload: Payload): {
  byField: WebhookTxRefCandidates;
  uniqueValues: string[];
  primaryRef: string;
} {
  const top = collectRefFields(payload);
  let byField = top;
  const data = payload.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    byField = mergeRefCandidates(top, collectRefFields(data as Payload));
  }

  const order: (keyof WebhookTxRefCandidates)[] = [
    "transaction_id",
    "internal_transaction_id",
    "payer_code",
    "slip_number",
    "external_transaction_id",
  ];
  const uniqueValues: string[] = [];
  const seen = new Set<string>();
  for (const key of order) {
    const v = byField[key];
    if (v && !seen.has(v)) {
      seen.add(v);
      uniqueValues.push(v);
    }
  }

  const ink = uniqueValues.find((r) => r.startsWith("ink_"));
  const primaryRef =
    ink ??
    byField.transaction_id ??
    byField.internal_transaction_id ??
    byField.payer_code ??
    byField.slip_number ??
    byField.external_transaction_id ??
    "";

  return { byField, uniqueValues, primaryRef };
}

function prismaTxnMatchOr(refs: string[]) {
  const OR: Array<{
    transactionId?: string;
    internalTransactionRef?: string;
    payerCode?: string;
  }> = [];
  for (const ref of refs) {
    OR.push({ transactionId: ref }, { internalTransactionRef: ref }, { payerCode: ref });
  }
  return { OR };
}

/** Payload often lacks top-level payer_email — check aliases and nested `data`. */
function extractPayerEmailFromPayload(payload: Payload): string | null {
  const top = getStr(
    payload,
    "payer_email",
    "payerEmail",
    "email",
    "customer_email",
    "customerEmail",
    "buyer_email",
    "buyerEmail",
    "user_email",
    "userEmail"
  );
  if (top) return top;
  const data = payload.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return extractPayerEmailFromPayload(data as Payload);
  }
  return null;
}

/** Payment notification / reversal callback (reads raw body only for signature). */
export async function handleUrubutoPayPaymentWebhook(request: Request, rawBody: string): Promise<Response> {
  try {
    const signatureHeader =
      request.headers.get("x-urubutopay-signature") ?? request.headers.get("X-UrubutoPay-Signature") ?? null;
    const webhookSecret = urubutuPayUsesLiveGateway()
      ? process.env.URUBUTOPAY_WEBHOOK_SECRET_PRODUCTION
      : process.env.URUBUTOPAY_WEBHOOK_SECRET_STAGING;

    const validBearer = await verifyBearerToken(request);
    const validSig = verifySignature(rawBody, signatureHeader, webhookSecret ?? undefined);
    const validApiKey = requestAuthorizationMatchesUrubutoApiKey(request);

    if (!validBearer && !(webhookSecret && validSig) && !validApiKey) {
      console.warn("[webhooks/urubutopay] Invalid or missing auth (Bearer, signature, or API key)");
      logUrubutuPayEvent("webhook", "auth_failed", {
        hasAuthHeader: !!request.headers.get("authorization")?.trim(),
        hasSignature: !!signatureHeader,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logUrubutuPayVerbose("webhook", "raw_body", rawBody.slice(0, 8192));

    let payload: Payload;
    try {
      payload = JSON.parse(rawBody) as Payload;
    } catch {
      logUrubutuPayEvent("webhook", "invalid_json", { length: rawBody.length });
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const callbackType = getStr(payload, "callback_type", "callbackType");
    const transactionStatus = getStr(payload, "transaction_status", "transactionStatus");
    const email = extractPayerEmailFromPayload(payload);

    const refBundle = extractWebhookTransactionRefs(payload);
    const ref = refBundle.primaryRef;

    console.info("[webhooks/urubutopay] txn_ref_candidates", {
      byField: refBundle.byField,
      uniqueRefs: refBundle.uniqueValues,
      primaryRef: refBundle.primaryRef,
    });

    if (refBundle.uniqueValues.length === 0 || !ref) {
      logUrubutuPayEvent("webhook", "missing_reference", {});
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
    }

    const internalTransactionId = refBundle.byField.internal_transaction_id;

    logUrubutuPayEvent("webhook", "callback_received", {
      ref,
      uniqueRefs: refBundle.uniqueValues.join("|"),
      transactionStatus: transactionStatus ?? "",
      callbackType: callbackType ?? "",
    });

    // Reversal / canceled
    if (
      callbackType === "REVERSAL" ||
      transactionStatus === "CANCELED" ||
      transactionStatus === "REVERSED" ||
      String(transactionStatus).toUpperCase() === "CANCELED"
    ) {
      const updated = await prisma.urubutoPayTransaction.updateMany({
        where: prismaTxnMatchOr(refBundle.uniqueValues),
        data: { status: "CANCELED", updatedAt: new Date() },
      });
      if (updated.count > 0) {
        const tx = await prisma.urubutoPayTransaction.findFirst({
          where: prismaTxnMatchOr(refBundle.uniqueValues),
        });
        if (tx?.userId) {
          await prisma.user.update({
            where: { id: tx.userId },
            data: { tier: "NONE" },
          }).catch(() => {});
          logUrubutuPayEvent("webhook", "reversal_downgraded_user", { ref, userId: tx.userId });
        } else {
          logUrubutuPayEvent("webhook", "reversal_transaction_only", {
            ref,
            rowsUpdated: updated.count,
          });
        }
      } else {
        logUrubutuPayEvent("webhook", "reversal_no_matching_tx", { ref });
      }
      return NextResponse.json({
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        status: 200,
        message: "successful",
      });
    }

    // Bulk disbursement – acknowledge only
    if (
      callbackType === "BULK_DISBURSEMENT_DEBIT" ||
      callbackType === "BULK_DISBURSEMENT_PAYMENT" ||
      callbackType === "RECURRING"
    ) {
      logUrubutuPayEvent("webhook", "ack_bulk_or_recurring", { callbackType: callbackType ?? "" });
      return NextResponse.json({
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        status: 200,
        message: "successful",
      });
    }

    // Payment callback or notification
    const tx = await prisma.urubutoPayTransaction.findFirst({
      where: prismaTxnMatchOr(refBundle.uniqueValues),
    });

    if (tx) {
      await prisma.urubutoPayTransaction.update({
        where: { id: tx.id },
        data: { status: transactionStatus || tx.status, updatedAt: new Date() },
      }).catch(() => {});
    }

    const isSuccess = transactionStatus !== null && SUCCESS_STATUSES.includes(transactionStatus);
    if (!isSuccess) {
      logUrubutuPayEvent("webhook", "notification_not_final_success", {
        ref,
        transactionStatus: transactionStatus ?? "null",
        dbTxFound: !!tx,
      });
      return NextResponse.json({
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        status: 200,
        data: {
          internal_transaction_id: tx?.transactionId ?? ref,
          external_transaction_id: internalTransactionId ?? ref,
          payer_phone_number: getStr(payload, "payer_phone_number", "phone_number") ?? "",
          payer_email: email ?? tx?.email ?? "",
        },
      });
    }

    const tier = planIdToTier(tx?.planId);
    const phoneOut =
      getStr(payload, "payer_phone_number", "phone_number", "payer_phone", "payerPhone") ?? "";

    // Urubutu often omits email in webhook; if we linked the txn to a user at initiate/upgrade,
    // apply tier without requiring email on the payload.
    if (tx?.userId) {
      await prisma.user
        .update({
          where: { id: tx.userId },
          data: { tier },
        })
        .catch(() => {});

      const linked = await prisma.user.findUnique({
        where: { id: tx.userId },
        select: { email: true },
      });

      logUrubutuPayEvent("webhook", "payment_success_tier_by_tx_user_id", {
        ref,
        tier,
        email: maskEmail(linked?.email ?? undefined),
      });

      const responseEmail =
        linked?.email ?? email ?? tx?.email ?? "";

      return NextResponse.json({
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        status: 200,
        message: "successful",
        data: {
          internal_transaction_id: tx.transactionId ?? ref,
          external_transaction_id: internalTransactionId ?? ref,
          payer_phone_number: phoneOut,
          payer_email: responseEmail,
        },
      });
    }

    const userEmail = email ?? tx?.email ?? null;
    if (!userEmail) {
      console.warn("[webhooks/urubutopay] Success but no email and no txn.userId — cannot match account", {
        ref,
        payloadKeys: Object.keys(payload),
      });
      logUrubutuPayEvent("webhook", "paid_no_email_skip_tier", {
        ref,
        uniqueRefs: refBundle.uniqueValues.join("|"),
      });
      return NextResponse.json({
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        status: 200,
        message: "successful",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail.toLowerCase() },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { tier },
      }).catch(() => {});

      if (tx && !tx.userId) {
        await prisma.urubutoPayTransaction.update({
          where: { id: tx.id },
          data: { userId: user.id, updatedAt: new Date() },
        }).catch(() => {});
      }

      logUrubutuPayEvent("webhook", "payment_success_tier_applied", {
        ref,
        tier,
        email: maskEmail(userEmail),
        linkedNewTxn: !!(tx && !tx.userId),
      });
    } else {
      logUrubutuPayEvent("webhook", "payment_success_unknown_user", {
        ref,
        tier,
        email: maskEmail(userEmail),
      });
    }

    return NextResponse.json({
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      status: 200,
      message: "successful",
      data: {
        internal_transaction_id: tx?.transactionId ?? ref,
        external_transaction_id: internalTransactionId ?? ref,
        payer_phone_number: phoneOut,
        payer_email: userEmail,
      },
    });
  } catch (e) {
    console.error("[webhooks/urubutopay]", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
