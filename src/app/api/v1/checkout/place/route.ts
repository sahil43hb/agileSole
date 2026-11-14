import { fail, fromError, ok } from "@/server/lib/api";
import { getGuestId } from "@/server/lib/guest";
import { placeOrder } from "@/server/modules/commerce/order.service";
import { clientKey, rateLimit } from "@/server/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const limited = rateLimit(clientKey(request.headers, "place-order"), 8, 10 * 60_000);
    if (!limited.ok) return fail("RATE_LIMIT", "Too many checkout attempts", 429);
    const guestId = await getGuestId();
    const order = await placeOrder(guestId, await request.json());
    return ok({ order }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not place order";
    if (
      message.includes("OTP") ||
      message.includes("empty") ||
      message.includes("stock") ||
      message.includes("left") ||
      message.includes("mobile") ||
      message.includes("city") ||
      message.includes("province")
    ) {
      return fail("CHECKOUT", message, 422);
    }
    return fromError(err);
  }
}
