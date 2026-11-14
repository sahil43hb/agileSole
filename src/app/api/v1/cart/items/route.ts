import { z } from "zod";
import { fail, fromError, ok } from "@/server/lib/api";
import { getGuestId } from "@/server/lib/guest";
import { addCartItem, setCartItem } from "@/server/modules/commerce/cart.service";

const bodySchema = z.object({
  sku: z.string().min(1),
  qty: z.number().int().optional(),
  locale: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const guestId = await getGuestId();
    const cart = await addCartItem(guestId, body.sku, body.qty ?? 1, body.locale || "en");
    return ok(cart);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not add";
    if (message.includes("left") || message.includes("available") || message.includes("sale")) {
      return fail("STOCK", message, 409);
    }
    return fromError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = bodySchema.extend({ qty: z.number().int() }).parse(await request.json());
    const guestId = await getGuestId();
    return ok(await setCartItem(guestId, body.sku, body.qty, body.locale || "en"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update";
    if (message.includes("left") || message.includes("available")) {
      return fail("STOCK", message, 409);
    }
    return fromError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const sku = new URL(request.url).searchParams.get("sku") || "";
    const locale = new URL(request.url).searchParams.get("locale") || "en";
    if (!sku) return fail("VALIDATION", "SKU required", 422);
    const guestId = await getGuestId();
    return ok(await setCartItem(guestId, sku, 0, locale));
  } catch (err) {
    return fromError(err);
  }
}
