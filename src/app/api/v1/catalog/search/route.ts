import { fromError, ok } from "@/server/lib/api";
import { suggestSearch } from "@/server/modules/catalog/product.service";

export async function GET(request: Request) {
  try {
    const sp = new URL(request.url).searchParams;
    const data = await suggestSearch(sp.get("q") || "", sp.get("locale") || "en");
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}
