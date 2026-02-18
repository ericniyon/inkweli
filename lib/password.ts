import { randomBytes, pbkdf2Sync, timingSafeEqual } from "crypto";

const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = "sha512";
const SALT_BYTES = 32;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derived = pbkdf2Sync(
    password,
    salt,
    ITERATIONS,
    KEYLEN,
    DIGEST
  ).toString("hex");
  return `${salt}.${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, derived] = stored.split(".");
  if (!salt || !derived) return false;
  const hash = pbkdf2Sync(
    password,
    salt,
    ITERATIONS,
    KEYLEN,
    DIGEST
  );
  try {
    return timingSafeEqual(hash, Buffer.from(derived, "hex"));
  } catch {
    return false;
  }
}
