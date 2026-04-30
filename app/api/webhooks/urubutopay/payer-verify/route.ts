import { handleUrubutoPayPayerVerify } from "@/lib/urubutopay-payer-verify";

/**
 * Payer validation: UrubutoPay sends { merchant_code, payer_code }.
 * POST / may be rewritten here from middleware, or callers use this path directly.
 */
export async function POST(request: Request) {
  return handleUrubutoPayPayerVerify(request);
}
