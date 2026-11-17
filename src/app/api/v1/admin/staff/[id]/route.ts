import { fail, fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { upsertStaff } from "@/server/modules/admin/staff.service";

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
  const { id } = await ctx.params;
  if (gate.staff!.id === id) return fail("FORBIDDEN", "You cannot delete your own account", 400);
  const { Staff } = await import("@/server/models");
  await Staff.deleteOne({ _id: id });
  return ok({ deleted: true });
}
