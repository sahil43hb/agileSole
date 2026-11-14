import { fail, fromError, ok } from "@/server/lib/api";
import { getBySlug } from "@/server/modules/catalog/product.service";

export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const locale = new URL(request.url).searchParams.get("locale") || "en";
    const product = await getBySlug(slug, locale);
    if (!product) return fail("NOT_FOUND", "Product not found", 404);
    return ok({ product });
  } catch (err) {
    return fromError(err);
  }
}
