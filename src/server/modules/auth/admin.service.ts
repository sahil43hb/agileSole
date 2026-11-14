import { connectDb } from "@/server/db/connect";
import { Staff } from "@/server/models";
import { verifyPassword } from "@/server/lib/password";
import { signAdminToken } from "@/server/lib/session";
import { ttlRemember } from "@/server/lib/ttl-cache";

export async function loginStaff(email: string, password: string) {
  await connectDb();
  const staff = await Staff.findOne({ email: email.toLowerCase(), isActive: true });
  if (!staff) return { ok: false as const, code: "INVALID_CREDENTIALS" };

  const match = await verifyPassword(password, staff.passwordHash);
  if (!match) return { ok: false as const, code: "INVALID_CREDENTIALS" };

  staff.lastLoginAt = new Date();
  await staff.save();

  const token = await signAdminToken({
    sub: staff._id.toString(),
    email: staff.email,
    role: staff.role,
  });

  return {
    ok: true as const,
    token,
    staff: {
      id: staff._id.toString(),
      name: staff.name,
      email: staff.email,
      role: staff.role,
    },
  };
}

export async function getStaffById(id: string) {
  return ttlRemember(`staff:${id}`, 15_000, async () => loadStaffById(id));
}

async function loadStaffById(id: string) {
  await connectDb();
  const staff = await Staff.findById(id).lean<{
    _id: { toString(): string };
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  } | null>();
  if (!staff || !staff.isActive) return null;
  return {
    id: staff._id.toString(),
    name: staff.name,
    email: staff.email,
    role: staff.role,
  };
}
