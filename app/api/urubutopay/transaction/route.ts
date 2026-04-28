import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiKey, getMerchantCode, getTransactionStatus } from "@/lib/urubutopay";

/**
 * Verify transaction status with UrubutoPay.
 * POST body: { transactionId: string } or { merchant_code, transaction_id }
 * Query or body transactionId can be our external ref or UrubutoPay internal ref.
 */
export async function POST(request: Request) {
  try {
    const apiKey = getApiKey();
    const merchantCode = getMerchantCode();
    if (!apiKey || !merchantCode) {
      return NextResponse.json(
        { error: "UrubutoPay not configured" },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const transactionId =
      typeof body.transactionId === "string"
        ? body.transactionId.trim()
        : typeof body.transaction_id === "string"
          ? body.transaction_id.trim()
          : null;

    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId or transaction_id required" },
        { status: 400 }
      );
    }

    const result = await getTransactionStatus({
      merchant_code: merchantCode,
      transaction_id: transactionId,
    });

    if (result.status !== 200) {
      return NextResponse.json(
        { error: (result as { message?: string }).message ?? "Transaction not found", status: result.status },
        { status: result.status === 404 ? 404 : 502 }
      );
    }

    const data = result.data;
    if (data?.transaction_status) {
      await prisma.urubutoPayTransaction
        .updateMany({
          where: {
            OR: [{ transactionId }, { internalTransactionRef: transactionId }],
          },
          data: { status: data.transaction_status, updatedAt: new Date() },
        })
        .catch(() => {});
    }

    return NextResponse.json({
      transactionId: data?.transaction_id ?? transactionId,
      internalTransactionId: data?.internal_transaction_id,
      status: data?.transaction_status,
      amount: data?.amount,
      currency: data?.currency,
      payerCode: data?.payer_code,
      paymentChannel: data?.payment_channel,
      paymentChannelName: data?.payment_channel_name,
      paymentDateTime: data?.payment_date_time,
    });
  } catch (e) {
    console.error("[urubutopay/transaction]", e);
    return NextResponse.json(
      { error: "Failed to get transaction status" },
      { status: 500 }
    );
  }
}

/** GET with ?reference= or ?transaction_id= for convenience */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") ?? searchParams.get("transaction_id");
  if (!reference) {
    return NextResponse.json(
      { error: "Missing reference or transaction_id" },
      { status: 400 }
    );
  }
  return POST(
    new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({ transactionId: reference }),
    })
  );
}
