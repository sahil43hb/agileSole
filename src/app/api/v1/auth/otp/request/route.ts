import { z } from "zod";
import { fail, fromError, ok } from "@/server/lib/api";
import { clientKey, rateLimit } from "@/server/lib/rate-limit";
import { requestOtp } from "@/server/modules/auth/customer-otp.service";

const bodySchema = z.object({
  identifier: z.string().min(5, "Enter a valid phone or email"),
  purpose: z.enum(["login", "checkout"]).optional(),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const limited = rateLimit(clientKey(request.headers, "otp-request"), 5, 10 * 60_000);
    if (!limited.ok) {
      return fail("RATE_LIMIT", "Too many OTP requests. Try later.", 429);
    }
    const body = bodySchema.parse(await request.json());
    const result = await requestOtp(body.identifier, body.purpose ?? "login", body.email);
    return ok(result);
  } catch (err) {
    return fromError(err);
  }
}
