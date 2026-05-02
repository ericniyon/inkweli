import { prisma } from "@/lib/prisma";
import { getMerchantCode, getTransactionStatus } from "@/lib/urubutopay";

/** Statuses worth refreshing from Urubutu before webhook lands. */
const STALE_GATEWAY_STATUSES = new Set(["INITIATED", "PENDING", "PROCESSING"]);

/**
 * Returns an up-to-date `status`; may call Urubutu transaction/status and persist.
 */
export async function reconcileUrubutoTransactionFromGateway(args: {
  id: string;
  transactionId: string;
  status: string;
}): Promise<string> {
  const u = args.status.trim().toUpperCase();
  if (!STALE_GATEWAY_STATUSES.has(u)) return args.status;

  const merchantCode = getMerchantCode();
  if (!merchantCode) return args.status;

  try {
    const res = await getTransactionStatus({
      merchant_code: merchantCode,
      transaction_id: args.transactionId,
    });
    const next =
      typeof res.data?.transaction_status === "string"
        ? res.data.transaction_status.trim()
        : null;
    if (!next || next === args.status) return args.status;

    await prisma.urubutoPayTransaction.update({
      where: { id: args.id },
      data: { status: next, updatedAt: new Date() },
    });
    return next;
  } catch {
    return args.status;
  }
}

export function gatewayStatusIsTerminal(status: string): boolean {
  const s = status.trim().toUpperCase();
  return ["SUCCESS", "COMPLETED", "VALID", "FAILED", "CANCELED", "REVERSED"].includes(s);
}

export function gatewayStatusIsSuccess(status: string): boolean {
  const s = status.trim().toUpperCase();
  return ["SUCCESS", "COMPLETED", "VALID"].includes(s);
}

export function gatewayStatusIsFailure(status: string): boolean {
  const s = status.trim().toUpperCase();
  return ["FAILED", "CANCELED", "REVERSED"].includes(s);
}
