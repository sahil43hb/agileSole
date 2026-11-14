import { fromError, ok } from "@/server/lib/api";
import { requireCustomerApi } from "@/server/lib/require-customer";
import { removeAddress } from "@/server/modules/account/account.service";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, ctx: Ctx) {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const customer = await removeAddress(gate.customer!.id, id);
    return ok({ customer });
  } catch (err) {
    return fromError(err);
  }
}
