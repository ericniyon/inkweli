// Shared NextAuth secret resolver used by both API routes and middleware.
// In production, set NEXTAUTH_SECRET explicitly.
export const NEXTAUTH_FALLBACK_SECRET = "inkwell-dev-nextauth-secret-change-me";

export function resolveNextAuthSecret(): string {
  return process.env.NEXTAUTH_SECRET || NEXTAUTH_FALLBACK_SECRET;
}
