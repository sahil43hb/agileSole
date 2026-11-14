import { fromError, ok } from "@/server/lib/api";
import { requireCustomerApi } from "@/server/lib/require-customer";
import { openTicket } from "@/server/modules/account/account.service";

export async function POST(request: Request) {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  try {
    return ok({ ticket: await openTicket(gate.customer!.id, await request.json()) }, 201);
  } catch (err) {
    return fromError(err);
  }
}
