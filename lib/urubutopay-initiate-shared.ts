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

function toRwLocalMsisdn(raw: string): string {
  const d = raw.trim().replace(/\D/g, "");
  if (!d) return d;
  if (d.startsWith("250") && d.length >= 12) return `0${d.slice(3)}`;
  if (d.startsWith("7") && d.length === 9) return `0${d}`;
  return d;
}

function getCanonicalGatewayAmount(
  canonicalGatewayPlanId: "plan_annual" | "plan_per_article",
  fallback: number,
): number {
  const envOverrideRaw =
    canonicalGatewayPlanId === "plan_annual"
      ? process.env.URUBUTOPAY_GATEWAY_AMOUNT_ANNUAL?.trim()
      : process.env.URUBUTOPAY_GATEWAY_AMOUNT_PER_ARTICLE?.trim();
  const envOverride =
    envOverrideRaw && /^-?\d+$/.test(envOverrideRaw)
      ? Number.parseInt(envOverrideRaw, 10)
      : NaN;
  if (Number.isFinite(envOverride) && envOverride > 0) return Math.round(envOverride);
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === canonicalGatewayPlanId);
  const preferred =
    typeof plan?.price === "number" && Number.isFinite(plan.price)
      ? Math.round(plan.price)
      : Math.round(fallback);
  return preferred > 0 ? preferred : Math.max(1, Math.round(fallback));
}

