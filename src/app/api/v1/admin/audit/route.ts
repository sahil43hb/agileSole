import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { listAudit } from "@/server/modules/admin/audit.service";

export async function GET() {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  if (gate.staff!.role !== "super_admin" && gate.staff!.role !== "reporter") {
    const { fail } = await import("@/server/lib/api");
    return fail("FORBIDDEN", "Not allowed", 403);
  }
  try {
    return ok({ entries: await listAudit(200) });
  } catch (err) {
    return fromError(err);
  }
}
