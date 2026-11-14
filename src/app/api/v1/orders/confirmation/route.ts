import { fail, fromError, ok } from "@/server/lib/api";
import { getGuestId } from "@/server/lib/guest";
import { getOrderByNumber } from "@/server/modules/commerce/order.service";

export async function GET(request: Request) {
  try {
    const number = new URL(request.url).searchParams.get("number") || "";
    if (!number) return fail("VALIDATION", "Order number required", 422);
    const guestId = await getGuestId();
    const order = await getOrderByNumber(number, guestId);
    if (!order) return fail("NOT_FOUND", "Order not found", 404);
    return ok({ order });
  } catch (err) {
    return fromError(err);
  }
}
