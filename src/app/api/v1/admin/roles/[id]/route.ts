import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { deleteRole, upsertRole } from "@/server/modules/admin/roles.service";
import { writeAudit } from "@/server/modules/admin/audit.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("roles", "update");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const role = await upsertRole(await request.json(), id);
    await writeAudit({ actorId: gate.staff!.id, action: "role.update", entity: "role", entityId: id });
    return ok({ role });
  } catch (err) {
    return fromError(err);
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  const gate = await requireAdminApi("roles", "delete");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    await deleteRole(id);
    await writeAudit({ actorId: gate.staff!.id, action: "role.delete", entity: "role", entityId: id });
    return ok({ deleted: true });
  } catch (err) {
    return fromError(err);
  }
}
