import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTransactionStatus } from "@/lib/urubutopay";

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

    let status = transaction.status;
    let message = "Payment status retrieved";

    // If status is pending, check with UrubutoPay API
    if (status === "PENDING" || status === "PROCESSING") {
      try {
        const urubutoStatus = await getTransactionStatus(transactionId);
        if (urubutoStatus) {
          status = urubutoStatus.status || status;
          message = urubutoStatus.message || message;
          
          // Update our database with the latest status
          await prisma.urubutoPayTransaction.update({
            where: { id: transaction.id },
            data: { 
              status,
              updatedAt: new Date(),
            },
          });
        }
      } catch (error) {
        console.error("Failed to check UrubutoPay status:", error);
        // Continue with database status if API call fails
      }
    }

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
