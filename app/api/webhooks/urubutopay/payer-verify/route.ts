import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as jose from "jose";

async function verifyBearerToken(request: Request): Promise<boolean> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice(7);
  const secret = process.env.URUBUTOPAY_WEBHOOK_JWT_SECRET;
  if (!secret) return false;
  try {
    await jose.jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

/** Fallback when portal has no Auth URL: accept API key */
function verifyApiKey(request: Request): boolean {
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const apiKey =
    process.env.NODE_ENV === "production"
      ? process.env.URUBUTOPAY_API_KEY_PRODUCTION
      : process.env.URUBUTOPAY_API_KEY_STAGING;
  if (!apiKey) return false;
  return auth === apiKey || auth === `Bearer ${apiKey}`;
}

/**
 * Payer validation: UrubutoPay sends { merchant_code, payer_code }.
 * We look up a pending transaction by payer_code (our transaction_id)
 * and return bill details so they can show the correct amount/name.
 */
export async function POST(request: Request) {
  try {
    if (!(await verifyBearerToken(request)) && !verifyApiKey(request)) {
      return NextResponse.json(
        { timestamp: new Date().toISOString().replace("T", " ").slice(0, 19), status: 401, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const merchant_code = typeof body.merchant_code === "string" ? body.merchant_code.trim() : "";
    const payer_code = typeof body.payer_code === "string" ? body.payer_code.trim() : "";

    if (!payer_code) {
      return NextResponse.json(
        { timestamp: new Date().toISOString().replace("T", " ").slice(0, 19), status: 400, message: "payer_code required" },
        { status: 400 }
      );
    }

    const tx = await prisma.urubutoPayTransaction.findFirst({
      where: {
        status: { in: ["INITIATED", "PENDING"] },
        OR: [
          { payerCode: payer_code },
          { transactionId: payer_code },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!tx) {
      return NextResponse.json(
        { timestamp: new Date().toISOString().replace("T", " ").slice(0, 19), status: 404, message: "no data found for the given payer code" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 200,
      message: "validated successfully",
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      data: {
        merchant_code: merchant_code || process.env.URUBUTOPAY_MERCHANT_CODE || "",
        payer_code: tx.payerCode ?? tx.transactionId,
        payer_names: tx.payerNames || "Payer",
        amount: tx.amount,
        currency: tx.currency || "RWF",
        payer_must_pay_total_amount: "YES",
        comment: `Membership: ${tx.planId}`,
      },
    });
  } catch (e) {
    console.error("[webhooks/urubutopay/payer-verify]", e);
    return NextResponse.json(
      { message: "Internal server error", status: 500 },
      { status: 500 }
    );
  }
}
