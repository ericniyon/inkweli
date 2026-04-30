/**
 * One-off: initiate 100 RWF MoMo test (not wired to the app UI).
 * Run: npx tsx scripts/test-payment-100.ts
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import {
  initiatePayment,
  getApiKey,
  getMerchantCode,
  getServiceCodeForPlan,
} from "../lib/urubutopay";

function loadDotenv() {
  const p = join(process.cwd(), ".env");
  if (!existsSync(p)) throw new Error("Missing .env in project root");
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

const phone = "0788616703";
const amount = 100;
const planId = "plan_per_article";

async function main() {
  loadDotenv();
  const prisma = new PrismaClient();

  const apiKey = getApiKey();
  const merchantCode = getMerchantCode();
  const serviceCode = getServiceCodeForPlan(planId);
  if (!apiKey || !merchantCode || !serviceCode) {
    console.error("Missing URUBUTOPAY_API_KEY_*, URUBUTOPAY_MERCHANT_CODE, or service codes");
    process.exit(1);
  }

  const transactionId = `ink_test_${Date.now()}_${randomBytes(4).toString("hex")}`;

  await prisma.urubutoPayTransaction.create({
    data: {
      transactionId,
      payerCode: transactionId,
      tier: "ONE_ARTICLE",
      planId,
      amount,
      currency: "RWF",
      channel: "MOMO",
      status: "INITIATED",
      payerNames: "Inkwell test",
      email: null,
    },
  });

  const params = {
    merchant_code: merchantCode,
    payer_code: transactionId,
    payer_names: "Inkwell test",
    phone_number: phone,
    amount,
    channel_name: "MOMO" as const,
    transaction_id: transactionId,
    service_code: serviceCode,
  };

  console.log("Calling UrubutoPay initiate...", {
    base: process.env.URUBUTOPAY_BASE_URL?.trim() || "(default by NODE_ENV)",
    transactionId,
    amountRwf: amount,
    phone: `${phone.slice(0, 4)}***`,
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
