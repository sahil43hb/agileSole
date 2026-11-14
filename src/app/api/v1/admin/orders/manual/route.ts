import { fail, fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { placeManualOrder } from "@/server/modules/commerce/order.service";

export async function POST(request: Request) {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  try {
    const order = await placeManualOrder(gate.staff!.id, await request.json());
    return ok({ order }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create";
    return fail("MANUAL_ORDER", message, 422);
  }
}
