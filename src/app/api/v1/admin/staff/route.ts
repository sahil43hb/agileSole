import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { listStaff, upsertStaff } from "@/server/modules/admin/staff.service";
import { listRoles } from "@/server/modules/admin/roles.service";
import { writeAudit } from "@/server/modules/admin/audit.service";

export async function GET() {
  const gate = await requireAdminApi("staff", "view");
  if (gate.response) return gate.response;
  try {
    return ok({ staff: await listStaff(), roles: await listRoles() });
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(request: Request) {
  const gate = await requireAdminApi("staff", "create");
  if (gate.response) return gate.response;
  try {
    const staff = await upsertStaff(await request.json(), undefined, gate.staff!);
    await writeAudit({ actorId: gate.staff!.id, action: "staff.create", entity: "staff", entityId: staff.id });
    return ok({ staff }, 201);
  } catch (err) {
    return fromError(err);
  }
}