function walletInitFailureMessageFromProvider(args: {
  providerError?: string | null;
  providerMessage?: string | null;
  transactionStatus?: string | null;
}): string {
  const raw = `${args.providerError ?? ""} ${args.providerMessage ?? ""} ${args.transactionStatus ?? ""}`
    .trim()
    .toLowerCase();

  if (
    raw.includes("insufficient") ||
    raw.includes("not enough balance") ||
    raw.includes("low balance") ||
    raw.includes("balance too low")
  ) {
    return "Insufficient wallet balance. Please top up and try again.";
  }
  if (
    raw.includes("wrong pin") ||
    raw.includes("invalid pin") ||
    raw.includes("pin failed") ||
    raw.includes("incorrect pin")
  ) {
    return "Incorrect wallet PIN. Please confirm your PIN and try again.";
  }
  if (
    raw.includes("expired") ||
    raw.includes("timeout") ||
    raw.includes("time out") ||
    raw.includes("timed out")
  ) {
    return "Wallet request timed out. Please try again.";
  }
  if (
    raw.includes("rejected") ||
    raw.includes("declined") ||
    raw.includes("cancelled") ||
    raw.includes("canceled")
  ) {
    return "Payment was cancelled or rejected on the wallet side.";
  }
  if (
    raw.includes("not found") ||
    raw.includes("invalid phone") ||
    raw.includes("invalid msisdn") ||
    raw.includes("unknown subscriber")
  ) {
    return "The wallet number is invalid or not active. Please check the number and try again.";
  }
  if (
    raw.includes("network") ||
    raw.includes("operator") ||
    raw.includes("unreachable")
  ) {
    return "Wallet network is temporarily unavailable. Please try again in a moment.";
  }
  return "Mobile wallet prompt was not sent. Please confirm your wallet number/network and wallet balance, then try again.";
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
  const row = await prisma.subscriptionPlan.findUnique({
    where: { id: planIdFromClient },
  });

  // DB is source of truth for editable prices (admin updates /api/subscription-plans).
  if (row) {
    const tierForTransaction = tierFromDbRow(row.tier);
    const intervalLc = row.interval.trim().toLowerCase();
    const canonicalGatewayPlanId =
      intervalLc === "year" || tierForTransaction === "UNLIMITED"
        ? "plan_annual"
        : "plan_per_article";
    return {
      canonicalGatewayPlanId,
      price: row.price,
      currency: "RWF",
      tierForTransaction,
      clientPlanId: planIdFromClient,
    };
  }

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

  /** Aligned with `prisma/seed.ts` — used when the DB isn’t seeded but the UI still uses these ids */
  const SEEDED_FALLBACK: Record<
    string,
    { price: number; tier: SubscriptionTier; interval: string }
  > = {
    plan_novis: { price: 10000, tier: "ONE_ARTICLE", interval: "month" },
    plan_pro: { price: 20000, tier: "TWO_ARTICLES", interval: "month" },
  };

  const rowOrFallback = (() => {
    const fb = SEEDED_FALLBACK[planIdFromClient];
    return fb ? { tier: fb.tier, price: fb.price, interval: fb.interval } : null;
  })();

  if (!rowOrFallback) return { error: "Invalid planId" };

  const tierForTransaction = tierFromDbRow(String(rowOrFallback.tier));

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

/** Single-story checkout must record `article_id`. Monthly tiers (e.g. plan_novis) must not. */
export async function checkoutPlanRequiresLinkedArticle(planId: string): Promise<boolean> {
  const id = planId.trim();
  if (!id) return false;
  if (id === "plan_per_article") return true;
  const row = await prisma.subscriptionPlan.findUnique({
    where: { id },
    select: { interval: true },
  });
  return (row?.interval ?? "").trim().toLowerCase() === "article";
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
  /** Article unlocked by per-article / reader checkout when applicable */
  articleId?: string | null;
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

  // Use single merchant code for both plans
  const finalMerchantCode = merchantCode;

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
  // Align annual with per-article: wallet redirect uses the configured PWL slug for annual only;
  // per-article stays on the literal fallback slug (same as before).
  const redirectPwlSlug =
    canonicalGatewayPlanId === "plan_annual"
      ? pwlSlug
      : "per-article-package-1777494222439";
  const redirectionPwl = `${productionBaseUrl}/pwl/${redirectPwlSlug}?pwlId=${redirectPwlSlug}`;
  const redirectionOutbound =
    args.channelName === "CARD" ? appReturnRedirectionUrl : redirectionPwl;

  const phoneNorm = normalizeRwPayerPhone(args.phoneNumber);
  const phoneLocal = toRwLocalMsisdn(phoneNorm);
  // Gateway products enforce canonical amounts; custom amount is ignored to prevent 409.
  const amt = getCanonicalGatewayAmount(canonicalGatewayPlanId, planPrice);
  const payerEmailStr = typeof args.payerEmail === "string" ? args.payerEmail.trim() : "";
  // Mirror per-article: `paymentLinkId` / `service_code` come from getServiceCodeForPlan +
  // getInitiateGatewayServiceCode (env may set a distinct initiate code, e.g. subscription-xxxx).
  const finalServiceCode = gatewayServiceCode;
  const finalPwlSlug =
    canonicalGatewayPlanId === "plan_per_article"
      ? getServiceCodeForPlan("plan_per_article") || "per-article-package-1777494222439"
      : pwlSlug;

  const params: InitiatePaymentParams = {
    currency: planCurrency || "RWF",
    merchant_code: finalMerchantCode,
    paid_mount: amt,
    payer_code: transactionId,
    payer_email: payerEmailStr,
    payer_names: args.payerName.trim(),
    payer_phone_number: phoneNorm,
    payer_to_be_charged: "YES",
    paymentLinkId: finalPwlSlug,
    ...(configuredPaymentLinkId ? { payment_link_id: configuredPaymentLinkId } : {}),
    payment_channel: paymentChannel,
    payment_channel_name: args.channelName,
    need_instant_wallet_settlement: "YES",
    redirection_url: redirectionOutbound,
    service_code: finalServiceCode,
    phone_number: phoneLocal || phoneNorm,
    amount: amt,
    channel_name: args.channelName,
    transaction_id: transactionId,
    ...(configuredServiceId && configuredServiceId !== finalServiceCode
      ? { service_id: configuredServiceId }
      : {}),
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
      articleId: typeof args.articleId === "string" && args.articleId.trim() ? args.articleId.trim() : null,
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
    const attemptParams: InitiatePaymentParams[] = [params];
    if (gatewayServiceCode && gatewayServiceCode !== finalPwlSlug) {
      attemptParams.push({
        ...params,
        paymentLinkId: finalPwlSlug,
        service_code: finalPwlSlug,
      });
      attemptParams.push({
        ...params,
        paymentLinkId: gatewayServiceCode,
        service_code: gatewayServiceCode,
      });
    }

    let selectedResponse: Awaited<ReturnType<typeof initiatePayment>> | null = null;
    for (let i = 0; i < attemptParams.length; i++) {
      const attempt = attemptParams[i];
      const attemptResponse = await initiatePayment(attempt);
      const providerMessage =
        typeof attemptResponse.message === "string"
          ? attemptResponse.message.toLowerCase()
          : "";
      const success = attemptResponse.status === 200 || attemptResponse.status === 201;
      const transactionStatus =
        typeof attemptResponse.data?.transaction_status === "string"
          ? attemptResponse.data.transaction_status.trim().toUpperCase()
          : "";
      const failedWalletInit =
        (attempt.payment_channel === "WALLET" ||
          args.channelName === "MOMO" ||
          args.channelName === "AIRTEL_MONEY") &&
        transactionStatus === "FAILED";
      if (success) {
        if (failedWalletInit && i + 1 < attemptParams.length) {
          console.warn("[urubutopay:initiate] Wallet returned FAILED on HTTP 200; retrying alternate service mapping", {
            currentServiceCode: attempt.service_code,
            nextServiceCode: attemptParams[i + 1]?.service_code,
          });
          continue;
        }
        selectedResponse = attemptResponse;
        if (i > 0) {
          console.log("[urubutopay:initiate] Recovered with fallback service mapping", {
            originalServiceCode: params.service_code,
            selectedServiceCode: attempt.service_code,
          });
        }
        break;
      }

      const retryable =
        i + 1 < attemptParams.length &&
        (attemptResponse.status === 404 ||
          (attemptResponse.status === 409 &&
            (providerMessage.includes("service not found") ||
              providerMessage.includes("service code does not match") ||
              providerMessage.includes("pay the full amount"))));
      if (!retryable) {
        selectedResponse = attemptResponse;
        break;
      }
    }

    res = selectedResponse ?? (await initiatePayment(params));
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
  const topLevelTransactionStatus =
    typeof (res as { transaction_status?: unknown }).transaction_status === "string"
      ? (res as { transaction_status?: unknown }).transaction_status
      : undefined;
  const transactionStatusRaw =
    typeof data.transaction_status === "string"
      ? data.transaction_status
      : typeof topLevelTransactionStatus === "string"
        ? topLevelTransactionStatus
        : "INITIATED";
  const transactionStatus = transactionStatusRaw.trim().toUpperCase();
  if (transactionStatus === "FAILED") {
    const walletChannel = args.channelName === "MOMO" || args.channelName === "AIRTEL_MONEY";
    const topLevelError =
      typeof (res as { error?: unknown }).error === "string"
        ? (res as { error?: unknown }).error
        : undefined;
    const providerError =
      typeof topLevelError === "string" && topLevelError.trim()
        ? topLevelError.trim()
        : null;
    const providerMessage =
      typeof res.message === "string" && res.message.trim() ? res.message.trim() : null;
    const failureMessage = walletChannel
      ? walletInitFailureMessageFromProvider({
          providerError,
          providerMessage,
          transactionStatus,
        })
      : providerError ||
        providerMessage ||
        "Payment transaction failed. Please check your phone number and try again.";
    logUrubutuPayEvent("initiate", "initiate_failed_status", {
      transactionId,
      detail: failureMessage.slice(0, 200),
      transactionStatus,
    });
    await prisma.urubutoPayTransaction
      .update({
        where: { id: tx.id },
        data: { status: "FAILED" },
      })
      .catch(() => {});
    return {
      ok: false,
      status: 400,
      error:
        walletChannel &&
        failureMessage ===
          "Mobile wallet prompt was not sent. Please confirm your wallet number/network and wallet balance, then try again."
          ? "Payment failed. Please check your wallet balance, then confirm your wallet number/network and try again."
          : failureMessage,
      details: res,
    };
  }
  logUrubutuPayEvent("initiate", "initiate_ok", {
    transactionId,
    internalRef: ((data.internal_transaction_ref_number as string) ?? "").slice(0, 40),
    transactionStatus,
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
    transactionStatus,
    message: res.message,
    cardProcessingUrl,
    urlValidity,
  };
}
