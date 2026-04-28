import { NextResponse } from "next/server";

/**
 * UrubutoPay callback URL.
 * Configure this in UrubutoPay as the "callback URL" or "return URL" after payment.
 *
 * When UrubutoPay redirects the user here, we forward them to the membership
 * success page with the reference/transaction_id so they see the thank-you screen.
 *
 * Example URL to set in UrubutoPay dashboard:
 *   https://yourdomain.com/api/urubutopay/callback
 *
 * UrubutoPay may append query params such as:
 *   reference, transaction_id, status, order_id, etc.
 * We pass them through to /membership/success so the success page can display the reference.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const successBase = `${appUrl}/membership/success`;

  const reference =
    searchParams.get("reference") ??
    searchParams.get("transaction_id") ??
    searchParams.get("transactionId") ??
    searchParams.get("order_id") ??
    searchParams.get("orderId");

  const params = new URLSearchParams();
  if (reference) params.set("reference", reference);
  // Pass through any other common params so the success page can use them
  const status = searchParams.get("status");
  if (status) params.set("status", status);

  const query = params.toString();
  const redirectUrl = query ? `${successBase}?${query}` : successBase;

  return NextResponse.redirect(redirectUrl, 302);
}
