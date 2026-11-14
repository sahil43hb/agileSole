import { cookies } from "next/headers";
import { fail, fromError, ok } from "@/server/lib/api";
import { ADMIN_COOKIE, verifyAdminToken } from "@/server/lib/session";
import { getStaffById } from "@/server/modules/auth/admin.service";

export async function GET() {
  try {
    const jar = await cookies();
    const token = jar.get(ADMIN_COOKIE)?.value;
    if (!token) return fail("UNAUTHENTICATED", "Sign in required", 401);
    const session = await verifyAdminToken(token);
    if (!session) return fail("UNAUTHENTICATED", "Sign in required", 401);
    const staff = await getStaffById(session.sub);
    if (!staff) return fail("UNAUTHENTICATED", "Sign in required", 401);
    return ok({ staff });
  } catch (err) {
    return fromError(err);
  }
}
