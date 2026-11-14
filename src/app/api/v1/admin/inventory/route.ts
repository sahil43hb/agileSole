import { fail, fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { adjustInventory, listInventory } from "@/server/modules/catalog/taxonomy.service";
import { z } from "zod";

export async function GET() {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  try {
    return ok({ rows: await listInventory() });
  } catch (err) {
    return fromError(err);
  }
}

export async function PATCH(request: Request) {
  const gate = await requireAdminApi();
  if (gate.response) return gate.response;
  try {
    const body = z.object({ sku: z.string(), onHand: z.number().int().min(0) }).parse(await request.json());
    return ok(await adjustInventory(body.sku, body.onHand));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return fail("VALIDATION", message, 422);
  }
}
