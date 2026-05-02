import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  reconcileUrubutoTransactionFromGateway,
  gatewayStatusIsTerminal,
} from "@/lib/urubutopay-gateway-reconcile";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("transactionId") || searchParams.get("reference");

  if (!transactionId) {
    return new Response("Missing transactionId parameter", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let intervalId: ReturnType<typeof setInterval> | undefined;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      const sendEvent = (data: Record<string, unknown>) => {
        const formattedData = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(formattedData));
      };

      const checkStatus = async () => {
        try {
          const transaction = await prisma.urubutoPayTransaction.findFirst({
            where: {
              OR: [{ transactionId }, { internalTransactionRef: transactionId }],
            },
          });

          if (!transaction) {
            if (intervalId) clearInterval(intervalId);
            if (timeoutId) clearTimeout(timeoutId);
            sendEvent({
              type: "error",
              message: "Transaction not found",
            });
            controller.close();
            return;
          }

          const status = await reconcileUrubutoTransactionFromGateway({
            id: transaction.id,
            transactionId: transaction.transactionId,
            status: transaction.status,
          });

          sendEvent({
            type: "status_update",
            transactionId: transaction.transactionId,
            status,
            timestamp: transaction.updatedAt,
            amount: transaction.amount,
            planId: transaction.planId,
          });

          if (gatewayStatusIsTerminal(status)) {
            if (intervalId) clearInterval(intervalId);
            if (timeoutId) clearTimeout(timeoutId);
            sendEvent({ type: "complete" });
            controller.close();
          }
        } catch (error) {
          console.error("Status check error:", error);
          if (intervalId) clearInterval(intervalId);
          if (timeoutId) clearTimeout(timeoutId);
          sendEvent({
            type: "error",
            message: "Failed to check status",
          });
          controller.close();
        }
      };

      checkStatus();

      intervalId = setInterval(checkStatus, 2000);

      timeoutId = setTimeout(() => {
        if (intervalId) clearInterval(intervalId);
        sendEvent({
          type: "timeout",
          message: "Status check timed out",
        });
        controller.close();
      }, 180000);

      request.signal.addEventListener("abort", () => {
        if (intervalId) clearInterval(intervalId);
        if (timeoutId) clearTimeout(timeoutId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}
