import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS } from "@/constants";
import { createUrubutuTransactionAndInitiate } from "@/lib/urubutopay-initiate-shared";
import type { PaymentChannel } from "@/lib/urubutopay";

/** Authenticated checkout: pending subscription row + UrubutoPay (activation only via webhook). */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const plan_id = typeof body.plan_id === "string" ? body.plan_id.trim() : "";
    const planIdCompat = typeof body.planId === "string" ? body.planId.trim() : "";
    const planId = plan_id || planIdCompat;

    const channelName = (typeof body.channelName === "string"
      ? body.channelName.trim().toUpperCase()
      : null) as PaymentChannel | null;
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : null;
    const payerName = typeof body.payerName === "string" ? body.payerName.trim() : null;
    const returnUrl =
      typeof body.returnUrl === "string" && body.returnUrl.trim() ? body.returnUrl.trim() : undefined;

    if (!planId) {
      return NextResponse.json({ error: "plan_id is required" }, { status: 400 });
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan_id" }, { status: 400 });
    }

    if (!channelName || !phoneNumber || !payerName) {
      return NextResponse.json(
        { error: "channelName, phoneNumber, and payerName are required" },
        { status: 400 }
      );
    }

    if (!["MOMO", "AIRTEL_MONEY", "CARD"].includes(channelName)) {
      return NextResponse.json(
        { error: "channelName must be MOMO, AIRTEL_MONEY, or CARD" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const paymentReference = `ink_${Date.now()}_${randomBytes(4).toString("hex")}`;

    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId,
        email: user.email.toLowerCase(),
        status: "PENDING",
        paymentReference,
      },
    });

    const result = await createUrubutuTransactionAndInitiate({
      planId,
      channelName,
      phoneNumber,
      payerName,
      payerEmail: user.email,
      returnUrl,
      userId: user.id,
      preassignedTransactionId: paymentReference,
    });

    if (!result.ok) {
      await prisma.subscription.deleteMany({ where: { paymentReference } }).catch(() => {});
      await prisma.urubutoPayTransaction
        .deleteMany({ where: { transactionId: paymentReference } })
        .catch(() => {});
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.status }
      );
    }

    return NextResponse.json({
      payment_reference: result.transactionId,
      checkout_url: result.cardProcessingUrl,
      internal_transaction_ref: result.internalTransactionRef,
      transaction_status: result.transactionStatus,
      message: result.message,
      url_validity: result.urlValidity,
    });
  } catch (e) {
    console.error("[subscriptions/initiate]", e);
    return NextResponse.json(
      { error: "Could not start subscription checkout" },
      { status: 500 }
    );
  }
}
