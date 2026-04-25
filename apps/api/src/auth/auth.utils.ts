import { createHash, randomBytes } from "crypto";

export function generateOpaqueToken(bytes = 48) {
  return randomBytes(bytes).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getRefreshExpiryDate() {
  const days = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? 7);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
