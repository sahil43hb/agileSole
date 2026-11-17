import { errorMessage, fail, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { importProductsCsv } from "@/server/modules/catalog/import.service";

export async function POST(request: Request) {
  const gate = await requireAdminApi("products", "create");
  if (gate.response) return gate.response;
  try {
    const text = await request.text();
    return ok(await importProductsCsv(text));
  } catch (err) {
    const message = errorMessage(err, "Import failed");
    return fail("IMPORT", message, 422);
  }
}
