import { handleUrubutoPayPaymentWebhook } from "@/lib/urubutopay-payment-webhook";

export async function POST(request: Request) {
  const rawBody = await request.text();
  return handleUrubutoPayPaymentWebhook(request, rawBody);
}
