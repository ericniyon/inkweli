import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { resolveNextAuthSecret } from "@/lib/nextauth-secret";

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

export async function middleware(request: NextRequest) {
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

  const needsAuthForMembership =
    pathname === "/membership" ||
    (pathname.startsWith("/membership/") && pathname !== "/membership/success");

  if (needsAuthForMembership) {
    const secret = resolveNextAuthSecret();
    const token = await getToken({
      req: request,
      secret,
    });
    const t = token as { userId?: string; sub?: string } | null;
    const authorized = Boolean(t && (t.userId || t.sub));
    if (!authorized) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set(
        "callbackUrl",
        pathname + (request.nextUrl.search || "")
      );
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/validation", "/membership", "/membership/:path*"],
};
