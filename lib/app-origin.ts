/**
 * Canonical public origin for redirects and return URLs on Vercel/Railway etc.
 */
export function getAppOrigin(): string {
  const explicit =
    typeof process.env.APP_URL === "string"
      ? process.env.APP_URL.trim()
      : typeof process.env.NEXTAUTH_URL === "string"
        ? process.env.NEXTAUTH_URL.trim()
        : "";
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = typeof process.env.VERCEL_URL === "string" ? process.env.VERCEL_URL.trim() : "";
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}
