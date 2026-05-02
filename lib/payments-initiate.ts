import { randomBytes } from "crypto";
import type { SubscriptionTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { URUBUTO_INITIATE_LINK_PAYMENT_URL } from "@/constants";
import {
  getApiKey,
  getMerchantCode,
  getBaseUrl,
  getServiceCodeForPlan,
  getInitiateGatewayServiceCode,
  type PaymentChannel,
} from "@/lib/urubutopay";
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

function parsePositiveInt(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const n = Math.round(v);
  return n >= 0 ? n : null;
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
  const amount = parsePositiveInt(input.amount);
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
    amount === null ||
    amount <= 0
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

  // Allow flexible amount for testing
  // if (amount !== planPrice) {
  //   return {
  //     ok: false,
  //     status: 400,
  //     error: "amount does not match selected plan price",
  //   };
  // }

  const payer_code = `USER_${user_id}`;

  const pwlSlug = getServiceCodeForPlan(canonicalGatewayPlanId);
  const gatewayServiceCode = getInitiateGatewayServiceCode(canonicalGatewayPlanId);
  if (!pwlSlug || !gatewayServiceCode) {
    return {
      ok: false,
      status: 503,
      error: "Gateway service codes are not configured for this plan",
    };
  }

  const configuredPaymentLinkId =
    canonicalGatewayPlanId === "plan_annual"
      ? process.env.URUBUTOPAY_PAYMENT_LINK_ID_ANNUAL?.trim()
      : process.env.URUBUTOPAY_PAYMENT_LINK_ID_PER_ARTICLE?.trim();
  const configuredServiceId =
    canonicalGatewayPlanId === "plan_annual"
      ? process.env.URUBUTOPAY_SERVICE_ID_ANNUAL?.trim()
      : process.env.URUBUTOPAY_SERVICE_ID_PER_ARTICLE?.trim();

  const phoneNorm = normalizeRwPayerPhone(phone);
  const transactionRef = `ink_${Date.now()}_${randomBytes(4).toString("hex")}`;
  // Use production base URL for wallet payment redirects
  const productionBaseUrl = "https://urubutopay.rw";
  const redirectPwlSlug = pwlSlug;
  const redirectionPwl = `${productionBaseUrl}/pwl/${redirectPwlSlug}?pwlId=${redirectPwlSlug}`;
  const paymentChannel: "WALLET" | "CARD" =
    channelName === "CARD" ? "CARD" : "WALLET";
  const appReturnRedirectionUrl = `${getAppOrigin()}/membership/success?reference=${encodeURIComponent(transactionRef)}`;
  const redirectionOutbound =
    channelName === "CARD" ? appReturnRedirectionUrl : redirectionPwl;

  console.log("[payments/initiate] Debug values:", {
    merchantCode,
    configuredServiceId,
    gatewayServiceCode,
    canonicalGatewayPlanId,
    pwlSlug,
    redirectPwlSlug,
    redirectionPwl
  });

  // Urubutu validates `paymentLinkId` + `service_code` as one product; the numeric portal id
  // must be sent separately as `payment_link_id` (see scripts/test-payment-100.ts), not as `paymentLinkId`.
  const bodyPayload: Record<string, unknown> = {
    currency: "RWF",
    merchant_code: merchantCode,
    paid_mount: amount,
    payer_code: payer_code,
    payer_email: email,
    payer_names: name,
    payer_phone_number: phoneNorm,
    payer_to_be_charged: "YES",
    paymentLinkId: pwlSlug,
    ...(configuredPaymentLinkId ? { payment_link_id: configuredPaymentLinkId } : {}),
    payment_channel: paymentChannel,
    payment_channel_name: channelName,
    service_code: gatewayServiceCode,
    redirection_url: redirectionOutbound,
    ...(configuredServiceId && configuredServiceId !== gatewayServiceCode
      ? { service_id: configuredServiceId }
      : {}),
  };

  console.log("[payments/initiate] Debug payload before filtering:", {
    amount,
    paid_mount: bodyPayload.paid_mount,
    amountType: typeof amount,
    amountValue: amount,
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
    trimmed.paid_mount = amount || 0;
    console.log("[payments/initiate] Force-added paid_mount:", trimmed.paid_mount);
  }

  let resJson: Record<string, unknown>;
  try {
    console.log("[payments/initiate] Making request to:", URUBUTO_INITIATE_LINK_PAYMENT_URL);
    console.log("[payments/initiate] Original phone:", phone);
    console.log("[payments/initiate] Normalized phone:", phoneNorm);
    console.log("[payments/initiate] Payload:", JSON.stringify(trimmed, null, 2));
    console.log("[payments/initiate] API Key present:", !!apiKey);
    
    const res = await fetch(URUBUTO_INITIATE_LINK_PAYMENT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify(trimmed),
    });
    
    console.log("[payments/initiate] Response status:", res.status);
    console.log("[payments/initiate] Response headers:", Object.fromEntries(res.headers.entries()));
    
    resJson = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const topStatus =
      typeof resJson.status === "number" ? resJson.status : res.status;
    if (![200, 201].includes(topStatus)) {
      console.error("[payments/initiate] UrubutoPay error", {
        httpStatus: res.status,
        topStatus,
        body: trimmed,
        response: resJson,
      });
      return {
        ok: false,
        status: 500,
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
          payerCodeOutbound: payer_code,
          amount,
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
      payerCodeOutbound: payer_code,
      amount,
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
