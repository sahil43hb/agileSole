import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminToken } from "@/server/lib/session";
import { getStaffById } from "@/server/modules/auth/admin.service";
import { fail } from "@/server/lib/api";

export async function getAdminStaff() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const session = await verifyAdminToken(token);
  if (!session) return null;
  return getStaffById(session.sub);
}

export async function requireAdminPage() {
  const staff = await getAdminStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}

export async function requireAdminApi(area?: string) {
  const staff = await getAdminStaff();
  if (!staff) {
    return { staff: null, response: fail("UNAUTHENTICATED", "Sign in required", 401) };
  }
  if (area && staff.role !== "super_admin") {
    const { canRole } = await import("@/server/modules/admin/staff.service");
    if (!canRole(staff.role, area) && area !== "dashboard") {
      return { staff: null, response: fail("FORBIDDEN", "Not allowed for this role", 403) };
    }
  }
  return { staff, response: null };
}
