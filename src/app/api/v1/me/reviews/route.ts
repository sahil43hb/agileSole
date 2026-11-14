import { fromError, ok } from "@/server/lib/api";
import { requireCustomerApi } from "@/server/lib/require-customer";
import { listMyReviews } from "@/server/modules/account/account.service";

export async function GET() {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  try {
    return ok({ reviews: await listMyReviews(gate.customer!.id) });
  } catch (err) {
    return fromError(err);
  }
}
