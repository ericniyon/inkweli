/**
 * Smoke test: POST to Urubu initiate-link-payment (same payload shape as checkout).
 * Run: npx tsx scripts/test-payment-100.ts
 *
 * Optional env:
 *   TEST_PAYMENT_AMOUNT=10   (defaults to plan price from constants)
 *   TEST_PAYMENT_PHONE=0788616703
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { SUBSCRIPTION_PLANS, URUBUTO_INITIATE_LINK_PAYMENT_URL } from "../constants";
import {
  initiatePayment,
  getApiKey,
  getMerchantCode,
  getServiceCodeForPlan,
  getInitiateGatewayServiceCode,
  getBaseUrl,
} from "../lib/urubutopay";

function loadEnvFile(filename: string) {
  const p = join(process.cwd(), filename);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

function loadDotenv() {
  if (!existsSync(join(process.cwd(), ".env")))
    throw new Error("Missing .env in project root");
  loadEnvFile(".env");
  loadEnvFile(".env.local");
}

function normalizeRwPayerPhone(raw: string): string {
  const d = raw.trim().replace(/\s/g, "");
  if (!d) return d;
  if (d.startsWith("250")) return d;
  if (d.startsWith("0")) return `250${d.slice(1)}`;
  return d;
}

const planId = "plan_per_article";

async function main() {
  loadDotenv();
  const prisma = new PrismaClient();

  const apiKey = getApiKey();
  const merchantCode = getMerchantCode();
  const pwlSlug = getServiceCodeForPlan(planId);
  const gatewaySvc = getInitiateGatewayServiceCode(planId);
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  if (!apiKey || !merchantCode || !pwlSlug || !gatewaySvc || !plan) {
    console.error(
      "Missing URUBUTOPAY_API_KEY_*, URUBUTOPAY_MERCHANT_CODE, plan, or service codes"
    );
    process.exit(1);
  }

  const configuredPaymentLinkId =
    process.env.URUBUTOPAY_PAYMENT_LINK_ID_PER_ARTICLE?.trim();
  const configuredServiceId = process.env.URUBUTOPAY_SERVICE_ID_PER_ARTICLE?.trim();

  const phone = process.env.TEST_PAYMENT_PHONE?.trim() || "0788616703";
  const amountEnv = process.env.TEST_PAYMENT_AMOUNT?.trim();
  const amt =
    amountEnv !== undefined && amountEnv !== "" && Number.isFinite(Number(amountEnv))
      ? Math.max(0, Math.round(Number(amountEnv)))
      : plan.price;

  const transactionId = `ink_test_${Date.now()}_${randomBytes(4).toString("hex")}`;
  const phoneNorm = normalizeRwPayerPhone(phone);
  const pwlRedirect = `${getBaseUrl()}/pwl/${pwlSlug}?pwlId=${pwlSlug}`;

  await prisma.urubutoPayTransaction.create({
    data: {
      transactionId,
      payerCode: transactionId,
      tier: "ONE_ARTICLE",
      planId,
      amount: amt,
      currency: "RWF",
      channel: "MOMO",
      status: "INITIATED",
      payerNames: "Inkwell test",
      email: null,
    },
  });

  const params = {
    currency: plan.currency || "RWF",
    merchant_code: merchantCode,
    paid_mount: amt,
    payer_code: transactionId,
    payer_email: "",
    payer_names: "Inkwell test",
    payer_phone_number: phoneNorm,
    payer_to_be_charged: "YES" as const,
    paymentLinkId: pwlSlug,
    payment_channel: "WALLET" as const,
    payment_channel_name: "MOMO" as const,
    redirection_url: pwlRedirect,
    service_code: gatewaySvc,
    phone_number: phoneNorm,
    amount: amt,
    channel_name: "MOMO" as const,
    transaction_id: transactionId,
    ...(configuredPaymentLinkId ? { payment_link_id: configuredPaymentLinkId } : {}),
    ...(configuredServiceId ? { service_id: configuredServiceId } : {}),
  };

  console.log("POST UrubutuPay initiate-link-payment...", {
    url: URUBUTO_INITIATE_LINK_PAYMENT_URL,
    transactionId,
    amountRwf: amt,
    phone: `${phoneNorm.slice(0, 4)}***`,
  });

  const result = await initiatePayment(params);
  console.log("Response:", JSON.stringify(result, null, 2));

  await prisma.$disconnect();
  const ok = result.status === 200 || result.status === 201;
  process.exit(ok ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
