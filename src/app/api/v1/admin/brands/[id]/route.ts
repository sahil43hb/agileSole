import { fail, fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { deleteBrand, upsertBrand } from "@/server/modules/catalog/taxonomy.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    return ok({ brand: await upsertBrand(await request.json(), id) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return fail("VALIDATION", message, 422);
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    return ok(await deleteBrand(id));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return fail("VALIDATION", message, 422);
  }
}
