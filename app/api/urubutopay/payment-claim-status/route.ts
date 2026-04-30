import { NextResponse } from "next/server";
import {
  findTransactionByPaymentReference,
  isPaidUrubutuTransactionStatus,
} from "@/lib/urubutopay-claim";

/** Whether a paid payment ref still needs an account linkage (guest success page). */
export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference")?.trim() ?? "";
  if (!reference) {
    return NextResponse.json({ error: "reference required" }, { status: 400 });
  }

  const tx = await findTransactionByPaymentReference(reference);
  if (!tx) {
    return NextResponse.json({
      exists: false,
      paid: false,
      claimed: false,
      needsSignup: false,
    });
  }

  const paid = isPaidUrubutuTransactionStatus(tx.status);
  const claimed = !!tx.userId;

  return NextResponse.json({
    exists: true,
    paid,
    claimed,
    planId: tx.planId,
    needsSignup: paid && !claimed,
  });
}
