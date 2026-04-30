import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS } from "@/constants";
import type { SubscriptionTier } from "@prisma/client";
import {
  getApiKey,
  getMerchantCode,
  getServiceCodeForPlan,
  initiatePayment,
  type PaymentChannel,
} from "@/lib/urubutopay";
import { randomBytes } from "crypto";
import { logUrubutuPayEvent } from "@/lib/urubutopay-debug-log";
import { getAppOrigin } from "@/lib/app-origin";

function planIdToTier(planId: string): SubscriptionTier {
  if (planId === "plan_annual") return "UNLIMITED";
  if (planId === "plan_per_article") return "ONE_ARTICLE";
  return "ONE_ARTICLE";
}

/**
 * Initiate UrubutoPay v2 payment.
 * Body: { planId, channelName, phoneNumber, payerName, payerEmail?, returnUrl? }
 * - channelName: "MOMO" | "AIRTEL_MONEY" | "CARD"
 * - returnUrl: used for CARD redirect after payment
 */
export async function POST(request: Request) {
  try {
    const apiKey = getApiKey();
    const merchantCode = getMerchantCode();
    if (!apiKey || !merchantCode) {
      return NextResponse.json(
        { error: "UrubutoPay not configured (API key or merchant code)" },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const planId = typeof body.planId === "string" ? body.planId.trim() : null;
    const channelName = (typeof body.channelName === "string" ? body.channelName.trim().toUpperCase() : null) as PaymentChannel | null;
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : null;
    const payerName = typeof body.payerName === "string" ? body.payerName.trim() : null;
    const payerEmail = typeof body.payerEmail === "string" ? body.payerEmail.trim() : undefined;
    const returnUrl = typeof body.returnUrl === "string" ? body.returnUrl.trim() : undefined;

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

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid planId" }, { status: 400 });
    }

    const serviceCode = getServiceCodeForPlan(planId);
    if (!serviceCode) {
      return NextResponse.json(
        { error: "Service code not configured for this plan" },
        { status: 400 }
      );
    }

    const transactionId = `ink_${Date.now()}_${randomBytes(4).toString("hex")}`;
    const appUrl = getAppOrigin();
    const defaultReturnUrl = `${appUrl}/membership/success?reference=${encodeURIComponent(transactionId)}`;
    const redirectionUrl = returnUrl || defaultReturnUrl;

    const params = {
      merchant_code: merchantCode,
      payer_code: transactionId,
      payer_names: payerName,
      payer_email: payerEmail,
      phone_number: phoneNumber,
      amount: plan.price,
      channel_name: channelName,
      transaction_id: transactionId,
      service_code: serviceCode,
      ...(channelName === "CARD" && { redirection_url: redirectionUrl }),
    };

    const tx = await prisma.urubutoPayTransaction.create({
      data: {
        transactionId,
        payerCode: transactionId,
        tier: planIdToTier(planId),
        planId,
        amount: plan.price,
        currency: plan.currency || "RWF",
        channel: channelName,
        status: "INITIATED",
        payerNames: payerName,
        email: payerEmail ?? null,
      },
    }).catch(() => null);

    if (!tx) {
      return NextResponse.json(
        { error: "Failed to create transaction record" },
        { status: 500 }
      );
    }

    const result = await initiatePayment(params);

    logUrubutuPayEvent("initiate", "provider_response", {
      transactionId,
      planId,
      channelName,
      httpStatus: result.status,
      message: typeof result.message === "string" ? result.message.slice(0, 200) : "",
    });

    if (result.data?.internal_transaction_ref_number) {
      await prisma.urubutoPayTransaction.update({
        where: { id: tx.id },
        data: { internalTransactionRef: result.data.internal_transaction_ref_number },
      }).catch(() => {});
    }

    if (result.status !== 200 && result.status !== 201) {
      const msg = (result as { message?: string }).message ?? "Payment initiation failed";
      logUrubutuPayEvent("initiate", "initiate_failed", {
        transactionId,
        detail: msg.slice(0, 200),
      });
      return NextResponse.json(
        { error: msg, details: result },
        { status: result.status >= 400 && result.status < 500 ? result.status : 502 }
      );
    }

    const data = (result.data ?? {}) as Record<string, unknown>;
    logUrubutuPayEvent("initiate", "initiate_ok", {
      transactionId,
      internalRef: ((data.internal_transaction_ref_number as string) ?? "").slice(0, 40),
      transactionStatus:
        typeof data.transaction_status === "string" ? data.transaction_status : "INITIATED",
    });
    return NextResponse.json({
      transactionId,
      internalTransactionRef: data.internal_transaction_ref_number ?? null,
      transactionStatus: (data.transaction_status as string) ?? "INITIATED",
      message: result.message,
      cardProcessingUrl: result.card_processing_url ?? null,
      urlValidity: result.url_validity ?? null,
    });
  } catch (e) {
    console.error("[urubutopay/initiate]", e);
    return NextResponse.json(
      { error: "Payment initiation failed" },
      { status: 500 }
    );
  }
}
