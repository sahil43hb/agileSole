import { connectDb } from "@/server/db/connect";
import { Customer, OtpChallenge } from "@/server/models";
import { generateOtp, hashOtp, sendOtpStub } from "@/server/lib/otp";
import { signCustomerToken } from "@/server/lib/session";
import { normalizePkPhone } from "@/shared/phone";

const TEN_MIN = 10 * 60 * 1000;

function normalizeIdentifier(raw: string) {
  const value = raw.trim().toLowerCase();
  const isEmail = value.includes("@");
  if (isEmail) return { kind: "email" as const, identifier: value };
  try {
    return { kind: "phone" as const, identifier: normalizePkPhone(raw) };
  } catch {
    const digits = value.replace(/[^\d+]/g, "");
    return { kind: "phone" as const, identifier: digits };
  }
}

export async function requestOtp(raw: string, purpose: "login" | "checkout" = "login") {
  await connectDb();
  const { identifier } = normalizeIdentifier(raw);
  if (identifier.length < 5) {
    throw new Error("Enter a valid phone or email");
  }

  const code = generateOtp();
  await OtpChallenge.deleteMany({ identifier, purpose });
  await OtpChallenge.create({
    identifier,
    purpose,
    codeHash: hashOtp(code),
    expiresAt: new Date(Date.now() + TEN_MIN),
  });
  await sendOtpStub(identifier, code, purpose);
  const payload: { identifier: string; expiresInSec: number; devCode?: string } = {
    identifier,
    expiresInSec: 600,
  };
  if (process.env.NODE_ENV !== "production") payload.devCode = code;
  return payload;
}

export async function verifyOtp(raw: string, code: string, purpose: "login" | "checkout" = "login") {
  await connectDb();
  const { kind, identifier } = normalizeIdentifier(raw);
  const row = await OtpChallenge.findOne({ identifier, purpose });
  if (!row) return { ok: false as const, code: "OTP_NOT_FOUND" };
  if (row.expiresAt.getTime() < Date.now()) {
    await row.deleteOne();
    return { ok: false as const, code: "OTP_EXPIRED" };
  }
  if (row.attempts >= 5) {
    await row.deleteOne();
    return { ok: false as const, code: "OTP_LOCKED" };
  }
  if (row.codeHash !== hashOtp(code.trim())) {
    row.attempts += 1;
    await row.save();
    return { ok: false as const, code: "OTP_INVALID" };
  }

  await row.deleteOne();

  let customer = kind === "email"
    ? await Customer.findOne({ email: identifier })
    : await Customer.findOne({ phone: identifier });

  if (!customer) {
    customer = await Customer.create(
      kind === "email"
        ? { email: identifier, emailVerifiedAt: new Date() }
        : { phone: identifier, phoneVerifiedAt: new Date() },
    );
  } else if (kind === "email") {
    customer.emailVerifiedAt = new Date();
    await customer.save();
  } else {
    customer.phoneVerifiedAt = new Date();
    await customer.save();
  }

  const token = await signCustomerToken({
    sub: customer._id.toString(),
    identifier,
    epoch: customer.sessionEpoch || 0,
  });

  return {
    ok: true as const,
    token,
    customer: {
      id: customer._id.toString(),
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    },
  };
}

export async function consumeCheckoutOtp(raw: string, code: string) {
  await connectDb();
  const { identifier } = normalizeIdentifier(raw);
  const row = await OtpChallenge.findOne({ identifier, purpose: "checkout" });
  if (!row) return { ok: false as const, code: "OTP_NOT_FOUND" };
  if (row.expiresAt.getTime() < Date.now()) {
    await row.deleteOne();
    return { ok: false as const, code: "OTP_EXPIRED" };
  }
  if (row.attempts >= 5) {
    await row.deleteOne();
    return { ok: false as const, code: "OTP_LOCKED" };
  }
  if (row.codeHash !== hashOtp(code.trim())) {
    row.attempts += 1;
    await row.save();
    return { ok: false as const, code: "OTP_INVALID" };
  }
  await row.deleteOne();
  return { ok: true as const, identifier };
}
