import { fromError, ok } from "@/server/lib/api";
import { requireCustomerApi } from "@/server/lib/require-customer";
import { requestDataExport } from "@/server/modules/account/account.service";

export async function POST() {
  const gate = await requireCustomerApi();
  if (gate.response) return gate.response;
  try {
    return ok(await requestDataExport(gate.customer!.id));
  } catch (err) {
    return fromError(err);
  }
}
