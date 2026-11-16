export const LOCALES = ["en", "ur"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const ADMIN_COOKIE = "as_admin_session";
export const CUSTOMER_COOKIE = "as_customer_session";

export const CURRENCY = "PKR";

export const BRAND = {
  name: "Agile Sole",
  handle: "AgileSole",
  city: "Gujranwala",
  cityUr: "گوجرانوالہ",
  country: "PK",
  tagline: {
    en: "Every Step a Perfect Beat",
    ur: "ہر قدم ایک مکمل تال ہے",
  },
  positioning: {
    en: "Stepping up your footwear game, one pair at a time",
    ur: "آرام اور انداز کے ساتھ، ایک جوڑی ایک وقت میں",
  },
};

export function brandCity(locale?: string) {
  return locale === "ur" ? BRAND.cityUr : BRAND.city;
}

export const ORDER_STATUSES = [
  "draft",
  "pending_confirmation",
  "unreachable",
  "on_hold",
  "confirmed",
  "packed",
  "pickup_ready",
  "shipped",
  "out_for_delivery",
  "delivered",
  "delivery_failed",
  "returned",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
