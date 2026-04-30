import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS } from "@/constants";
import { createUrubutuTransactionAndInitiate } from "@/lib/urubutopay-initiate-shared";
import type { PaymentChannel } from "@/lib/urubutopay";

/**
 * Initiates UrubutoPay (POST to https://urubutopay.rw/api/payment/initiate-link-payment via lib/urubutopay).
 *
 * Guest: body uses planId.
 * Logged-in upgrade: body uses plan_id (same shape as legacy /api/subscriptions/initiate); creates pending subscription.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const plan_id_field =
      typeof body.plan_id === "string" ? body.plan_id.trim() : "";
    const planId_field =
      typeof body.planId === "string" ? body.planId.trim() : "";

    const channelName = (typeof body.channelName === "string"
      ? body.channelName.trim().toUpperCase()
      : null) as PaymentChannel | null;
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : null;
    const payerName = typeof body.payerName === "string" ? body.payerName.trim() : null;
    const returnUrl =
      typeof body.returnUrl === "string" && body.returnUrl.trim() ? body.returnUrl.trim() : undefined;

    const session = await getServerSession(authOptions);
    const sessionUserId = session?.userId;

    /** Upgrade: client sends plan_id only (guest checkout uses planId). */
    const subscriptionCheckout = Boolean(sessionUserId && plan_id_field);

    if (subscriptionCheckout) {
      const planId = plan_id_field;

      const payerEmail =
        typeof body.payerEmail === "string" && body.payerEmail.trim()
          ? body.payerEmail.trim()
          : null;

      const planKnown =
        !!SUBSCRIPTION_PLANS.find((p) => p.id === planId) ||
        !!(await prisma.subscriptionPlan.findUnique({
          where: { id: planId },
          select: { id: true },
        }));
      if (!planKnown) {
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
        where: { id: sessionUserId },
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
        payerEmail: payerEmail ?? user.email,
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
    }

    const planId = plan_id_field || planId_field;
    const payerEmail =
      typeof body.payerEmail === "string" && body.payerEmail.trim()
        ? body.payerEmail.trim()
        : null;
    const userId =
      typeof body.userId === "string" && body.userId.trim() ? body.userId.trim() : null;

    if (!sessionUserId && plan_id_field && !planId_field) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

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
