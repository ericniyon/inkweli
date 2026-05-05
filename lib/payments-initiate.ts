import { randomBytes } from "crypto";
import type { SubscriptionTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getApiKey,
  getMerchantCode,
  getBaseUrl,
  getServiceCodeForPlan,
  getInitiateGatewayServiceCode,
  type PaymentChannel,
} from "@/lib/urubutopay";
import { SUBSCRIPTION_PLANS } from "@/constants";
import { getAppOrigin } from "@/lib/app-origin";
import {
  resolveCheckoutPlan,
  checkoutPlanRequiresLinkedArticle,
} from "@/lib/urubutopay-initiate-shared";

function isUniqueConstraintError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "P2002"
  );
}

/**
 * After Urubutu accept-link-payment: mirror pending rows used by `/api/urubutopay/initiate`:
 * Payment + UrubutoPayTransaction (webhook tier + status polling), plus Subscription when unlocking one story.
 */
async function persistInitiateCheckoutSnapshot(args: {
  userId: string;
  email: string;
  name: string;
  planId: string;
  payerCodeOutbound: string;
  amount: number;
  paymentReferenceRaw: string;
  channelName: PaymentChannel;
  tierForTransaction: SubscriptionTier;
  articleIdForPayment: string | null;
  linkStorySubscription: boolean;
}): Promise<void> {
  const ref = args.paymentReferenceRaw.trim().slice(0, 512);
  try {
    await prisma.payment.create({
      data: {
        userId: args.userId,
        planId: args.planId,
        articleId: args.articleIdForPayment,
        payerCode: args.payerCodeOutbound.slice(0, 512),
        paymentReference: ref,
        amount: args.amount,
        status: "pending",
      },
    });
  } catch (e) {
    if (!isUniqueConstraintError(e)) throw e;
  }

  try {
    await prisma.urubutoPayTransaction.create({
      data: {
        transactionId: ref,
        internalTransactionRef: null,
        userId: args.userId,
        email: args.email.toLowerCase(),
        tier: args.tierForTransaction,
        planId: args.planId,
        amount: args.amount,
        currency: "RWF",
        channel: args.channelName,
        status: "INITIATED",
        payerNames: args.name.slice(0, 512),
        payerCode: args.payerCodeOutbound.slice(0, 512),
        articleId: args.articleIdForPayment,
      },
    });
  } catch (e) {
    if (!isUniqueConstraintError(e)) throw e;
  }

  if (args.linkStorySubscription && args.articleIdForPayment) {
    try {
      await prisma.subscription.create({
        data: {
          userId: args.userId,
          planId: args.planId,
          articleId: args.articleIdForPayment,
          email: args.email.toLowerCase(),
          status: "PENDING",
          paymentReference: ref,
        },
      });
    } catch (e) {
      if (!isUniqueConstraintError(e)) throw e;
    }
  }
}

/** Match Urubutu samples: 2507… or 078… */
function normalizeRwPayerPhone(raw: string): string {
  const d = raw.trim().replace(/\s/g, "");
  if (!d) return d;
  if (d.startsWith("250")) return d;
  if (d.startsWith("0")) return `250${d.slice(1)}`;
  return d;
}

/** Some wallet rails expect local MSISDN (07...) for handset prompt fields. */
function toRwLocalMsisdn(raw: string): string {
  const d = raw.trim().replace(/\D/g, "");
  if (!d) return d;
  if (d.startsWith("250") && d.length >= 12) return `0${d.slice(3)}`;
  if (d.startsWith("7") && d.length === 9) return `0${d}`;
  return d;
}

