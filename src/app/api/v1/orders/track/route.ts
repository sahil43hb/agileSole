import { fail, fromError, ok } from "@/server/lib/api";
import { trackGuestOrder } from "@/server/modules/commerce/order.service";
import { clientKey, rateLimit } from "@/server/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const limited = rateLimit(clientKey(request.headers, "track-order"), 20, 10 * 60_000);
    if (!limited.ok) return fail("RATE_LIMIT", "Too many tracking lookups", 429);
    const url = new URL(request.url);
    const number = url.searchParams.get("number") || "";
    const phone = url.searchParams.get("phone") || "";
    const locale = url.searchParams.get("locale") || "en";
    if (!number || !phone) return fail("VALIDATION", "Order number and phone are required", 422);
    const order = await trackGuestOrder(number, phone, locale);
    if (!order) return fail("NOT_FOUND", "No order matches that number and phone", 404);
    return ok({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not track";
    if (message.includes("mobile") || message.includes("Pakistan")) {
      return fail("VALIDATION", message, 422);
    }
    return fromError(err);
  }
}
