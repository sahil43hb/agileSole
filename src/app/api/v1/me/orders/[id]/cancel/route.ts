import { fail, fromError, ok } from "@/server/lib/api";
import { requireCustomerApi } from "@/server/lib/require-customer";
import { requestCancel } from "@/server/modules/account/account.service";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const body = z.object({ reason: z.string().optional() }).parse(await request.json().catch(() => ({})));
    const order = await requestCancel(gate.customer!.id, id, body.reason || "");
    return ok({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not cancel";
    return fail("CANCEL", message, 422);
  }
}
