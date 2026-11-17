import { errorMessage, fail, ok } from "@/server/lib/api";
import { requireCustomerApi } from "@/server/lib/require-customer";
import { requestReturn } from "@/server/modules/account/account.service";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const body = z.object({ reason: z.string().optional() }).parse(await request.json().catch(() => ({})));
    const order = await requestReturn(gate.customer!.id, id, body.reason || "");
    return ok({ order });
  } catch (err) {
    const message = errorMessage(err, "Could not request return");
    return fail("RETURN", message, 422);
  }
}
