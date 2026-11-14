import { fromError } from "@/server/lib/api";
import { googleMerchantTsv } from "@/server/modules/catalog/feed.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const body = await googleMerchantTsv();
    return new Response(body, {
      headers: {
        "Content-Type": "text/tab-separated-values; charset=utf-8",
        "Content-Disposition": 'attachment; filename="agile-sole-google.txt"',
      },
    });
  } catch (err) {
    return fromError(err);
  }
}
