import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { listRoles, upsertRole } from "@/server/modules/admin/roles.service";
import { writeAudit } from "@/server/modules/admin/audit.service";

export async function GET() {
  const gate = await requireAdminApi("roles", "view");
  if (gate.response) return gate.response;
  try {
    return ok({ roles: await listRoles() });
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(request: Request) {
  const gate = await requireAdminApi("roles", "create");
  if (gate.response) return gate.response;
  try {
    const role = await upsertRole(await request.json());
    await writeAudit({ actorId: gate.staff!.id, action: "role.create", entity: "role", entityId: role.id });
    return ok({ role }, 201);
  } catch (err) {
    return fromError(err);
  }
}
