import { fail, fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { listBrands, upsertBrand } from "@/server/modules/catalog/taxonomy.service";

export async function GET() {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  try {
    return ok({ brands: await listBrands() });
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(request: Request) {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  try {
    return ok({ brand: await upsertBrand(await request.json()) }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return fail("VALIDATION", message, 422);
  }
}
