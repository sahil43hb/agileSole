import { fromError, ok } from "@/server/lib/api";
import { listBySlugs } from "@/server/modules/catalog/product.service";

export async function GET(request: Request) {
  try {
    const sp = new URL(request.url).searchParams;
    const slugs = (sp.get("slugs") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const locale = sp.get("locale") || "en";
    return ok({ products: await listBySlugs(slugs, locale) });
  } catch (err) {
    return fromError(err);
  }
}
