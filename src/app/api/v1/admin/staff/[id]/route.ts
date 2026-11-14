import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { upsertStaff } from "@/server/modules/admin/staff.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  if (gate.staff!.role !== "super_admin") {
    const { fail } = await import("@/server/lib/api");
    return fail("FORBIDDEN", "Only the owner can edit staff", 403);
  }
  try {
    const { id } = await ctx.params;
    return ok({ staff: await upsertStaff(await request.json(), id) });
  } catch (err) {
    return fromError(err);
  }
}
