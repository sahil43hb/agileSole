import { z } from "zod";
import { connectDb } from "@/server/db/connect";
import { Staff } from "@/server/models";
import { hashPassword, verifyPassword } from "@/server/lib/password";
import { ttlDel } from "@/server/lib/ttl-cache";

export const ROLES = ["super_admin", "catalog", "orders", "content", "support", "reporter"] as const;

const staffInput = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(ROLES),
  isActive: z.boolean().optional(),
});

export async function listStaff() {
  await connectDb();
  const rows = await Staff.find().sort({ createdAt: -1 }).lean();
  return rows.map((r) => ({
    id: String(r._id),
    name: r.name,
    email: r.email,
    role: r.role,
    isActive: r.isActive,
    lastLoginAt: r.lastLoginAt,
  }));
}

export async function upsertStaff(raw: unknown, id?: string) {
  await connectDb();
  const input = staffInput.parse(raw);
  const payload: Record<string, unknown> = {
    name: input.name,
    email: input.email.toLowerCase(),
    role: input.role,
    isActive: input.isActive !== false,
  };
  if (input.password) payload.passwordHash = await hashPassword(input.password);
  if (id) {
    if (!input.password) delete payload.passwordHash;
    const row = await Staff.findByIdAndUpdate(id, payload, { new: true });
    if (!row) throw new Error("Staff not found");
    return { id: String(row._id), name: row.name, email: row.email, role: row.role, isActive: row.isActive };
  }
  if (!input.password) throw new Error("Password required for new staff");
  const created = await Staff.create(payload);
  return { id: String(created._id), name: created.name, email: created.email, role: created.role, isActive: created.isActive };
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
  if (role === "super_admin") return true;
  const map: Record<string, string[]> = {
    orders: ["orders", "tickets", "customers"],
    catalog: ["products", "inventory", "categories", "brands", "collections"],
    content: ["cms", "faqs", "charts", "reviews", "settings"],
    support: ["tickets", "reviews", "customers"],
    reporter: ["reports", "dashboard"],
  };
  return (map[role] || []).includes(area);
}
