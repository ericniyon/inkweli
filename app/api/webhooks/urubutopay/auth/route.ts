import { handleUrubutoPayPortalAuth } from "@/lib/urubutopay-portal-auth";

/**
 * UrubutoPay webhook authentication.
 * They call POST with { user_name, password } to get a Bearer token
 * they use for payment callbacks and payer validation.
 * Token valid for 24 hours per their docs.
 *
 * When the portal only allows posting to the site root, POST / is rewritten
 * to /api/urubutopay/portal-root which dispatches auth vs payment here.
 */
export async function POST(request: Request) {
  return handleUrubutoPayPortalAuth(request);
}
