import { errorMessage, fail, fromError, ok } from "@/server/lib/api";
import { getGuestId } from "@/server/lib/guest";
import { getSessionCustomer } from "@/server/lib/require-customer";
import { placeOrder } from "@/server/modules/commerce/order.service";
import { clientKey, rateLimit } from "@/server/lib/rate-limit";
import { isPkMobile, normalizePkPhone } from "@/shared/phone";

export async function POST(request: Request) {
  try {
    const limited = rateLimit(clientKey(request.headers, "place-order"), 8, 10 * 60_000);
    if (!limited.ok) return fail("RATE_LIMIT", "Too many checkout attempts", 429);
    const guestId = await getGuestId();
    const body: unknown = await request.json();
    const checkoutPhone =
      typeof body === "object" &&
      body !== null &&
      "address" in body &&
      typeof (body as { address?: { phone?: unknown } }).address?.phone === "string"
        ? (body as { address: { phone: string } }).address.phone
        : "";
    const session = await getSessionCustomer();
    const sessionPhone = typeof session?.phone === "string" ? session.phone : "";
    const skipOtp = Boolean(
      sessionPhone &&
        isPkMobile(checkoutPhone) &&
        isPkMobile(sessionPhone) &&
        normalizePkPhone(checkoutPhone) === normalizePkPhone(sessionPhone),
    );
    const order = await placeOrder(guestId, body, skipOtp ? { skipOtp: true } : undefined);
    return ok({ order }, 201);
  } catch (err) {
    const message = errorMessage(err, "Could not place order");
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
