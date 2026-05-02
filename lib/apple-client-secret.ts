import jwt from "jsonwebtoken";

/**
 * Short-lived JWT Apple requires as OAuth client_secret (ES256, .p8 key).
 * Generated once per server process; refresh on deploy or before ~180d expiry.
 */
export function getAppleClientSecret(): string {
  const teamId = process.env.APPLE_TEAM_ID;
  const clientId = process.env.APPLE_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const rawKey = process.env.APPLE_PRIVATE_KEY;
  if (!teamId || !clientId || !keyId || !rawKey) {
    throw new Error("Missing APPLE_TEAM_ID, APPLE_ID, APPLE_KEY_ID, or APPLE_PRIVATE_KEY");
  }
  const privateKey = rawKey.replace(/\\n/g, "\n");
  return jwt.sign(
    {},
    privateKey,
    {
      algorithm: "ES256",
      expiresIn: "180d",
      audience: "https://appleid.apple.com",
      issuer: teamId,
      subject: clientId,
      header: { alg: "ES256", kid: keyId },
    }
  );
}
