import { errorMessage, fail, fromError, ok } from "@/server/lib/api";
import { requireCustomerApi } from "@/server/lib/require-customer";
import { removeAddress, updateAddress } from "@/server/modules/account/account.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const customer = await updateAddress(gate.customer!.id, id, await request.json());
    return ok({ customer });
  } catch (err) {
    const message = errorMessage(err, "Could not save");
    if (message !== "Something went wrong") {
      return fail("VALIDATION", message, 400);
    }
    return fromError(err);
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const customer = await removeAddress(gate.customer!.id, id);
    return ok({ customer });
  } catch (err) {
    const message = errorMessage(err, "Could not remove");
    if (message !== "Something went wrong") {
      return fail("VALIDATION", message, 400);
    }
    return fromError(err);
  }
}
