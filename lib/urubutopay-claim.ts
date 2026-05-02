import type { SubscriptionTier, UrubutoPayTransaction } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const PAID_TRANSACTION_STATUSES = [
  "VALID",
  "success",
  "completed",
  "paid",
  "SUCCESS",
  "COMPLETED",
  "PAID",
] as const;

/** Normalized Urubutu gateway values that mean money settled / access may be granted. */
const PAID_TRANSACTION_STATUSES_NORMALIZED = new Set(
  PAID_TRANSACTION_STATUSES.map((s) => s.toUpperCase())
);

/** True only when the gateway reports a successful payment (case-insensitive). */
export function isPaidUrubutuTransactionStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return PAID_TRANSACTION_STATUSES_NORMALIZED.has(status.trim().toUpperCase());
}

export function planIdToSubscriptionTier(planId: string | null | undefined): SubscriptionTier {
  if (planId === "plan_annual") return "UNLIMITED";
  if (planId === "plan_per_article") return "ONE_ARTICLE";
  return "NONE";
}

export async function findTransactionByPaymentReference(
  reference: string
): Promise<UrubutoPayTransaction | null> {
  const ref = reference.trim();
  if (!ref) return null;
  return prisma.urubutoPayTransaction.findFirst({
    where: {
      OR: [
        { transactionId: ref },
        { internalTransactionRef: ref },
        { payerCode: ref },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

function emailMatchesTxn(userEmail: string, tx: UrubutoPayTransaction): boolean {
  const onFile = tx.email?.trim().toLowerCase();
  if (!onFile) return true;
  return onFile === userEmail.trim().toLowerCase();
}

/**
 * Link a paid, unclaimed transaction to a user and apply tier from txn planId.
 */
export async function claimPaidTransactionForUser(params: {
  reference: string;
  userId: string;
  userEmail: string;
}): Promise<{ ok: true; tier: SubscriptionTier } | { ok: false; code: string; message: string }> {
  const { reference, userId, userEmail } = params;
  const tx = await findTransactionByPaymentReference(reference);
  if (!tx) {
    return { ok: false, code: "NOT_FOUND", message: "Payment reference not found" };
  }
  if (!isPaidUrubutuTransactionStatus(tx.status)) {
    return { ok: false, code: "NOT_PAID", message: "Payment is not completed yet" };
  }
  if (tx.userId === userId) {
    const tier = planIdToSubscriptionTier(tx.planId);
    await prisma.user
      .update({ where: { id: userId }, data: { tier } })
      .catch(() => {});
    return { ok: true, tier };
  }
  if (tx.userId && tx.userId !== userId) {
    return { ok: false, code: "ALREADY_CLAIMED", message: "This payment is linked to another account" };
  }
  if (!emailMatchesTxn(userEmail, tx)) {
    return { ok: false, code: "EMAIL_MISMATCH", message: "Use the same email you used when paying" };
  }

  const tier = planIdToSubscriptionTier(tx.planId);
  const emailLower = userEmail.trim().toLowerCase();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { tier },
    }),
    prisma.urubutoPayTransaction.update({
      where: { id: tx.id },
      data: {
        userId,
        email: tx.email ?? emailLower,
        updatedAt: new Date(),
      },
    }),
  ]);

  return { ok: true, tier };
}
