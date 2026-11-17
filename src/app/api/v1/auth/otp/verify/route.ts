import { z } from "zod";
import { fail, fromError, ok } from "@/server/lib/api";
import { clientKey, rateLimit } from "@/server/lib/rate-limit";
import { verifyOtp } from "@/server/modules/auth/customer-otp.service";
import { CUSTOMER_COOKIE, cookieOptions } from "@/server/lib/session";

const bodySchema = z.object({
  identifier: z.string().min(5, "Enter a valid phone or email"),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  purpose: z.enum(["login", "checkout"]).optional(),
});

export async function POST(request: Request) {
  try {
    const limited = rateLimit(clientKey(request.headers, "otp-verify"), 10, 10 * 60_000);
    if (!limited.ok) {
      return fail("RATE_LIMIT", "Too many attempts. Try later.", 429);
    }
    const body = bodySchema.parse(await request.json());
    const result = await verifyOtp(body.identifier, body.code, body.purpose ?? "login");
    if (!result.ok) {
      const otpCopy: Record<string, string> = {
        OTP_NOT_FOUND: "Request a new code first",
        OTP_EXPIRED: "That code has expired. Request a new one.",
        OTP_LOCKED: "Too many tries. Request a new code.",
        OTP_INVALID: "That code is incorrect",
      };
      return fail(result.code, otpCopy[result.code] || "Could not verify that code", 401);
    }
    const res = ok({ customer: result.customer });
    res.cookies.set(CUSTOMER_COOKIE, result.token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    return fromError(err);
  }
}
