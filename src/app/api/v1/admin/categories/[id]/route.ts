import { errorMessage, fail, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { deleteCategory, setCategoryActive, upsertCategory } from "@/server/modules/catalog/taxonomy.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("categories", "update");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    if (body && typeof body.isActive === "boolean" && Object.keys(body).length === 1) {
      return ok({ category: await setCategoryActive(id, body.isActive) });
    }
    return ok({ category: await upsertCategory(body, id) });
  } catch (err) {
    const message = errorMessage(err, "Failed");
    return fail("VALIDATION", message, 422);
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  const gate = await requireAdminApi("categories", "delete");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    return ok(await deleteCategory(id));
  } catch (err) {
    const message = errorMessage(err, "Failed");
    return fail("VALIDATION", message, 422);
  }
}
