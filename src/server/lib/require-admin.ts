import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminToken } from "@/server/lib/session";
import { getStaffById, type AdminSession } from "@/server/modules/auth/admin.service";
import { fail } from "@/server/lib/api";
import { actionFromMethod, hasPermission, type PermissionAction } from "@/shared/admin-rbac";

export async function getAdminStaff() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const session = await verifyAdminToken(token);
  if (!session) return null;
  return getStaffById(session.sub);
}

export async function requireAdminPage() {
  const staff = await getAdminStaff();
  if (!staff) {
    // Drop a stale cookie (e.g. staff re-seeded) via the logout route so we
    // never bounce login ↔ dashboard.
    redirect("/api/v1/auth/admin/logout");
  }
  return staff;
}

export async function requireAdminApi(module?: string, action: PermissionAction = "view") {
  const staff = await getAdminStaff();
  if (!staff) {
    return { staff: null, response: fail("UNAUTHENTICATED", "Sign in required", 401) };
  }
  if (module && !hasPermission(staff.permissions, module, action, staff.isOwner)) {
    return { staff: null, response: fail("FORBIDDEN", "You don’t have permission to do that", 403) };
  }
  return { staff, response: null };
}

export async function requireAdminAny(checks: Array<[string, PermissionAction]>) {
  const staff = await getAdminStaff();
  if (!staff) {
    return { staff: null, response: fail("UNAUTHENTICATED", "Sign in required", 401) };
  }
  const ok = checks.some(([module, action]) => hasPermission(staff.permissions, module, action, staff.isOwner));
  if (!ok) {
    return { staff: null, response: fail("FORBIDDEN", "You don’t have permission to do that", 403) };
  }
  return { staff, response: null };
}

export async function requireAdminModule(module: string, request?: Request) {
  const action = request ? actionFromMethod(request.method) : "view";
  return requireAdminApi(module, action);
}

export type { AdminSession };
