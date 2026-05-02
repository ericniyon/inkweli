import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reconcileUrubutoTransactionFromGateway } from "@/lib/urubutopay-gateway-reconcile";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId") || searchParams.get("reference");
    
    if (!transactionId) {
      return NextResponse.json(
        { error: "Missing transactionId parameter" },
        { status: 400 }
      );
    }

    // First check our database
    const transaction = await prisma.urubutoPayTransaction.findFirst({
      where: {
        OR: [
          { transactionId },
          { internalTransactionRef: transactionId },
        ],
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const status = await reconcileUrubutoTransactionFromGateway({
      id: transaction.id,
      transactionId: transaction.transactionId,
      status: transaction.status,
    });
    const message = "Payment status retrieved";

    return NextResponse.json({
      transactionId: transaction.transactionId,
      internalTransactionRef: transaction.internalTransactionRef,
      status,
      message,
      timestamp: new Date().toISOString(),
      amount: transaction.amount,
      currency: transaction.currency,
      planId: transaction.planId,
      email: transaction.email,
      payerNames: transaction.payerNames,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
