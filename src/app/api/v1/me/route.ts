import { fail, fromError, ok } from "@/server/lib/api";
import { requireCustomerApi } from "@/server/lib/require-customer";
import { listMyOrders, updateProfile } from "@/server/modules/account/account.service";

export async function GET() {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  try {
    const orders = await listMyOrders(gate.customer!.id);
    return ok({ customer: gate.customer, lastOrder: orders[0] || null, orderCount: orders.length });
  } catch (err) {
    return fromError(err);
  }
}

export async function PATCH(request: Request) {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  try {
    const customer = await updateProfile(gate.customer!.id, await request.json());
    if (!customer) return fail("NOT_FOUND", "Account not found", 404);
    return ok({ customer });
  } catch (err) {
    return fromError(err);
  }
}
