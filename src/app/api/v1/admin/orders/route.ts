import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { listOrders } from "@/server/modules/commerce/order.service";

export async function GET(request: Request) {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || undefined;
    const q = url.searchParams.get("q") || undefined;
    const channel = url.searchParams.get("channel") || undefined;
    const from = url.searchParams.get("from") || undefined;
    return ok({ orders: await listOrders(status, q, { channel, from }) });
  } catch (err) {
    return fromError(err);
  }
}
