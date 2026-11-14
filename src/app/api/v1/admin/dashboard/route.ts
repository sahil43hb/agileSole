import { cookies } from "next/headers";
import { fail, fromError, ok } from "@/server/lib/api";
import { ADMIN_COOKIE, verifyAdminToken } from "@/server/lib/session";
import { dashboardSnapshot } from "@/server/modules/admin/dashboard.service";

export async function GET() {
  try {
    const token = (await cookies()).get(ADMIN_COOKIE)?.value;
    if (!token) return fail("UNAUTHENTICATED", "Sign in required", 401);
    const session = await verifyAdminToken(token);
    if (!session) return fail("UNAUTHENTICATED", "Sign in required", 401);
    const data = await dashboardSnapshot();
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}
