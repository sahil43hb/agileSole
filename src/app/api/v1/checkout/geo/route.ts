import { ok } from "@/server/lib/api";
import { geoPayload } from "@/server/modules/commerce/order.service";

export async function GET() {
  return ok(geoPayload());
}
