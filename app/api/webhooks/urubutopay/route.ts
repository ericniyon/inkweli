import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SubscriptionTier } from "@prisma/client";
import * as jose from "jose";
import crypto from "crypto";

const VALID_STATUS = "VALID";
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

/** Fallback when portal has no Auth URL: accept if they send the same API key we use for API calls */
function verifyApiKey(request: Request): boolean {
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const apiKey =
    process.env.NODE_ENV === "production"
      ? process.env.URUBUTOPAY_API_KEY_PRODUCTION
      : process.env.URUBUTOPAY_API_KEY_STAGING;
  if (!apiKey) return false;
  return auth === apiKey || auth === `Bearer ${apiKey}`;
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

function getNum(p: Payload, key: string): number | null {
  const v = p[key];
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureHeader =
      request.headers.get("x-urubutopay-signature") ?? request.headers.get("X-UrubutoPay-Signature") ?? null;
    const webhookSecret =
      process.env.NODE_ENV === "production"
        ? process.env.URUBUTOPAY_WEBHOOK_SECRET_PRODUCTION
        : process.env.URUBUTOPAY_WEBHOOK_SECRET_STAGING;

    const validBearer = await verifyBearerToken(request);
    const validSig = verifySignature(rawBody, signatureHeader, webhookSecret ?? undefined);
    const validApiKey = verifyApiKey(request);

    if (!validBearer && !(webhookSecret && validSig) && !validApiKey) {
      console.warn("[webhooks/urubutopay] Invalid or missing auth (Bearer, signature, or API key)");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: Payload;
    try {
      payload = JSON.parse(rawBody) as Payload;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const callbackType = getStr(payload, "callback_type", "callbackType");
    const transactionStatus = getStr(payload, "transaction_status", "transactionStatus");
    const transactionId = getStr(payload, "transaction_id", "transactionId");
    const internalTransactionId = getStr(payload, "internal_transaction_id", "internalTransactionId");
    const payerCode = getStr(payload, "payer_code", "payerCode");
    const merchantCode = getStr(payload, "merchant_code", "merchantCode");
    const amount = getNum(payload, "amount");
    const email = getStr(
      payload,
      "payer_email",
      "payerEmail",
      "email",
      "customer_email",
      "customerEmail"
    );

    const ref = transactionId || internalTransactionId || payerCode;
    if (!ref) {
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
    }

    // Reversal / canceled
    if (
      callbackType === "REVERSAL" ||
      transactionStatus === "CANCELED" ||
      transactionStatus === "REVERSED" ||
      String(transactionStatus).toUpperCase() === "CANCELED"
    ) {
      const updated = await prisma.urubutoPayTransaction.updateMany({
        where: {
          OR: [
            { transactionId: ref },
            { internalTransactionRef: ref },
            { payerCode: ref },
          ],
        },
        data: { status: "CANCELED", updatedAt: new Date() },
      });
      if (updated.count > 0) {
        const tx = await prisma.urubutoPayTransaction.findFirst({
          where: {
            OR: [
              { transactionId: ref },
              { internalTransactionRef: ref },
              { payerCode: ref },
            ],
          },
        });
        if (tx?.userId) {
          await prisma.user.update({
            where: { id: tx.userId },
            data: { tier: "NONE" },
          }).catch(() => {});
        }
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
      return NextResponse.json({
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        status: 200,
        message: "successful",
      });
    }

    // Payment callback or notification
    const tx = await prisma.urubutoPayTransaction.findFirst({
      where: {
        OR: [
          { transactionId: ref },
          { internalTransactionRef: ref },
          { payerCode: ref },
        ],
      },
    });

    if (tx) {
      await prisma.urubutoPayTransaction.update({
        where: { id: tx.id },
        data: { status: transactionStatus || tx.status, updatedAt: new Date() },
      }).catch(() => {});
    }

    const isSuccess = transactionStatus !== null && SUCCESS_STATUSES.includes(transactionStatus);
    if (!isSuccess) {
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
    const userEmail = email ?? tx?.email ?? null;
    if (!userEmail) {
      console.warn("[webhooks/urubutopay] Success but no email", { ref, payload: Object.keys(payload) });
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
    }

    return NextResponse.json({
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      status: 200,
      message: "successful",
      data: {
        internal_transaction_id: tx?.transactionId ?? ref,
        external_transaction_id: internalTransactionId ?? ref,
        payer_phone_number: getStr(payload, "payer_phone_number", "phone_number") ?? "",
        payer_email: userEmail,
      },
    });
  } catch (e) {
    console.error("[webhooks/urubutopay]", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
