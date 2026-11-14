import type { OrderStatus } from "./constants";

export const TRACK_STEPS = [
  "pending_confirmation",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;

export const STATUS_COPY: Record<
  OrderStatus | "placed",
  { en: string; ur: string; hint: { en: string; ur: string } }
> = {
  draft: {
    en: "Draft",
    ur: "مسودہ",
    hint: { en: "Not placed yet.", ur: "ابھی آرڈر نہیں ہوا۔" },
  },
  pending_confirmation: {
    en: "Placed",
    ur: "آرڈر ہو گیا",
    hint: { en: "We will call to confirm before packing.", ur: "پیکنگ سے پہلے تصدیق کے لیے کال کریں گے۔" },
  },
  unreachable: {
    en: "Trying to reach you",
    ur: "آپ سے رابطے کی کوشش",
    hint: { en: "Please answer our call or WhatsApp.", ur: "براہ کرم ہماری کال یا واٹس ایپ کا جواب دیں۔" },
  },
  on_hold: {
    en: "On hold",
    ur: "روکا ہوا",
    hint: { en: "We paused this order. We will update you.", ur: "آرڈر روک دیا ہے۔ جلد بتائیں گے۔" },
  },
  confirmed: {
    en: "Confirmed",
    ur: "تصدیق شدہ",
    hint: { en: "Preparing your pair.", ur: "جوڑی تیار ہو رہی ہے۔" },
  },
  packed: {
    en: "Packed",
    ur: "پیک ہو گیا",
    hint: { en: "Packed and ready to leave Gujranwala.", ur: "گوجرانوالہ سے روانگی کے لیے تیار۔" },
  },
  pickup_ready: {
    en: "Ready for pickup",
    ur: "وصولی کے لیے تیار",
    hint: { en: "Collect from the store when convenient.", ur: "اسٹور سے وصول کر لیں۔" },
  },
  shipped: {
    en: "Shipped",
    ur: "روانہ",
    hint: { en: "On the way with the courier.", ur: "کورئیر کے ساتھ راستے میں۔" },
  },
  out_for_delivery: {
    en: "Out for delivery",
    ur: "ڈیلیوری پر",
    hint: { en: "The rider is out. Keep COD cash ready.", ur: "رائیڈر نکل چکا ہے۔ کیش تیار رکھیں۔" },
  },
  delivered: {
    en: "Delivered",
    ur: "پہنچ گیا",
    hint: { en: "Enjoy the pair. Size exchange is in the policy.", ur: "جوڑی استعمال کریں۔ سائز تبدیلی پالیسی میں ہے۔" },
  },
  delivery_failed: {
    en: "Delivery attempt failed",
    ur: "ڈیلیوری نہیں ہو سکی",
    hint: { en: "We will try again or return the parcel.", ur: "دوبارہ کوشش یا واپسی۔" },
  },
  returned: {
    en: "Returned",
    ur: "واپس",
    hint: { en: "This order was returned.", ur: "یہ آرڈر واپس ہو گیا۔" },
  },
  cancelled: {
    en: "Cancelled",
    ur: "منسوخ",
    hint: { en: "This order was cancelled. Stock was released.", ur: "آرڈر منسوخ۔ اسٹاک واپس۔" },
  },
  placed: {
    en: "Placed",
    ur: "آرڈر ہو گیا",
    hint: { en: "We have your order.", ur: "آرڈر مل گیا۔" },
  },
};

export function statusLabel(status: string, locale = "en") {
  const row = STATUS_COPY[status as OrderStatus];
  if (!row) return status.replaceAll("_", " ");
  return locale === "ur" ? row.ur : row.en;
}

export function statusHint(status: string, locale = "en") {
  const row = STATUS_COPY[status as OrderStatus];
  if (!row) return "";
  return locale === "ur" ? row.hint.ur : row.hint.en;
}

export function timelineFor(status: string) {
  const side = ["unreachable", "on_hold", "cancelled", "delivery_failed", "returned", "pickup_ready"];
  if (side.includes(status)) {
    return { steps: [...TRACK_STEPS], current: status, interrupted: true };
  }
  const idx = TRACK_STEPS.indexOf(status as (typeof TRACK_STEPS)[number]);
  return { steps: [...TRACK_STEPS], current: status, interrupted: false, activeIndex: idx < 0 ? 0 : idx };
}

export const CUSTOMER_CANCEL_STATUSES = ["pending_confirmation", "confirmed"] as const;
export const CUSTOMER_RETURN_STATUSES = ["delivered"] as const;
