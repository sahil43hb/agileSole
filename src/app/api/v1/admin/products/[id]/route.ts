import { z } from "zod";
import { errorMessage, fail, fromError, ok } from "@/server/lib/api";
import { requireAdminApi } from "@/server/lib/require-admin";
import {
  deleteProduct,
  getAdminProduct,
  setProductStatus,
  updateProduct,
} from "@/server/modules/catalog/product.service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const gate = await requireAdminApi("products", "view");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const product = await getAdminProduct(id);
    if (!product) return fail("NOT_FOUND", "Product not found", 404);
    return ok({ product });
  } catch (err) {
    return fromError(err);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireAdminApi("products", "update");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    if (body?.status && !body.title && !body.variants) {
      const status = z.enum(["draft", "active", "archived", "unlisted"]).parse(body.status);
      return ok({ product: await setProductStatus(id, status) });
    }
    const product = await updateProduct(id, body);
    return ok({ product });
  } catch (err) {
    const message = errorMessage(err, "Could not update");
    if (message.includes("already") || message.includes("not found") || message.includes("SKU")) {
      return fail("VALIDATION", message, 422);
    }
    return fromError(err);
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  const gate = await requireAdminApi("products", "delete");
  if (gate.response) return gate.response;
  try {
    const { id } = await ctx.params;
    return ok(await deleteProduct(id));
  } catch (err) {
    return fromError(err);
  }
}
