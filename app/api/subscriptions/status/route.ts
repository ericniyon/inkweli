import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const referenceRaw = searchParams.get("reference")?.trim();
    if (!referenceRaw) {
      return NextResponse.json({ error: "reference is required" }, { status: 400 });
    }

    const [subscription, transaction] = await Promise.all([
      prisma.subscription.findUnique({
        where: { paymentReference: referenceRaw },
        select: {
          status: true,
          planId: true,
          paymentReference: true,
          updatedAt: true,
        },
      }),
      prisma.urubutoPayTransaction.findFirst({
        where: {
          OR: [
            { transactionId: referenceRaw },
            { internalTransactionRef: referenceRaw },
            { payerCode: referenceRaw },
          ],
        },
        select: {
          transactionId: true,
          status: true,
          planId: true,
        },
      }),
    ]);

    return NextResponse.json({
      reference: referenceRaw,
      subscription_status: subscription?.status ?? null,
      plan_id: subscription?.planId ?? transaction?.planId ?? null,
      transaction_status: transaction?.status ?? null,
    });
  } catch (e) {
    console.error("[subscriptions/status]", e);
    return NextResponse.json({ error: "Status lookup failed" }, { status: 500 });
  }
}
