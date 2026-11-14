import { fail, fromError, ok } from "@/server/lib/api";
import { requireCustomerApi } from "@/server/lib/require-customer";
import { getMyOrder } from "@/server/modules/account/account.service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const locale = new URL(request.url).searchParams.get("locale") || "en";
    const order = await getMyOrder(gate.customer!.id, id, locale);
    if (!order) return fail("NOT_FOUND", "Order not found", 404);
    return ok({ order });
  } catch (err) {
    return fromError(err);
  }
}
