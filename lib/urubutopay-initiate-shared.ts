import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS, URUBUTO_INITIATE_LINK_PAYMENT_URL } from "@/constants";
import type { SubscriptionTier } from "@prisma/client";
import {
  getApiKey,
  getMerchantCode,
  getBaseUrl,
  getServiceCodeForPlan,
  getInitiateGatewayServiceCode,
  initiatePayment,
  type InitiatePaymentParams,
  type PaymentChannel,
} from "@/lib/urubutopay";
import { logUrubutuPayEvent } from "@/lib/urubutopay-debug-log";
import { getAppOrigin } from "@/lib/app-origin";

/** Match Urubutu samples: 2507… or 078… */
function normalizeRwPayerPhone(raw: string): string {
  const d = raw.trim().replace(/\s/g, "");
  if (!d) return d;
  if (d.startsWith("250")) return d;
  if (d.startsWith("0")) return `250${d.slice(1)}`;
  return d;
}

export function planIdToTier(planId: string): SubscriptionTier {
  if (planId === "plan_annual") return "UNLIMITED";
  if (planId === "plan_per_article") return "ONE_ARTICLE";
  return "ONE_ARTICLE";
}

function tierFromDbRow(rawTier: string): SubscriptionTier {
  const u = rawTier.trim().toUpperCase();
  if (
    u === "UNLIMITED" ||
    u === "TWO_ARTICLES" ||
    u === "ONE_ARTICLE" ||
    u === "NONE"
  ) {
    return u as SubscriptionTier;
  }
  return "ONE_ARTICLE";
}

/** Urubutu slug + env keys (`plan_*`) may differ from `SubscriptionPlan.id` (`plan_novis`, …). */
export async function resolveCheckoutPlan(planIdFromClient: string): Promise<
  | {
      canonicalGatewayPlanId: "plan_annual" | "plan_per_article";
      price: number;
      currency: string;
      tierForTransaction: SubscriptionTier;
      clientPlanId: string;
    }
  | { error: string }
