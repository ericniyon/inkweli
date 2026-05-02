import crypto from "crypto";
import type { SubscriptionLifecycleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { maskEmail } from "@/lib/urubutopay-debug-log";
import { isPaidUrubutuTransactionStatus } from "@/lib/urubutopay-claim";

const FAILED_TX_STATUSES = [
  "FAILED",
  "failed",
  "CANCELED",
  "CANCELLED",
  "REVERSED",
  "INVALID",
  "DECLINED",
];

function normEmail(e: string | null | undefined): string | null {
  if (!e || typeof e !== "string") return null;
  const t = e.trim().toLowerCase();
  return t.length ? t : null;
}

function verifyPaymentWebhookHmac(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!secret || !signatureHeader) return false;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const expected = "sha256=" + hmac.digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

export function verifyGenericPaymentWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  return verifyPaymentWebhookHmac(rawBody, signatureHeader, secret);
}

export async function findSubscriptionsByRefs(refs: string[]): Promise<
  Array<{
    id: string;
    userId: string;
    planId: string;
    articleId: string | null;
    email: string;
    status: SubscriptionLifecycleStatus;
    paymentReference: string;
  }>
> {
  const uniq = [...new Set(refs.filter(Boolean))];
  if (uniq.length === 0) return [];
  return prisma.subscription.findMany({
    where: { paymentReference: { in: uniq } },
    select: {
      id: true,
      userId: true,
      planId: true,
      articleId: true,
      email: true,
      status: true,
      paymentReference: true,
    },
  });
}

/** Matching row from our initiate flow (merchant ref / payer code / gateway id). */
async function findUrubutuTransactionForWebhookRefs(
  refs: string[]
): Promise<{ status: string } | null> {
  const uniq = [...new Set(refs.filter(Boolean))];
  if (uniq.length === 0) return null;
  return prisma.urubutoPayTransaction.findFirst({
    where: {
      OR: uniq.flatMap((ref) => [
        { transactionId: ref },
        { internalTransactionRef: ref },
        { payerCode: ref },
      ]),
    },
    orderBy: { updatedAt: "desc" },
    select: { status: true },
  });
}

/** Per-article (or explicit story) checkout must activate only with a settled gateway txn row. */
function subscriptionNeedsPaidTxnEvidence(sub: { planId: string; articleId: string | null }): boolean {
  return sub.planId === "plan_per_article" || Boolean(sub.articleId);
}

/** Idempotent subscription + payment ledger updates (webhook source of truth). */
export async function syncSubscriptionLedgerFromWebhook(input: {
  refs: string[];
  success: boolean;
  failedFinal: boolean;
  gateway: string;
  gatewayEmail: string | null;
  payload: Record<string, unknown>;
  /** Primary reference for storing payment row when multiple refs match */
  primaryRef: string;
}): Promise<void> {
  const { refs, success, failedFinal, gateway, gatewayEmail, payload, primaryRef } = input;
  const subscriptions = await findSubscriptionsByRefs(refs);
  if (subscriptions.length === 0) return;

  const gEmail = normEmail(gatewayEmail);
  let cachedTxnPaid: boolean | null = null;
  const txnPaidEvidence = async (): Promise<boolean> => {
    if (cachedTxnPaid !== null) return cachedTxnPaid;
    const row = await findUrubutuTransactionForWebhookRefs(refs);
    cachedTxnPaid = Boolean(row && isPaidUrubutuTransactionStatus(row.status));
    return cachedTxnPaid;
  };

  for (const sub of subscriptions) {
    if (success) {
      if (sub.status === "ACTIVE") {
        continue;
      }

      const storyPurchase = subscriptionNeedsPaidTxnEvidence(sub);
      if (
        storyPurchase &&
        gateway === "urubutopay" &&
        !(await txnPaidEvidence())
      ) {
        console.warn(
          "[subscription-ledger] skip ACTIVE — Urubutu story checkout requires a matching transaction row with paid status",
          { subscriptionId: sub.id, refs: refs.slice(0, 3) }
        );
        continue;
      }

      const expected = normEmail(sub.email);
      if (gEmail && expected && gEmail !== expected) {
        console.warn("[subscription-ledger] gateway email differs from subscription user email — not overriding user_id", {
          paymentReference: sub.paymentReference,
          subscriptionEmail: maskEmail(expected),
          gatewayEmail: maskEmail(gEmail),
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: "ACTIVE" },
        });
        await tx.subscriptionPayment
          .create({
            data: {
              subscriptionId: sub.id,
              gateway,
              reference: primaryRef.slice(0, 512),
              status: "success",
              payload: payload as object,
            },
          })
          .catch(() => {
            /* duplicate gateway+reference: idempotent replay */
          });
      });
      continue;
    }

    if (failedFinal && sub.status === "PENDING") {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "FAILED" },
      });
      await prisma.subscriptionPayment
        .create({
          data: {
            subscriptionId: sub.id,
            gateway,
            reference: primaryRef.slice(0, 512),
            status: "failed",
            payload: payload as object,
          },
        })
        .catch(() => {});
    }
  }
}

export function transactionStatusIndicatesFinalFailure(transactionStatus: string | null): boolean {
  if (transactionStatus == null) return false;
  const u = String(transactionStatus).toUpperCase().trim();
  return FAILED_TX_STATUSES.some((f) => f.toUpperCase() === u);
}
