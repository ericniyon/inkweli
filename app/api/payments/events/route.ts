import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("transactionId") || searchParams.get("reference");
  
  if (!transactionId) {
    return new Response("Missing transactionId parameter", { status: 400 });
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let intervalId: NodeJS.Timeout;
      let timeoutId: NodeJS.Timeout;

      const sendEvent = (data: any) => {
        const formattedData = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(formattedData));
      };

      const checkStatus = async () => {
        try {
          const transaction = await prisma.urubutoPayTransaction.findFirst({
            where: {
              OR: [
                { transactionId },
                { internalTransactionRef: transactionId },
              ],
            },
          });

          if (!transaction) {
            sendEvent({ 
              type: 'error', 
              message: 'Transaction not found' 
            });
            return;
          }

          sendEvent({
            type: 'status_update',
            transactionId: transaction.transactionId,
            status: transaction.status,
            timestamp: transaction.updatedAt,
            amount: transaction.amount,
            planId: transaction.planId,
          });

          // Stop checking if payment is complete (success or failure)
          if (['SUCCESS', 'COMPLETED', 'VALID', 'FAILED', 'CANCELED', 'REVERSED'].includes(transaction.status)) {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            sendEvent({ type: 'complete' });
            controller.close();
          }
        } catch (error) {
          console.error('Status check error:', error);
          sendEvent({ 
            type: 'error', 
            message: 'Failed to check status' 
          });
        }
      };

      // Initial check
      checkStatus();

      // Check every 2 seconds
      intervalId = setInterval(checkStatus, 2000);

      // Timeout after 3 minutes
      timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        sendEvent({ 
          type: 'timeout', 
          message: 'Status check timed out' 
        });
        controller.close();
      }, 180000);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
