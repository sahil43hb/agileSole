import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { listTickets } from "@/server/modules/account/account.service";

export async function GET(request: Request) {
  const gate = await requireAdminApi("tickets", "view");
  if (gate.response) return gate.response;
  try {
    const status = new URL(request.url).searchParams.get("status") || undefined;
    return ok({ tickets: await listTickets(status) });
  } catch (err) {
    return fromError(err);
  }
}
