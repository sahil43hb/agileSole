import { fail, fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { getOrderById } from "@/server/modules/commerce/order.service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const gate = await requireAdminApi("orders", "view");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const order = await getOrderById(id);
    if (!order) return fail("NOT_FOUND", "Order not found", 404);
    return ok({ order });
  } catch (err) {
    return fromError(err);
  }
}
