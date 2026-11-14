import { fromError, ok } from "@/server/lib/api";
import { listCatalog } from "@/server/modules/catalog/product.service";

export async function GET(request: Request) {
  try {
    const sp = new URL(request.url).searchParams;
    const num = (key: string) => {
      const v = sp.get(key);
      return v ? Number(v) : undefined;
    };
    const data = await listCatalog({
      locale: sp.get("locale") || "en",
      category: sp.get("category") || undefined,
      brand: sp.get("brand") || undefined,
      collection: sp.get("collection") || undefined,
      gender: sp.get("gender") || undefined,
      size: sp.get("size") || undefined,
      color: sp.get("color") || undefined,
      type: sp.get("type") || undefined,
      q: sp.get("q") || undefined,
      minPrice: num("minPrice"),
      maxPrice: num("maxPrice"),
      inStock: sp.get("inStock") === "1",
      onSale: sp.get("onSale") === "1",
      sort: sp.get("sort") || undefined,
      page: num("page"),
      limit: num("limit"),
    });
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}
