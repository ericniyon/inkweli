/**
 * Optional richer logging when URUBUTOPAY_DEBUG_LOGS=1|true (full/redacted payloads).
 * Base-level payment logs are INFO lines regardless, for server dashboards.
 */

const DEBUG =
  typeof process.env.URUBUTOPAY_DEBUG_LOGS === "string" &&
  ["1", "true", "yes"].includes(process.env.URUBUTOPAY_DEBUG_LOGS.trim().toLowerCase());

export function urubutuPayDebugVerbose(): boolean {
  return DEBUG;
}

export function maskEmail(email: string | null | undefined): string {
  if (!email?.trim()) return "";
  const e = email.trim().toLowerCase();
  const i = e.indexOf("@");
  if (i <= 0) return "***";
  const user = e.slice(0, i);
  const dom = e.slice(i + 1);
  const uShown = user.length <= 2 ? user[0] + "*" : user.slice(0, 2);
  return `${uShown}***@${dom}`;
}

/** Log concise payment pipeline events (stdout — Vercel/Railway “Logs”). */
export function logUrubutuPayEvent(
  source: string,
  event: string,
  fields: Record<string, string | number | boolean | null | undefined>
): void {
  const parts = Object.entries(fields).filter(([, v]) => v !== undefined && v !== null && v !== "");
  const flat = parts.map(([k, v]) => `${k}=${String(v)}`).join(" ");
  console.info(`[urubutopay:${source}] ${event}${flat ? ` ${flat}` : ""}`);
}

export function logUrubutuPayVerbose(source: string, label: string, body: unknown): void {
  if (!DEBUG) return;
  try {
    const s =
      typeof body === "string"
        ? body.slice(0, 8192)
        : JSON.stringify(body, null, 0).slice(0, 8192);
    console.info(`[urubutopay:${source}:verbose] ${label}`, s.endsWith("\n") ? s : `${s}`);
  } catch {
    console.info(`[urubutopay:${source}:verbose] ${label}`, String(body));
  }
}
