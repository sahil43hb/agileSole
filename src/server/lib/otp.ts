import { createHash, randomInt } from "crypto";

export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function sendOtpStub(to: string, code: string, purpose: string) {
  // Phase 0: console provider. Swap for SMS/email in a later phase.
  console.info(`[otp:${purpose}] ${to} → ${code}`);
}
