import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { listAudit } from "@/server/modules/admin/audit.service";

export async function GET() {
  const gate = await requireAdminApi("audit", "view");
  if (gate.response) return gate.response;
  try {
    return ok({ entries: await listAudit(200) });
  } catch (err) {
    return fromError(err);
  }
}
