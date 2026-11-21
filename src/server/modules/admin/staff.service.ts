import { z } from "zod";
import { connectDb } from "@/server/db/connect";
import { Role, Staff } from "@/server/models";
import { hashPassword, verifyPassword } from "@/server/lib/password";
import { ttlDel } from "@/server/lib/ttl-cache";

const staffInput = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  roleId: z.string().min(1, "Choose a role"),
  isActive: z.boolean().optional(),
});

export function seedAdminEmail() {
  return (process.env.SEED_ADMIN_EMAIL || "agilesole@gmail.com").toLowerCase();
}

export function isSeedOwnerAccount(email?: string | null) {
  return (email || "").toLowerCase() === seedAdminEmail();
}

async function resolveRole(roleId: string) {
  const role = await Role.findById(roleId);
  if (!role) throw new Error("Choose a valid role");
  return role;
}

export async function listStaff() {
  await connectDb();
  const rows = await Staff.find().sort({ createdAt: -1 }).lean();
  const roles = await Role.find().lean();
  const byId = new Map(roles.map((r) => [String(r._id), r]));
  const bySlug = new Map(roles.map((r) => [r.slug, r]));
  return rows.map((r) => {
    const role = (r.roleId && byId.get(String(r.roleId))) || bySlug.get(r.role);
    return {
      id: String(r._id),
      name: r.name,
      email: r.email,
      role: role?.slug || r.role,
      roleId: role ? String(role._id) : String(r.roleId || ""),
      roleName: role?.name || r.role,
      isActive: r.isActive,
      lastLoginAt: r.lastLoginAt,
      locked: isSeedOwnerAccount(r.email),
    };
  });
}

export async function upsertStaff(raw: unknown, id?: string, actor?: { isOwner?: boolean }) {
  await connectDb();
  const input = staffInput.parse(raw);
  const role = await resolveRole(input.roleId);
  if ((role.slug === "owner" || role.isSystem) && !actor?.isOwner) {
    throw new Error("Only an owner can assign the owner role");
  }
  if (id && input.isActive === false) {
    const current = await Staff.findById(id);
    if (current && isSeedOwnerAccount(current.email)) {
      throw new Error("The store owner account cannot be deactivated");
    }
    const currentSlug = current ? (await Role.findById(current.roleId))?.slug || current.role : "";
    if (currentSlug === "owner" || currentSlug === "super_admin") {
      const owners = await Staff.countDocuments({ isActive: true, $or: [{ role: "owner" }, { role: "super_admin" }] });
      if (owners <= 1) throw new Error("Keep at least one active owner");
    }
  }
  const payload: Record<string, unknown> = {
    name: input.name,
    email: input.email.toLowerCase(),
    roleId: role._id,
    role: role.slug,
    isActive: input.isActive !== false,
  };
  if (input.password) payload.passwordHash = await hashPassword(input.password);
  if (id) {
    if (!input.password) delete payload.passwordHash;
    const row = await Staff.findByIdAndUpdate(id, payload, { new: true });
    if (!row) throw new Error("Staff not found");
    ttlDel(`staff:${id}`);
    return {
      id: String(row._id),
      name: row.name,
      email: row.email,
      role: role.slug,
      roleId: String(role._id),
      roleName: role.name,
      isActive: row.isActive,
    };
  }
  if (!input.password) throw new Error("Password required for new staff");
  const created = await Staff.create(payload);
  return {
    id: String(created._id),
    name: created.name,
    email: created.email,
    role: role.slug,
    roleId: String(role._id),
    roleName: role.name,
    isActive: created.isActive,
  };
}

export async function deleteStaff(id: string, actorId: string) {
  await connectDb();
  if (actorId === id) throw new Error("You cannot delete your own account");
  const row = await Staff.findById(id);
  if (!row) throw new Error("Staff not found");
  if (isSeedOwnerAccount(row.email)) throw new Error("The store owner account cannot be deleted");
  const slug = (await Role.findById(row.roleId))?.slug || row.role;
  if (slug === "owner" || slug === "super_admin") {
    const owners = await Staff.countDocuments({ $or: [{ role: "owner" }, { role: "super_admin" }] });
    if (owners <= 1) throw new Error("Keep at least one owner");
  }
  await Staff.deleteOne({ _id: id });
  ttlDel(`staff:${id}`);
  return { deleted: true };
}

export async function updateOwnProfile(
  id: string,
  raw: unknown,
): Promise<{ id: string; name: string; email: string; role: string }> {
  await connectDb();
  const input = z
    .object({
      name: z.string().min(2),
      email: z.string().email(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(8).optional().or(z.literal("")),
    })
    .parse(raw);

  const staff = await Staff.findById(id);
  if (!staff) throw new Error("Staff not found");

  const email = input.email.toLowerCase();
  const taken = await Staff.findOne({ email, _id: { $ne: id } });
  if (taken) throw new Error("That email is already in use");

  staff.name = input.name;
  staff.email = email;

  if (input.newPassword) {
    if (!input.currentPassword) throw new Error("Enter your current password to set a new one");
    const match = await verifyPassword(input.currentPassword, staff.passwordHash);
    if (!match) throw new Error("Current password is incorrect");
    staff.passwordHash = await hashPassword(input.newPassword);
  }

  await staff.save();
  ttlDel(`staff:${id}`);
  return { id: String(staff._id), name: staff.name, email: staff.email, role: staff.role };
}

export function canRole(role: string, area: string) {
  if (role === "super_admin" || role === "owner") return true;
  const map: Record<string, string[]> = {
    orders: ["orders", "tickets", "customers"],
    catalog: ["products", "inventory", "categories", "brands", "collections", "size_charts"],
    content: ["homepage", "faqs", "reviews", "settings"],
    support: ["tickets", "reviews", "customers"],
    reporter: ["reports", "dashboard"],
  };
  return (map[role] || []).includes(area);
}
