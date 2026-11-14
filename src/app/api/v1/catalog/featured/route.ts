import { fromError, ok } from "@/server/lib/api";
import { listFeatured } from "@/server/modules/catalog/product.service";

export async function GET(request: Request) {
  try {
    const locale = new URL(request.url).searchParams.get("locale") || "en";
    const products = await listFeatured(locale);
    return ok({ products });
  } catch (err) {
    return fromError(err);
  }
}
