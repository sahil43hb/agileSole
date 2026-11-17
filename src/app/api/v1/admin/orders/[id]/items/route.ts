import { errorMessage, fail, fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { updateOrderItems } from "@/server/modules/commerce/order.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("orders", "update");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const order = await updateOrderItems(id, await request.json(), gate.staff!.id);
    return ok({ order });
  } catch (err) {
    const message = errorMessage(err, "Could not update items");
    if (
      message.includes("before packing") ||
      message.includes("already") ||
      message.includes("at least") ||
      message.includes("extra left") ||
      message.includes("not found") ||
      message.includes("Keep at least")
    ) {
      return fail("ORDER_ITEMS", message, 422);
    }
    return fromError(err);
  }
}
