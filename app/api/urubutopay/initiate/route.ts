import { NextResponse } from "next/server";
import { createUrubutuTransactionAndInitiate } from "@/lib/urubutopay-initiate-shared";
import type { PaymentChannel } from "@/lib/urubutopay";

/**
 * Initiate UrubutoPay v2 payment (guest or legacy callers).
 * Body: { planId, channelName, phoneNumber, payerName, payerEmail?, returnUrl?, userId? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const planId = typeof body.planId === "string" ? body.planId.trim() : null;
    const channelName = (typeof body.channelName === "string"
      ? body.channelName.trim().toUpperCase()
      : null) as PaymentChannel | null;
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : null;
    const payerName = typeof body.payerName === "string" ? body.payerName.trim() : null;
    const payerEmail =
      typeof body.payerEmail === "string" && body.payerEmail.trim() ? body.payerEmail.trim() : null;
    const returnUrl =
      typeof body.returnUrl === "string" && body.returnUrl.trim() ? body.returnUrl.trim() : undefined;
    const userId =
      typeof body.userId === "string" && body.userId.trim() ? body.userId.trim() : null;

    if (!planId || !channelName || !phoneNumber || !payerName) {
      return NextResponse.json(
        { error: "planId, channelName, phoneNumber, and payerName are required" },
        { status: 400 }
      );
    }

    if (!["MOMO", "AIRTEL_MONEY", "CARD"].includes(channelName)) {
      return NextResponse.json(
        { error: "channelName must be MOMO, AIRTEL_MONEY, or CARD" },
        { status: 400 }
      );
    }

    const result = await createUrubutuTransactionAndInitiate({
      planId,
      channelName,
      phoneNumber,
      payerName,
      payerEmail,
      returnUrl,
      userId,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.status }
      );
    }

    return NextResponse.json({
      transactionId: result.transactionId,
      internalTransactionRef: result.internalTransactionRef,
      transactionStatus: result.transactionStatus,
      message: result.message,
      cardProcessingUrl: result.cardProcessingUrl,
      urlValidity: result.urlValidity,
    });
  } catch (e) {
    console.error("[urubutopay/initiate]", e);
    return NextResponse.json(
      { error: "Payment initiation failed" },
      { status: 500 }
    );
  }
}
