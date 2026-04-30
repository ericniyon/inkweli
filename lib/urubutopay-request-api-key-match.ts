/** UrubutoPay may send Authorization as raw key or `Bearer <key>`. Normalize and compare securely. */

import { urubutuPayUsesLiveGateway } from "@/lib/urubutopay";

function trim(s: string | undefined | null): string {
  return typeof s === "string" ? s.trim() : "";
}

/** Deduped secrets from env (production prefers *_PRODUCTION, else generic URUBUTOPAY_API_KEY). */
export function resolvedUrubutoPaymentApiSecrets(): string[] {
  const isProd = urubutuPayUsesLiveGateway();
  const primary = isProd
    ? trim(process.env.URUBUTOPAY_API_KEY_PRODUCTION)
    : trim(process.env.URUBUTOPAY_API_KEY_STAGING);
  const generic = trim(process.env.URUBUTOPAY_API_KEY);
  const out = [...new Set([primary, generic].filter((k) => k.length > 0))];
  return out;
}

export function requestAuthorizationMatchesUrubutoApiKey(request: Request): boolean {
  const raw = trim(request.headers.get("authorization"));
  if (!raw) return false;

  const bearer = /^Bearer\s+([\s\S]+)$/i.exec(raw);
  const credential = bearer ? trim(bearer[1]) : raw;

  for (const key of resolvedUrubutoPaymentApiSecrets()) {
    if (credential === key || raw === key || raw === `Bearer ${key}`) return true;
  }
  return false;
}
