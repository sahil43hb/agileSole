import { fromError, ok } from "@/server/lib/api";
import { getGuestId } from "@/server/lib/guest";
import { getCart } from "@/server/modules/commerce/cart.service";

export async function GET(request: Request) {
  try {
    const locale = new URL(request.url).searchParams.get("locale") || "en";
    const guestId = await getGuestId();
    return ok(await getCart(guestId, locale));
  } catch (err) {
    return fromError(err);
  }
}
