import { errorMessage, fail, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { deleteBrand, setBrandActive, upsertBrand } from "@/server/modules/catalog/taxonomy.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("brands", "update");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    if (body && typeof body.isActive === "boolean" && Object.keys(body).length === 1) {
      return ok({ brand: await setBrandActive(id, body.isActive) });
    }
    return ok({ brand: await upsertBrand(body, id) });
  } catch (err) {
    const message = errorMessage(err, "Failed");
    return fail("VALIDATION", message, 422);
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  const gate = await requireAdminApi("brands", "delete");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    return ok(await deleteBrand(id));
  } catch (err) {
    const message = errorMessage(err, "Failed");
    return fail("VALIDATION", message, 422);
  }
}
