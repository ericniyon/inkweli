import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Query keys UrubutoPay may append when redirecting payer to callback URL */
const CALLBACK_KEYS = ["reference", "transaction_id", "transactionId", "order_id", "orderId"];

function paymentCallbackRedirect(request: NextRequest): NextResponse | null {
  if (request.method !== "GET") return null;
  const { searchParams } = request.nextUrl;
  const hasRef = CALLBACK_KEYS.some((k) => {
    const v = searchParams.get(k);
    return v != null && String(v).trim() !== "";
  });
  if (!hasRef) return null;

  const dest = request.nextUrl.clone();
  dest.pathname = "/api/urubutopay/callback";
  return NextResponse.redirect(dest, 302);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const redirect = paymentCallbackRedirect(request);
    if (redirect) return redirect;

    if (request.method === "POST") {
      const url = request.nextUrl.clone();
      url.pathname = "/api/urubutopay/portal-root";
      return NextResponse.rewrite(url);
    }
  }

  if (pathname === "/validation" && request.method === "POST") {
    const url = request.nextUrl.clone();
    url.pathname = "/api/webhooks/urubutopay/payer-verify";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/validation"],
};
