import { errorMessage, fail, fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { deleteDiscount, setDiscountActive, upsertDiscount } from "@/server/modules/commerce/discount.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("discounts", "update");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    if (body && typeof body.isActive === "boolean" && Object.keys(body).length === 1) {
      return ok({ discount: await setDiscountActive(id, body.isActive) });
    }
    return ok({ discount: await upsertDiscount(body, id) });
  } catch (err) {
    return fromError(err);
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  const gate = await requireAdminApi("discounts", "delete");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    return ok(await deleteDiscount(id));
  } catch (err) {
    const message = errorMessage(err, "Failed");
    return fail("VALIDATION", message, 422);
  }
}
