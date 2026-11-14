import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { listCustomers } from "@/server/modules/admin/customers.service";

export async function GET() {
  const gate = await requireAdminApi("customers");
  if (gate.response) return gate.response;
  try {
    return ok({ customers: await listCustomers() });
  } catch (err) {
    return fromError(err);
  }
}
