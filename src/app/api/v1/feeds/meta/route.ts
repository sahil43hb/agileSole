import { fromError } from "@/server/lib/api";
import { metaCatalogCsv } from "@/server/modules/catalog/feed.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const body = await metaCatalogCsv();
    return new Response(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="agile-sole-meta.csv"',
      },
    });
  } catch (err) {
    return fromError(err);
  }
}
