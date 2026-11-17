import { errorMessage, fail, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { markCodCollected } from "@/server/modules/commerce/order.service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_: Request, ctx: Ctx) {
  const gate = await requireAdminApi("orders", "update");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    return ok({ order: await markCodCollected(id, gate.staff!.id) });
  } catch (err) {
    const message = errorMessage(err, "Could not collect");
    return fail("COD", message, 422);
  }
}
