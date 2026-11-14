import { fromError, ok } from "@/server/lib/api";
import {
  getSizeChart,
  listBrands,
  listCategories,
  listCollections,
  listSizeCharts,
} from "@/server/modules/catalog/taxonomy.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "en";
    const chart = searchParams.get("sizeChart");
    if (chart) {
      return ok({ chart: await getSizeChart(chart, locale) });
    }
    const [categories, brands, collections, sizeCharts] = await Promise.all([
      listCategories(locale),
      listBrands(locale),
      listCollections(locale),
      listSizeCharts(locale),
    ]);
    return ok({ categories, brands, collections, sizeCharts });
  } catch (err) {
    return fromError(err);
  }
}
