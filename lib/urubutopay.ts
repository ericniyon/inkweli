/**
 * UrubutoPay API client (v2).
 * Docs: UrubutoPay Integration Guide – Initiate Payment, Transaction Status, etc.
 */

const STAGING_BASE = "https://staging.urubutopay.rw";
const PRODUCTION_BASE = "https://urubutopay.rw";

/**
 * Prefer env base URL when set so production deploy can point at staging (or vice versa)
 * without NODE_ENV hacks. Aligns initiate + webhook API-key matching + HMAC secrets.
 */
export function urubutuPayUsesLiveGateway(): boolean {
  const configured = process.env.URUBUTOPAY_BASE_URL?.trim().toLowerCase() ?? "";
  if (configured.includes("staging.")) return false;
  if (configured.includes("urubutopay.rw") && !configured.includes("staging"))
    return true;
  return process.env.NODE_ENV === "production";
}

export function getBaseUrl(): string {
  const url = process.env.URUBUTOPAY_BASE_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return urubutuPayUsesLiveGateway() ? PRODUCTION_BASE : STAGING_BASE;
}

export function getApiKey(): string | undefined {
  const prod = process.env.URUBUTOPAY_API_KEY_PRODUCTION?.trim();
  const staging = process.env.URUBUTOPAY_API_KEY_STAGING?.trim();
  const generic = process.env.URUBUTOPAY_API_KEY?.trim();
  if (urubutuPayUsesLiveGateway()) return prod || generic;
  return staging || generic;
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
  payer_phone_number?: string;
  amount: number;
  paid_mount?: number;
  currency?: string;
  channel_name: PaymentChannel;
  payment_channel?: "WALLET" | "CARD";
  payment_channel_name?: PaymentChannel;
  payer_to_be_charged?: "YES" | "NO";
  paymentLinkId?: string;
  payment_link_id?: string;
  service_id?: string;
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

const INITIATE_LINK_PAYMENT_URL =
  "https://urubutopay.rw/api/payment/initiate-link-payment";

export async function initiatePayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResponse> {
  const url = INITIATE_LINK_PAYMENT_URL;
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
