import { z } from "zod";
import { fail, fromError, ok } from "@/server/lib/api";
import { clientKey, rateLimit } from "@/server/lib/rate-limit";
import { loginStaff } from "@/server/modules/auth/admin.service";
import { ADMIN_COOKIE, cookieOptions } from "@/server/lib/session";

const bodySchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const limited = rateLimit(clientKey(request.headers, "admin-login"), 8, 15 * 60_000);
    if (!limited.ok) {
      return fail("RATE_LIMIT", "Too many login attempts. Try later.", 429);
    }

    const json = await request.json();
    const body = bodySchema.parse(json);
    const result = await loginStaff(body.email, body.password);
    if (!result.ok) {
      return fail(result.code, "Email or password is incorrect", 401);
    }

    const res = ok({ staff: result.staff });
    res.cookies.set(ADMIN_COOKIE, result.token, cookieOptions);
    return res;
  } catch (err) {
    return fromError(err);
  }
}
