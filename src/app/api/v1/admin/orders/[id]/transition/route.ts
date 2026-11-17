import { z } from "zod";
import { errorMessage, fail, fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { transitionOrder } from "@/server/modules/commerce/order.service";
import { ORDER_STATUSES } from "@/shared/constants";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("orders", "update");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const body = z
      .object({
        to: z.enum(ORDER_STATUSES),
        note: z.string().optional(),
      })
      .parse(await request.json());
    const order = await transitionOrder(id, body.to, gate.staff!.id, body.note);
    return ok({ order });
  } catch (err) {
    const message = errorMessage(err, "Could not update");
    if (
      message.includes("Cannot") ||
      message.includes("not found") ||
      message.includes("tracking") ||
      message.includes("consignment")
    ) {
      return fail("TRANSITION", message, 422);
    }
    return fromError(err);
  }
}
