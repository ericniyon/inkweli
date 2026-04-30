/**
 * UrubutoPay API client (v2).
 * Docs: UrubutoPay Integration Guide – Initiate Payment, Transaction Status, etc.
 */

const STAGING_BASE = "https://staging.urubutopay.rw";
const PRODUCTION_BASE = "https://urubutopay.rw";

export function getBaseUrl(): string {
  const url = process.env.URUBUTOPAY_BASE_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return process.env.NODE_ENV === "production" ? PRODUCTION_BASE : STAGING_BASE;
}

export function getApiKey(): string | undefined {
  return process.env.NODE_ENV === "production"
    ? process.env.URUBUTOPAY_API_KEY_PRODUCTION
    : process.env.URUBUTOPAY_API_KEY_STAGING;
}

export function getMerchantCode(): string | undefined {
  return process.env.URUBUTOPAY_MERCHANT_CODE?.trim();
}

/** Service code for a plan id (from env or fallback). */
export function getServiceCodeForPlan(planId: string): string | undefined {
  const env = process.env;
  if (planId === "plan_annual")
    return env.URUBUTOPAY_SERVICE_CODE_ANNUAL?.trim() || "annual-package-1777494294743";
  if (planId === "plan_per_article")
    return env.URUBUTOPAY_SERVICE_CODE_PER_ARTICLE?.trim() || "per-article-package-1777494222439";
  return undefined;
}

function authHeader(): Record<string, string> {
  const key = getApiKey();
  if (!key) return {};
  return { Authorization: key };
}

export type PaymentChannel = "MOMO" | "AIRTEL_MONEY" | "CARD";

export interface InitiatePaymentParams {
  merchant_code: string;
  payer_code: string;
  payer_names: string;
  payer_email?: string;
  phone_number: string;
  amount: number;
  channel_name: PaymentChannel;
  transaction_id: string;
  service_code: string;
  redirection_url?: string;
}

export interface InitiatePaymentResponse {
  timestamp?: string;
  status: number;
  message?: string;
  card_processing_url?: string;
  url_validity?: string;
  data?: {
    payment_channel: string;
    payment_channel_name: string;
    transaction_status: string;
    internal_transaction_ref_number?: string;
    external_transaction_ref_number?: string;
    transaction_date?: string;
    merchant_code?: string;
    payer_code?: string;
    paid_mount?: number;
    payer_names?: string;
    payer_phone_number?: string;
    currency?: string;
  };
}

export async function initiatePayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResponse> {
  const base = getBaseUrl();
  const url = `${base}/api/v2/payment/initiate`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(params),
  });
  const data = (await res.json().catch(() => ({}))) as InitiatePaymentResponse;
  return { ...data, status: data.status ?? res.status };
}

export interface TransactionStatusParams {
  merchant_code: string;
  transaction_id: string;
}

export interface TransactionStatusResponse {
  timestamp?: string;
  status: number;
  message?: string;
  data?: {
    payment_channel?: string;
    payment_channel_name?: string;
    transaction_status?: string;
    internal_transaction_id?: string;
    transaction_id?: string;
    merchant_code?: string;
    service_code?: string;
    payer_code?: string;
    amount?: number;
    payer_names?: string;
    phone_number?: string;
    currency?: string;
    payment_date_time?: string;
    payer_email?: string;
  };
}

export async function getTransactionStatus(
  params: TransactionStatusParams
): Promise<TransactionStatusResponse> {
  const base = getBaseUrl();
  const url = `${base}/api/v2/payment/transaction/status`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(params),
  });
  const data = (await res.json().catch(() => ({}))) as TransactionStatusResponse;
  return { ...data, status: data.status ?? res.status };
}
