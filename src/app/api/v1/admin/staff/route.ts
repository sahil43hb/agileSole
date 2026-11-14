import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { listStaff, upsertStaff } from "@/server/modules/admin/staff.service";
import { writeAudit } from "@/server/modules/admin/audit.service";

export async function GET() {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  if (gate.staff!.role !== "super_admin") {
    return ok({ staff: [gate.staff] });
  }
  try {
    return ok({ staff: await listStaff() });
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(request: Request) {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  if (gate.staff!.role !== "super_admin") {
    const { fail } = await import("@/server/lib/api");
    return fail("FORBIDDEN", "Only the owner can add staff", 403);
  }
  try {
    const staff = await upsertStaff(await request.json());
    await writeAudit({ actorId: gate.staff!.id, action: "staff.create", entity: "staff", entityId: staff.id });
    return ok({ staff }, 201);
  } catch (err) {
    return fromError(err);
  }
}
