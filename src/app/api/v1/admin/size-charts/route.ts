import { fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { listSizeCharts, upsertSizeChart } from "@/server/modules/catalog/taxonomy.service";

export async function GET() {
  const gate = await requireAdminApi("size_charts", "view");
  if (gate.response) return gate.response;
  try {
    return ok({ charts: await listSizeCharts("en") });
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(request: Request) {
  const gate = await requireAdminApi("size_charts", "create");
  if (gate.response) return gate.response;
  try {
    return ok({ chart: await upsertSizeChart(await request.json()) }, 201);
  } catch (err) {
    return fromError(err);
  }
}
