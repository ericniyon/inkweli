import { randomBytes } from "crypto";
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
import { logUrubutuPayEvent } from "@/lib/urubutopay-debug-log";
import { getAppOrigin } from "@/lib/app-origin";

export function planIdToTier(planId: string): SubscriptionTier {
  if (planId === "plan_annual") return "UNLIMITED";
  if (planId === "plan_per_article") return "ONE_ARTICLE";
  return "ONE_ARTICLE";
}

export type InitiateUrubutuResult =
  | {
      ok: true;
      transactionId: string;
      internalTransactionRef: string | null;
      transactionStatus: string;
      message?: string;
      cardProcessingUrl: string | null;
      urlValidity: string | null;
    }
  | { ok: false; status: number; error: string; details?: unknown };

/**
 * Shared UrubutoPay initiate flow: persists UrubutoPayTransaction (optional subscription row created by caller).
 */
export async function createUrubutuTransactionAndInitiate(args: {
  planId: string;
  channelName: PaymentChannel;
  phoneNumber: string;
  payerName: string;
  payerEmail?: string | null;
  /** Full URL UrubutoPay uses after CARD checkout */
  returnUrl?: string;
  /** When set, webhook can apply tier without email match */
  userId?: string | null;
  /** When set, must match pending subscription payment_reference */
  preassignedTransactionId?: string | null;
}): Promise<InitiateUrubutuResult> {
  const apiKey = getApiKey();
  const merchantCode = getMerchantCode();
  if (!apiKey || !merchantCode) {
    return { ok: false, status: 503, error: "UrubutoPay not configured (API key or merchant code)" };
  }

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === args.planId);
  if (!plan) {
    return { ok: false, status: 400, error: "Invalid planId" };
  }

  const serviceCode = getServiceCodeForPlan(args.planId);
  if (!serviceCode) {
    return { ok: false, status: 400, error: "Service code not configured for this plan" };
  }

  const transactionId =
    args.preassignedTransactionId?.trim() ||
    `ink_${Date.now()}_${randomBytes(4).toString("hex")}`;
  const appUrl = getAppOrigin();
  const defaultReturnUrl = `${appUrl}/membership/success?reference=${encodeURIComponent(transactionId)}`;
  const redirectionUrl = args.returnUrl || defaultReturnUrl;
  const paymentChannel: "WALLET" | "CARD" =
    args.channelName === "CARD" ? "CARD" : "WALLET";
  const paymentLinkUrl = `https://urubutopay.rw/pwl/${encodeURIComponent(serviceCode)}?pwlId=${encodeURIComponent(serviceCode)}`;
  const configuredPaymentLinkId =
    args.planId === "plan_annual"
      ? process.env.URUBUTOPAY_PAYMENT_LINK_ID_ANNUAL?.trim()
      : process.env.URUBUTOPAY_PAYMENT_LINK_ID_PER_ARTICLE?.trim();
  const configuredServiceId =
    args.planId === "plan_annual"
      ? process.env.URUBUTOPAY_SERVICE_ID_ANNUAL?.trim()
      : process.env.URUBUTOPAY_SERVICE_ID_PER_ARTICLE?.trim();

  const params = {
    merchant_code: merchantCode,
    payer_code: transactionId,
    payer_names: args.payerName,
    payer_email: args.payerEmail ?? undefined,
    phone_number: args.phoneNumber,
    payer_phone_number: args.phoneNumber,
    amount: plan.price,
    paid_mount: plan.price,
    currency: plan.currency || "RWF",
    channel_name: args.channelName,
    payment_channel: paymentChannel,
    payment_channel_name: args.channelName,
    payer_to_be_charged: "YES" as const,
    paymentLinkId: serviceCode,
    payment_link_id: configuredPaymentLinkId || undefined,
    service_id: configuredServiceId || undefined,
    transaction_id: transactionId,
    service_code: serviceCode,
    redirection_url: args.channelName === "CARD" ? redirectionUrl : paymentLinkUrl,
  };

  const tx = await prisma.urubutoPayTransaction.create({
    data: {
      transactionId,
      payerCode: transactionId,
      userId: args.userId ?? null,
      tier: planIdToTier(args.planId),
      planId: args.planId,
      amount: plan.price,
      currency: plan.currency || "RWF",
      channel: args.channelName,
      status: "INITIATED",
      payerNames: args.payerName,
      email: args.payerEmail ?? null,
    },
  }).catch(() => null);

  if (!tx) {
    return { ok: false, status: 500, error: "Failed to create transaction record" };
  }

  const result = await initiatePayment(params);

  logUrubutuPayEvent("initiate", "provider_response", {
    transactionId,
    planId: args.planId,
    channelName: args.channelName,
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
    return {
      ok: false,
      status: result.status >= 400 && result.status < 500 ? result.status : 502,
      error: msg,
      details: result,
    };
  }

  const data = (result.data ?? {}) as Record<string, unknown>;
  logUrubutuPayEvent("initiate", "initiate_ok", {
    transactionId,
    internalRef: ((data.internal_transaction_ref_number as string) ?? "").slice(0, 40),
    transactionStatus:
      typeof data.transaction_status === "string" ? data.transaction_status : "INITIATED",
  });

  const cardProcessingUrl =
    typeof result.card_processing_url === "string" && result.card_processing_url.trim()
      ? result.card_processing_url.trim()
      : null;
  const urlValidity = typeof result.url_validity === "string" ? result.url_validity : null;

  return {
    ok: true,
    transactionId,
    internalTransactionRef: (data.internal_transaction_ref_number as string) ?? null,
    transactionStatus: (data.transaction_status as string) ?? "INITIATED",
    message: result.message,
    cardProcessingUrl,
    urlValidity,
  };
}
