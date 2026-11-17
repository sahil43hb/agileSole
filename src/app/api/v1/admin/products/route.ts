import { errorMessage, fail, fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import { createProduct, listAdminProducts } from "@/server/modules/catalog/product.service";

export async function GET(request: Request) {
  const gate = await requireAdminApi("products", "view");
  if (gate.response) return gate.response;
  try {
    const q = new URL(request.url).searchParams.get("q") || undefined;
    return ok({ products: await listAdminProducts(q) });
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(request: Request) {
  const gate = await requireAdminApi("products", "create");
  if (gate.response) return gate.response;
  try {
    const product = await createProduct(await request.json());
    return ok({ product }, 201);
  } catch (err) {
    const message = errorMessage(err, "Could not create");
    if (message.includes("already") || message.includes("required") || message.includes("SKU")) {
      return fail("VALIDATION", message, 422);
    }
    return fromError(err);
  }
}
