import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { deleteStaff, upsertStaff } from "@/server/modules/admin/staff.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("staff", "update");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    return ok({ staff: await upsertStaff(await request.json(), id, gate.staff!) });
  } catch (err) {
    return fromError(err);
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  const gate = await requireAdminApi("staff", "delete");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    return ok(await deleteStaff(id, gate.staff!.id));
  } catch (err) {
    return fromError(err);
  }
}
