import { z } from "zod";
import { fail, fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { updateShipment } from "@/server/modules/commerce/order.service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const body = z
      .object({
        courierName: z.string().optional(),
        trackingNumber: z.string().optional(),
        trackingUrl: z.string().optional(),
      })
      .parse(await request.json());
    return ok({ order: await updateShipment(id, body) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save";
    return fail("SHIPMENT", message, 422);
  }
}
