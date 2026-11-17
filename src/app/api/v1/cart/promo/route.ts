import { errorMessage, fail, fromError, ok } from "@/server/lib/api";
import { getGuestId } from "@/server/lib/guest";
import { applyCartPromo, clearCartPromo } from "@/server/modules/commerce/cart.service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: string; locale?: string };
    if (!body.code) return fail("VALIDATION", "Code required", 422);
    const guestId = await getGuestId();
    return ok(await applyCartPromo(guestId, body.code, body.locale || "en"));
  } catch (err) {
    const message = errorMessage(err, "Could not apply");
    return fail("PROMO", message, 422);
  }
}

export async function DELETE(request: Request) {
  try {
    const locale = new URL(request.url).searchParams.get("locale") || "en";
    const guestId = await getGuestId();
    return ok(await clearCartPromo(guestId, locale));
  } catch (err) {
    return fromError(err);
  }
}