function parsePositiveInt(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const n = Math.round(v);
  return n >= 0 ? n : null;
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

export type PaymentsInitiateResult =
  | { ok: true; payment_url: string; payment_reference: string }
  | { ok: false; status: number; error: string; details?: unknown };

/**
 * Validates body, POSTs initiate-link-payment (server-side), persists pending `payments` row,
 * returns hosted payment URL for client redirect.
 */
export async function initiateSubscriptionPaymentViaGateway(input: {
  plan_id: string;
  amount: number;
  user_id: string;
  email: string;
  name: string;
  phone: string;
  /** Wallet: MOMO / AIRTEL_MONEY — hosted card checkout: CARD (omit → MOMO) */
  channelName?: string;
  /** Story being unlocked when purchasing plan_per_article from the reader */
  article_id?: string | null;
}): Promise<PaymentsInitiateResult> {
  const plan_id = input.plan_id.trim();
  const user_id = input.user_id.trim();
  const email = input.email.trim();
  const name = input.name.trim();
  const phone = input.phone.trim();
  const requestedAmount = parsePositiveInt(input.amount);
  const candidate =
    typeof input.channelName === "string" && input.channelName.trim()
      ? input.channelName.trim().toUpperCase()
      : "MOMO";
  const channelName: PaymentChannel | null =
    candidate === "MOMO" || candidate === "AIRTEL_MONEY" || candidate === "CARD"
      ? candidate
      : null;
  if (!channelName) {
    return {
      ok: false,
      status: 400,
      error: "channelName must be MOMO, AIRTEL_MONEY, or CARD",
    };
  }

  let articleIdForPayment: string | null = null;
  const articleRaw =
    typeof input.article_id === "string" ? input.article_id.trim() : "";
  if (articleRaw) {
    const articleRow = await prisma.article.findUnique({
      where: { id: articleRaw },
      select: { id: true },
    });
    articleIdForPayment = articleRow?.id ?? null;
  }

  if (
    !plan_id ||
    !user_id ||
    !email ||
    !name ||
    !phone ||
    requestedAmount === null ||
    requestedAmount <= 0
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "plan_id, amount (positive number), user_id, email, name, and phone are required",
    };
  }

  const apiKey = getApiKey();
  const merchantCode = getMerchantCode();
  if (!apiKey || !merchantCode) {
    return {
      ok: false,
      status: 503,
      error: "Payment gateway not configured (API key or merchant code)",
    };
  }

  const resolved = await resolveCheckoutPlan(plan_id);
  if ("error" in resolved) {
    return { ok: false, status: 400, error: resolved.error };
  }

  const {
    canonicalGatewayPlanId,
    price: planPrice,
    tierForTransaction,
  } = resolved;

  if ((await checkoutPlanRequiresLinkedArticle(plan_id)) && !articleIdForPayment) {
    return {
      ok: false,
      status: 400,
      error:
        "article_id is required for per-article checkout. Open the story you want and pay from that article page.",
    };
  }

  // Charge the gateway product's canonical amount to avoid provider 409
  // ("Please pay the full amount") when DB/admin prices diverge.
  const amountToCharge = getCanonicalGatewayAmount(canonicalGatewayPlanId, planPrice);

  let pwlSlug = getServiceCodeForPlan(canonicalGatewayPlanId);
  let gatewayServiceCode = getInitiateGatewayServiceCode(canonicalGatewayPlanId);
  
  // Use correct per-article service code from environment
  if (canonicalGatewayPlanId === "plan_per_article") {
    console.log("[payments/initiate] Using correct per-article service code from environment");
    // The getInitiateGatewayServiceCode will now return subscription-9644 from env var
  }
  if (!pwlSlug || !gatewayServiceCode) {
    return {
      ok: false,
      status: 503,
      error: "Gateway service codes are not configured for this plan",
    };
  }
  const primaryServiceCode = pwlSlug;

  const phoneNorm = normalizeRwPayerPhone(phone);
  const phoneLocal = toRwLocalMsisdn(phoneNorm);
  const walletMsisdn = phoneNorm;
  const transactionRef = `ink_${Date.now()}_${randomBytes(4).toString("hex")}`;
  const initiateUrl = `${getBaseUrl()}/api/payment/initiate-link-payment`;
  const productionInitiateUrl =
    "https://urubutopay.rw/api/payment/initiate-link-payment";
  const productionApiKey =
    process.env.URUBUTOPAY_API_KEY_PRODUCTION?.trim() ||
    process.env.URUBUTOPAY_API_KEY?.trim() ||
    process.env.URUBUTO_API_KEY?.trim() ||
    apiKey;
  // Use production base URL for wallet payment redirects
  const productionBaseUrl = "https://urubutopay.rw";
  const redirectPwlSlug = pwlSlug;
  const redirectionPwl = `${productionBaseUrl}/pwl/${redirectPwlSlug}?pwlId=${redirectPwlSlug}`;
  const paymentChannel: "WALLET" | "CARD" =
    channelName === "CARD" ? "CARD" : "WALLET";
  let configuredPaymentLinkId =
    canonicalGatewayPlanId === "plan_annual"
      ? process.env.URUBUTOPAY_PAYMENT_LINK_ID_ANNUAL?.trim()
      : process.env.URUBUTOPAY_PAYMENT_LINK_ID_PER_ARTICLE?.trim();
  let configuredServiceId =
    canonicalGatewayPlanId === "plan_annual"
      ? process.env.URUBUTOPAY_SERVICE_ID_ANNUAL?.trim()
      : process.env.URUBUTOPAY_SERVICE_ID_PER_ARTICLE?.trim();
  
  // Use per-article configuration from environment variables
  if (canonicalGatewayPlanId === "plan_per_article") {
    console.log("[payments/initiate] Using per-article configuration from environment");
    // Keep original per-article configuration - no workaround needed
  }
  const appReturnRedirectionUrl = `${getAppOrigin()}/membership/success?reference=${encodeURIComponent(transactionRef)}`;
  const redirectionOutbound =
    channelName === "CARD" ? appReturnRedirectionUrl : redirectionPwl;

  console.log("[payments/initiate] Debug values:", {
    merchantCode,
    gatewayServiceCode,
    canonicalGatewayPlanId,
    pwlSlug,
    redirectPwlSlug,
    redirectionPwl,
    planPrice,
    amountToCharge,
    requestedAmount,
    plan_id,
    configuredPaymentLinkId,
    configuredServiceId,
    primaryServiceCode
  });

  // Urubutu validates `paymentLinkId` + `service_code` as one product; the numeric portal id
  // must be sent separately as `payment_link_id` (see scripts/test-payment-100.ts), not as `paymentLinkId`.
  const bodyPayload: Record<string, unknown> = {
    currency: "RWF",
    merchant_code: merchantCode,
    paid_mount: amountToCharge,
    payer_code: transactionRef,
    payer_email: email,
    payer_names: name,
    payer_phone_number: paymentChannel === "WALLET" ? walletMsisdn : phoneNorm,
    payer_to_be_charged: "YES",
    paymentLinkId: pwlSlug,
    payment_channel: paymentChannel,
    payment_channel_name: channelName,
    need_instant_wallet_settlement: "YES",
    // Some wallet providers require these legacy fields to trigger handset prompt.
    phone_number: phoneLocal || walletMsisdn,
    amount: amountToCharge,
    channel_name: channelName,
    transaction_id: transactionRef,
    service_code: gatewayServiceCode,
    redirection_url: redirectionOutbound,
    ...(configuredPaymentLinkId ? { payment_link_id: configuredPaymentLinkId } : {}),
    ...(configuredServiceId ? { service_id: configuredServiceId } : {}),
  };

  console.log("[payments/initiate] Debug payload before filtering:", {
    amountToCharge,
    paid_mount: bodyPayload.paid_mount,
    requestedAmountType: typeof requestedAmount,
    requestedAmountValue: requestedAmount,
    bodyPayloadKeys: Object.keys(bodyPayload),
    bodyPayloadPaidMount: bodyPayload.paid_mount
  });

  const trimmed = Object.fromEntries(
    Object.entries(bodyPayload).filter(([k, v]) => {
      // Never filter out paid_mount - it's required by the payment provider
      if (k === 'paid_mount') return true;
      // Filter out other undefined/empty values
      return v !== undefined && v !== "";
    })
  );

  console.log("[payments/initiate] Debug payload after filtering:", {
    trimmedKeys: Object.keys(trimmed),
    trimmedPaidMount: trimmed.paid_mount,
    hasPaidMount: 'paid_mount' in trimmed
  });

  // Ensure paid_mount is always present and valid
  if (!('paid_mount' in trimmed) || trimmed.paid_mount === undefined || trimmed.paid_mount === null) {
    trimmed.paid_mount = amountToCharge || 0;
    console.log("[payments/initiate] Force-added paid_mount:", trimmed.paid_mount);
  }

  let resJson: Record<string, unknown> = {};
  let topStatus = 500;
  try {
    console.log("[payments/initiate] Making request to:", initiateUrl);
    console.log("[payments/initiate] Original phone:", phone);
    console.log("[payments/initiate] Normalized phone:", phoneNorm);
    console.log("[payments/initiate] Plan Type:", canonicalGatewayPlanId);
    console.log("[payments/initiate] Expected Amount:", planPrice);
    console.log("[payments/initiate] Actual Amount Being Sent:", trimmed.paid_mount);
    console.log("[payments/initiate] Payload:", JSON.stringify(trimmed, null, 2));
    console.log("[payments/initiate] API Key present:", !!apiKey);

    const payloadAttempts: Array<Record<string, unknown>> = [trimmed];
    if (gatewayServiceCode && gatewayServiceCode !== primaryServiceCode) {
      // Some Urubuto setups require paymentLinkId and service_code to be the same product key.
      // Try canonical slug pairing when env override points to a different product.
      payloadAttempts.push({
        ...trimmed,
        paymentLinkId: primaryServiceCode,
        service_code: primaryServiceCode,
      });
      payloadAttempts.push({
        ...trimmed,
        paymentLinkId: gatewayServiceCode,
        service_code: gatewayServiceCode,
      });
    }

    const runProviderAttempts = async (url: string, authKey: string) => {
      for (let i = 0; i < payloadAttempts.length; i++) {
        const attemptPayload = payloadAttempts[i];
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authKey,
          },
          body: JSON.stringify(attemptPayload),
        });

        console.log("[payments/initiate] Response status:", res.status);
        console.log("[payments/initiate] Response headers:", Object.fromEntries(res.headers.entries()));

        resJson = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        topStatus = typeof resJson.status === "number" ? resJson.status : res.status;
        const nestedData =
          typeof resJson.data === "object" &&
          resJson.data !== null &&
          !Array.isArray(resJson.data)
            ? (resJson.data as Record<string, unknown>)
            : null;
        const transactionStatusRaw =
          typeof nestedData?.transaction_status === "string"
            ? nestedData.transaction_status
            : typeof resJson.transaction_status === "string"
              ? resJson.transaction_status
              : "";
        const transactionStatus = transactionStatusRaw.trim().toUpperCase();
        const walletAttempt =
          (attemptPayload.payment_channel === "WALLET" ||
            paymentChannel === "WALLET") &&
          (attemptPayload.payment_channel_name === "MOMO" ||
            attemptPayload.payment_channel_name === "AIRTEL_MONEY" ||
            channelName === "MOMO" ||
            channelName === "AIRTEL_MONEY");
        const failedWalletInit = walletAttempt && transactionStatus === "FAILED";
        if ([200, 201].includes(topStatus)) {
          if (failedWalletInit && i + 1 < payloadAttempts.length) {
            console.warn("[payments/initiate] Wallet returned FAILED on HTTP 200; retrying alternate service mapping", {
              currentServiceCode:
                typeof attemptPayload.service_code === "string"
                  ? attemptPayload.service_code
                  : "(missing)",
              nextServiceCode:
                typeof payloadAttempts[i + 1]?.service_code === "string"
                  ? payloadAttempts[i + 1].service_code
                  : "(missing)",
            });
            continue;
          }
          if (i > 0) {
            console.log("[payments/initiate] Succeeded with alternate service_code", {
              primaryServiceCode,
              alternateServiceCode: gatewayServiceCode,
            });
          }
          return true;
        }
        const providerMessage =
          typeof resJson.message === "string" ? resJson.message.toLowerCase() : "";
        const shouldTryNextLocalAttempt =
          i + 1 < payloadAttempts.length &&
          (topStatus === 404 ||
            (topStatus === 409 &&
              (providerMessage.includes("service not found") ||
                providerMessage.includes("service code does not match") ||
                providerMessage.includes("pay the full amount"))));
        if (shouldTryNextLocalAttempt) {
          console.warn("[payments/initiate] Retrying with alternate service_code after 404 service not found", {
            currentServiceCode:
              typeof attemptPayload.service_code === "string"
                ? attemptPayload.service_code
                : "(missing)",
            nextServiceCode:
              typeof payloadAttempts[i + 1]?.service_code === "string"
                ? payloadAttempts[i + 1].service_code
                : "(missing)",
          });
          continue;
        }
        break;
      }
      return false;
    };

    let success = await runProviderAttempts(initiateUrl, apiKey);
    const providerMessage =
      typeof resJson.message === "string" ? resJson.message.toLowerCase() : "";
    const merchantNotFound = topStatus === 404 && providerMessage.includes("merchant not found");
    const onStaging = initiateUrl.includes("staging.");
    if (!success && merchantNotFound && onStaging && productionApiKey) {
      console.warn("[payments/initiate] Retrying on production after staging merchant not found", {
        stagingUrl: initiateUrl,
        productionUrl: productionInitiateUrl,
      });
      success = await runProviderAttempts(productionInitiateUrl, productionApiKey);
    }

    if (!success) {
      console.error("[payments/initiate] UrubutoPay error", {
        topStatus,
        body: trimmed,
        response: resJson,
      });
      return {
        ok: false,
        status: topStatus,
        error: "Payment provider rejected the initiation request",
        details: resJson,
      };
    }
  } catch (e) {
    console.error("[payments/initiate] UrubutoPay fetch failed", e);
    return {
      ok: false,
      status: 500,
      error: "Could not reach payment provider",
      details: e instanceof Error ? e.message : undefined,
    };
  }

  const message = typeof resJson.message === "string" ? resJson.message : "";

  const data =
    typeof resJson.data === "object" &&
    resJson.data !== null &&
    !Array.isArray(resJson.data)
      ? (resJson.data as Record<string, unknown>)
      : null;

  // Check transaction status first
  const transactionStatus = data?.transaction_status || resJson.transaction_status;
  if (transactionStatus === "FAILED") {
    const walletChannel = channelName === "MOMO" || channelName === "AIRTEL_MONEY";
    if (walletChannel) {
      const providerError =
        typeof resJson.error === "string" && resJson.error.trim() ? resJson.error.trim() : null;
      const providerMessage =
        typeof resJson.message === "string" && resJson.message.trim() ? resJson.message.trim() : null;
      const failureMessage = walletInitFailureMessageFromProvider({
        providerError,
        providerMessage,
        transactionStatus:
          typeof transactionStatus === "string" ? transactionStatus : String(transactionStatus),
      });
      console.error("[payments/initiate] Wallet initiation failed (no handset prompt)", {
        message,
        transactionStatus,
        response: resJson,
        failureMessage,
      });
      return {
        ok: false,
        status: 400,
        error:
          failureMessage ===
          "Mobile wallet prompt was not sent. Please confirm your wallet number/network and wallet balance, then try again."
            ? "Payment failed. Please check your wallet balance, then confirm your wallet number/network and try again."
            : failureMessage,
        details: resJson,
      };
    }
    if (!walletChannel) {
      console.error("[payments/initiate] Payment transaction failed", {
        message,
        transactionStatus,
        response: resJson,
      });
      return {
        ok: false,
        status: 400,
        error: "Payment transaction failed. Please check your phone number and try again.",
        details: resJson,
      };
    }
  }

  let paymentLinkRaw: string | null =
    typeof resJson.card_processing_url === "string"
      ? resJson.card_processing_url.trim()
      : null;
  if (!paymentLinkRaw && data) {
    if (typeof data.payment_link === "string") paymentLinkRaw = data.payment_link.trim();
    else if (typeof data.paymentLink === "string") paymentLinkRaw = data.paymentLink.trim();
  }

  const payment_reference =
    (data &&
      typeof data.payment_reference === "string" &&
      data.payment_reference.trim()) ||
    (data &&
      typeof (data.external_transaction_ref_number as string) === "string" &&
      (data.external_transaction_ref_number as string).trim()) ||
    (typeof (resJson.payment_reference as string) === "string"
      ? (resJson.payment_reference as string).trim()
      : "") ||
    transactionRef;

  // For wallet payments, sometimes no payment link is returned for successful initiation
  // Instead, user completes payment on their phone
  if (!paymentLinkRaw?.trim()) {
    // For MOMO/AIRTEL_MONEY wallet payments, return success without payment link
    if (channelName === "MOMO" || channelName === "AIRTEL_MONEY") {
      console.log("[payments/initiate] Wallet payment initiated - no redirect URL needed", {
        transactionStatus,
        payment_reference,
        message,
      });
      const linkStorySub =
        Boolean(articleIdForPayment) &&
        (await checkoutPlanRequiresLinkedArticle(plan_id));
      try {
        await persistInitiateCheckoutSnapshot({
          userId: user_id,
          email,
          name,
          planId: plan_id,
          payerCodeOutbound: transactionRef,
          amount: amountToCharge,
          paymentReferenceRaw: payment_reference,
          channelName,
          tierForTransaction,
          articleIdForPayment,
          linkStorySubscription: linkStorySub,
        });
      } catch (e) {
        console.error("[payments/initiate] Failed to persist checkout snapshot (wallet)", e);
        return {
          ok: false,
          status: 500,
          error: "Could not record pending payment",
        };
      }
      return { ok: true, payment_url: "", payment_reference };
    }
    
    console.error("[payments/initiate] Missing payment link in provider response", {
      message,
      response: resJson,
    });
    return {
      ok: false,
      status: 500,
      error: "Payment link was not returned by the provider",
      details: resJson,
    };
  }

  const payment_url = paymentLinkRaw.trim();

  const linkStorySub =
    Boolean(articleIdForPayment) &&
    (await checkoutPlanRequiresLinkedArticle(plan_id));

  try {
    await persistInitiateCheckoutSnapshot({
      userId: user_id,
      email,
      name,
      planId: plan_id,
      payerCodeOutbound: transactionRef,
      amount: amountToCharge,
      paymentReferenceRaw: payment_reference,
      channelName,
      tierForTransaction,
      articleIdForPayment,
      linkStorySubscription: linkStorySub,
    });
  } catch (e) {
    console.error("[payments/initiate] Failed to insert pending checkout records", e);
    return {
      ok: false,
      status: 500,
      error: "Could not record pending payment",
    };
  }

  return { ok: true, payment_url, payment_reference };
}