> {
  const fromConstants = SUBSCRIPTION_PLANS.find((p) => p.id === planIdFromClient);
  if (fromConstants) {
    const canonicalGatewayPlanId =
      fromConstants.id === "plan_annual" ? "plan_annual" : "plan_per_article";
    return {
      canonicalGatewayPlanId,
      price: fromConstants.price,
      currency: fromConstants.currency || "RWF",
      tierForTransaction: planIdToTier(fromConstants.id),
      clientPlanId: planIdFromClient,
    };
  }

  const row = await prisma.subscriptionPlan.findUnique({
    where: { id: planIdFromClient },
  });

  /** Aligned with `prisma/seed.ts` — used when the DB isn’t seeded but the UI still uses these ids */
  const SEEDED_FALLBACK: Record<
    string,
    { price: number; tier: SubscriptionTier; interval: string }
  > = {
    plan_novis: { price: 10000, tier: "ONE_ARTICLE", interval: "month" },
    plan_pro: { price: 20000, tier: "TWO_ARTICLES", interval: "month" },
  };

  const rowOrFallback =
    row ??
    (() => {
      const fb = SEEDED_FALLBACK[planIdFromClient];
      return fb ? { tier: fb.tier, price: fb.price, interval: fb.interval } : null;
    })();

  if (!rowOrFallback) return { error: "Invalid planId" };

  const tierForTransaction = row
    ? tierFromDbRow(row.tier)
    : tierFromDbRow(String(rowOrFallback.tier));

  const intervalLc = rowOrFallback.interval.trim().toLowerCase();
  const canonicalGatewayPlanId =
    intervalLc === "year" || tierForTransaction === "UNLIMITED"
      ? "plan_annual"
      : "plan_per_article";

  return {
    canonicalGatewayPlanId,
    price: rowOrFallback.price,
    currency: "RWF",
    tierForTransaction,
    clientPlanId: planIdFromClient,
  };
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
  /** Custom amount for the payment (overrides plan price) */
  amount?: number;
}): Promise<InitiateUrubutuResult> {
  const apiKey = getApiKey();
  const merchantCode = getMerchantCode();
  
  if (!apiKey || !merchantCode) {
    return { ok: false, status: 503, error: "UrubutoPay not configured (API key or merchant code)" };
  }

  const resolved = await resolveCheckoutPlan(args.planId);
  if ("error" in resolved) {
    return { ok: false, status: 400, error: resolved.error };
  }

  const { canonicalGatewayPlanId, price: planPrice, currency: planCurrency, tierForTransaction, clientPlanId } =
    resolved;

  // Use plan-specific merchant code if available
  let finalMerchantCode = merchantCode;
  if (canonicalGatewayPlanId === "plan_annual") {
    const annualMerchantCode = process.env.URUBUTOPAY_MERCHANT_CODE_ANNUAL?.trim();
    if (annualMerchantCode) {
      finalMerchantCode = annualMerchantCode;
    }
  }

  const pwlSlug = getServiceCodeForPlan(canonicalGatewayPlanId);
  const gatewayServiceCode = getInitiateGatewayServiceCode(canonicalGatewayPlanId);
  if (!pwlSlug || !gatewayServiceCode) {
    return { ok: false, status: 400, error: "Service codes not configured for this plan" };
  }

  const transactionId =
    args.preassignedTransactionId?.trim() ||
    `ink_${Date.now()}_${randomBytes(4).toString("hex")}`;
  const appUrl = getAppOrigin();
  const defaultReturnUrl = `${appUrl}/membership/success?reference=${encodeURIComponent(transactionId)}`;
  const appReturnRedirectionUrl = args.returnUrl || defaultReturnUrl;
  const paymentChannel: "WALLET" | "CARD" =
    args.channelName === "CARD" ? "CARD" : "WALLET";
  const configuredPaymentLinkId =
    canonicalGatewayPlanId === "plan_annual"
      ? process.env.URUBUTOPAY_PAYMENT_LINK_ID_ANNUAL?.trim()
      : process.env.URUBUTOPAY_PAYMENT_LINK_ID_PER_ARTICLE?.trim();
  const configuredServiceId =
    canonicalGatewayPlanId === "plan_annual"
      ? process.env.URUBUTOPAY_SERVICE_ID_ANNUAL?.trim()
      : process.env.URUBUTOPAY_SERVICE_ID_PER_ARTICLE?.trim();

  console.log("[urubutopay:initiate] Debug config:", {
    canonicalGatewayPlanId,
    configuredPaymentLinkId,
    configuredServiceId,
    envServiceIdPerArticle: process.env.URUBUTOPAY_SERVICE_ID_PER_ARTICLE?.trim(),
    envPaymentLinkIdPerArticle: process.env.URUBUTOPAY_PAYMENT_LINK_ID_PER_ARTICLE?.trim()
  });

  // Use production base URL for wallet payment redirects
  const productionBaseUrl = "https://urubutopay.rw";
  // Use working service code for redirect URL
  const redirectPwlSlug = "per-article-package-1777494222439";
  const redirectionPwl = `${productionBaseUrl}/pwl/${redirectPwlSlug}?pwlId=${redirectPwlSlug}`;
  const redirectionOutbound =
    args.channelName === "CARD" ? appReturnRedirectionUrl : redirectionPwl;

  const phoneNorm = normalizeRwPayerPhone(args.phoneNumber);
  // For plan_per_article, use custom amount if provided, otherwise use plan price
  const amt = args.amount !== undefined ? args.amount : planPrice;
  const payerEmailStr = typeof args.payerEmail === "string" ? args.payerEmail.trim() : "";

  // Use the correct service codes for each plan
  const finalServiceCode = canonicalGatewayPlanId === "plan_annual"
    ? "annual-package-1777494294743"  // Use verified working service code for annual plan
    : gatewayServiceCode; // Use initiate gateway service code for per-article
  const finalPwlSlug = canonicalGatewayPlanId === "plan_per_article"
    ? getServiceCodeForPlan("plan_per_article") || "per-article-package-1777494222439"
    : "annual-package-1777494294743"; // Use verified working service code for annual plan

  const params: InitiatePaymentParams = {
    currency: planCurrency || "RWF",
    merchant_code: finalMerchantCode,
    paid_mount: amt,
    payer_code: transactionId,
    payer_email: payerEmailStr,
    payer_names: args.payerName.trim(),
    payer_phone_number: phoneNorm,
    payer_to_be_charged: "YES",
    payment_channel: paymentChannel,
    payment_channel_name: args.channelName,
    redirection_url: redirectionOutbound,
    service_code: finalServiceCode,
    phone_number: phoneNorm,
    amount: amt,
    channel_name: args.channelName,
    transaction_id: transactionId,
    ...(configuredPaymentLinkId ? { payment_link_id: configuredPaymentLinkId } : {}),
    ...(configuredServiceId ? { service_id: configuredServiceId } : {}),
  };

  const tx = await prisma.urubutoPayTransaction.create({
    data: {
      transactionId,
      payerCode: transactionId,
      userId: args.userId ?? null,
      tier: tierForTransaction,
      planId: clientPlanId,
      amount: planPrice,
      currency: planCurrency || "RWF",
      channel: args.channelName,
      status: "INITIATED",
      payerNames: args.payerName,
      email: args.payerEmail ?? null,
    },
  }).catch(() => null);

  if (!tx) {
    return { ok: false, status: 500, error: "Failed to create transaction record" };
  }

  logUrubutuPayEvent("initiate", "provider_post", {
    transactionId,
    url: URUBUTO_INITIATE_LINK_PAYMENT_URL,
  });

  console.log("[urubutopay:initiate] Sending payload:", JSON.stringify(params, null, 2));

  let res;
  try {
    res = await initiatePayment(params);
    logUrubutuPayEvent("initiate", "provider_response", {
      transactionId,
      planId: canonicalGatewayPlanId,
      channelName: args.channelName,
      httpStatus: res.status,
      message: res.message,
    });
    console.log("[urubutopay:initiate] Provider response:", res);
  } catch (error) {
    console.error("[urubutopay:initiate] API call failed:", error);
    logUrubutuPayEvent("initiate", "api_call_failed", {
      transactionId,
      planId: canonicalGatewayPlanId,
      channelName: args.channelName,
      error: error instanceof Error ? error.message : String(error),
    });
    
    // Re-throw with more context
    throw new Error(`Payment provider API call failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (res.data?.internal_transaction_ref_number) {
    await prisma.urubutoPayTransaction.update({
      where: { id: tx.id },
      data: { internalTransactionRef: res.data.internal_transaction_ref_number },
    }).catch(() => {});
  }

  if (res.status !== 200 && res.status !== 201) {
    const msg = (res as { message?: string }).message ?? "Payment initiation failed";
    logUrubutuPayEvent("initiate", "initiate_failed", {
      transactionId,
      detail: msg.slice(0, 200),
    });
    return {
      ok: false,
      status: res.status >= 400 && res.status < 500 ? res.status : 502,
      error: msg,
      details: res,
    };
  }

  const data = (res.data ?? {}) as Record<string, unknown>;
  logUrubutuPayEvent("initiate", "initiate_ok", {
    transactionId,
    internalRef: ((data.internal_transaction_ref_number as string) ?? "").slice(0, 40),
    transactionStatus:
      typeof data.transaction_status === "string" ? data.transaction_status : "INITIATED",
  });

  const cardProcessingUrl =
    typeof res.card_processing_url === "string" && res.card_processing_url.trim()
      ? res.card_processing_url.trim()
      : null;
  const urlValidity = typeof res.url_validity === "string" ? res.url_validity : null;

  return {
    ok: true,
    transactionId,
    internalTransactionRef: (data.internal_transaction_ref_number as string) ?? null,
    transactionStatus: (data.transaction_status as string) ?? "INITIATED",
    message: res.message,
    cardProcessingUrl,
    urlValidity,
  };
}
