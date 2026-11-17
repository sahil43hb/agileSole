import { connectDb } from "@/server/db/connect";
import { Role, Staff } from "@/server/models";
import { verifyPassword } from "@/server/lib/password";
import { signAdminToken } from "@/server/lib/session";
import { ttlRemember } from "@/server/lib/ttl-cache";
import { allPermissions, type PermissionsMap } from "@/shared/admin-rbac";

export type AdminSession = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleName: string;
  roleId?: string;
  isOwner: boolean;
  permissions: PermissionsMap;
};

function toSession(staff: {
  _id: { toString(): string };
  name: string;
  email: string;
  role?: string;
  roleId?: { toString(): string } | null;
  roleDoc?: { name?: string; slug?: string; isSystem?: boolean; permissions?: PermissionsMap } | null;
}): AdminSession {
  const roleDoc = staff.roleDoc;
  const slug = roleDoc?.slug || staff.role || "support";
  const isOwner = slug === "owner" || slug === "super_admin" || Boolean(roleDoc?.isSystem && slug === "owner");
  return {
    id: staff._id.toString(),
    name: staff.name,
    email: staff.email,
    role: slug,
    roleName: roleDoc?.name || slug.replaceAll("_", " "),
    roleId: staff.roleId ? String(staff.roleId) : undefined,
    isOwner: isOwner || slug === "super_admin",
    permissions: isOwner || slug === "super_admin" ? allPermissions() : roleDoc?.permissions || {},
  };
}

export async function loginStaff(email: string, password: string) {
  await connectDb();
  const staff = await Staff.findOne({ email: email.toLowerCase(), isActive: true });
  if (!staff) return { ok: false as const, code: "INVALID_CREDENTIALS" };

  const match = await verifyPassword(password, staff.passwordHash);
  if (!match) return { ok: false as const, code: "INVALID_CREDENTIALS" };

  staff.lastLoginAt = new Date();
  await staff.save();

  const session = await loadStaffById(String(staff._id));
  if (!session) return { ok: false as const, code: "INVALID_CREDENTIALS" };

  const token = await signAdminToken({
    sub: session.id,
    email: session.email,
    role: session.role,
  });

  return { ok: true as const, token, staff: session };
}

export async function getStaffById(id: string) {
  return ttlRemember(`staff:${id}`, 15_000, async () => loadStaffById(id));
}

async function loadStaffById(id: string): Promise<AdminSession | null> {
  await connectDb();
  const staff = await Staff.findById(id).lean<{
    _id: { toString(): string };
    name: string;
    email: string;
    role?: string;
    roleId?: { toString(): string };
    isActive: boolean;
  } | null>();
  if (!staff || !staff.isActive) return null;
  const roleDoc = staff.roleId
    ? await Role.findById(staff.roleId).lean<{
        name: string;
        slug: string;
        isSystem?: boolean;
        permissions?: PermissionsMap;
      } | null>()
    : await Role.findOne({ slug: staff.role }).lean<{
        name: string;
        slug: string;
        isSystem?: boolean;
        permissions?: PermissionsMap;
      } | null>();
  return toSession({ ...staff, roleDoc });
}
