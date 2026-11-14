import { fromError, ok } from "@/server/lib/api";
import { requireCustomerApi } from "@/server/lib/require-customer";
import { listMyOrders } from "@/server/modules/account/account.service";

export async function GET(request: Request) {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  try {
    const locale = new URL(request.url).searchParams.get("locale") || "en";
    return ok({ orders: await listMyOrders(gate.customer!.id, locale) });
  } catch (err) {
    return fromError(err);
  }
}
