import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as jose from "jose";
import { requestAuthorizationMatchesUrubutoApiKey } from "@/lib/urubutopay-request-api-key-match";
import {
  logUrubutuPayEvent,
  logUrubutuPayVerbose,
} from "@/lib/urubutopay-debug-log";

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

/**
 * Payer validation: UrubutoPay sends { merchant_code, payer_code }.
 * Lookup pending INITIATED/PENDING bill for MoMo USSD/app flow.
 */
export async function handleUrubutoPayPayerVerify(request: Request): Promise<Response> {
  try {
    const bearerOk = await verifyBearerToken(request);
    const apiKeyOk = requestAuthorizationMatchesUrubutoApiKey(request);
    if (!bearerOk && !apiKeyOk) {
      logUrubutuPayEvent("payer_verify", "auth_failed", {
        hasAuthHeader: !!request.headers.get("authorization")?.trim(),
      });
      return NextResponse.json(
        {
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
          status: 401,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    logUrubutuPayVerbose("payer_verify", "request_body", body);
    const merchant_code =
      typeof body.merchant_code === "string" ? body.merchant_code.trim() : "";
    const payer_code =
      typeof body.payer_code === "string" ? body.payer_code.trim() : "";

    if (!payer_code) {
      logUrubutuPayEvent("payer_verify", "missing_payer_code", {});
      return NextResponse.json(
        {
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
          status: 400,
          message: "payer_code required",
        },
        { status: 400 }
      );
    }

    const tx = await prisma.urubutoPayTransaction.findFirst({
      where: {
        status: { in: ["INITIATED", "PENDING"] },
        OR: [{ payerCode: payer_code }, { transactionId: payer_code }],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!tx) {
      logUrubutuPayEvent("payer_verify", "no_pending_tx", {
        payerRef: payer_code.slice(0, 40),
      });
      return NextResponse.json(
        {
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
          status: 404,
          message: "no data found for the given payer code",
        },
        { status: 404 }
      );
    }

    logUrubutuPayEvent("payer_verify", "bill_returned", {
      payerRef: payer_code.slice(0, 40),
      amountRwf: tx.amount,
      planId: tx.planId,
    });
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
