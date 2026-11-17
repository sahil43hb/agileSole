import { errorMessage, fail, fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { listCollections, upsertCollection } from "@/server/modules/catalog/taxonomy.service";

export async function GET() {
  const gate = await requireAdminApi("collections", "view");
  if (gate.response) return gate.response;
  try {
    return ok({ collections: await listCollections() });
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(request: Request) {
  const gate = await requireAdminApi("collections", "create");
  if (gate.response) return gate.response;
  try {
    return ok({ collection: await upsertCollection(await request.json()) }, 201);
  } catch (err) {
    const message = errorMessage(err, "Failed");
    return fail("VALIDATION", message, 422);
  }
}
