import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { dashboardSnapshot } from "@/server/modules/admin/dashboard.service";

export async function GET() {
  const gate = await requireAdminApi("dashboard", "view");
  if (gate.response) return gate.response;
  try {
    const data = await dashboardSnapshot();
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}
