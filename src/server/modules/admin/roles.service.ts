import { z } from "zod";
import { connectDb } from "@/server/db/connect";
import { Role, Staff } from "@/server/models";
import { ttlDel } from "@/server/lib/ttl-cache";
import { ADMIN_MODULES, allPermissions, emptyPermissions, type PermissionsMap } from "@/shared/admin-rbac";
import { slugify } from "@/shared/money";

const permissionsSchema = z.record(z.record(z.boolean()));

const roleInput = z.object({
  name: z.string().min(2, "Enter a role name"),
  slug: z.string().optional(),
  description: z.string().optional(),
  permissions: permissionsSchema.optional(),
});

function publicRole(row: Record<string, unknown>) {
  return {
    id: String(row._id),
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    isSystem: Boolean(row.isSystem),
    permissions: row.isSystem ? allPermissions() : ((row.permissions || {}) as PermissionsMap),
  };
}

export async function listRoles() {
  await connectDb();
  const rows = await Role.find().sort({ isSystem: -1, name: 1 }).lean();
  return rows.map((r) => publicRole(r as Record<string, unknown>));
}

export async function upsertRole(raw: unknown, id?: string) {
  await connectDb();
  const input = roleInput.parse(raw);
  const slug = (input.slug || slugify(input.name) || "role").toLowerCase();
  const permissions = { ...emptyPermissions(), ...(input.permissions || {}) };
  for (const mod of ADMIN_MODULES) {
    const row = permissions[mod.id] || {};
    const cleaned: Record<string, boolean> = {};
    for (const action of mod.actions) {
      if (row[action]) cleaned[action] = true;
    }
    permissions[mod.id] = cleaned;
  }

  if (id) {
    const existing = await Role.findById(id);
    if (!existing) throw new Error("Role not found");
    if (existing.isSystem) {
      existing.name = input.name.trim();
      existing.description = (input.description || "").trim();
      await existing.save();
      ttlDel("staff:", true);
      return publicRole(existing.toObject());
    }
    const taken = await Role.findOne({ slug, _id: { $ne: id } });
    if (taken) throw new Error("That role slug is already used");
    existing.name = input.name.trim();
    existing.slug = slug;
    existing.description = (input.description || "").trim();
    existing.permissions = permissions;
    await existing.save();
    ttlDel("staff:", true);
    return publicRole(existing.toObject());
  }

  const taken = await Role.findOne({ slug });
  if (taken) throw new Error("That role slug is already used");
  const created = await Role.create({
    name: input.name.trim(),
    slug,
    description: (input.description || "").trim(),
    permissions,
    isSystem: false,
  });
  return publicRole(created.toObject());
}

export async function deleteRole(id: string) {
  await connectDb();
  const role = await Role.findById(id);
  if (!role) throw new Error("Role not found");
  if (role.isSystem) throw new Error("The owner role cannot be deleted");
  const inUse = await Staff.countDocuments({ $or: [{ roleId: id }, { role: role.slug }] });
  if (inUse) throw new Error("Reassign staff before deleting this role");
  await Role.deleteOne({ _id: id });
  return { ok: true as const };
}
