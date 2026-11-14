export type Consent = "all" | "necessary";

export const CONSENT_KEY = "as_cookie_consent";

export function getConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === "all" || value === "necessary") return value;
  if (localStorage.getItem("as_cookie") === "1") return "all";
  return null;
}

export function setConsent(value: Consent) {
  localStorage.setItem(CONSENT_KEY, value);
  localStorage.setItem("as_cookie", value === "all" ? "1" : "0");
  window.dispatchEvent(new Event("as-consent"));
}

export function hasMarketingConsent() {
  return getConsent() === "all";
}

export function trackEvent(name: "add_to_cart" | "purchase" | "page_view", params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !hasMarketingConsent()) return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq;
  gtag?.("event", name, params);
  if (name === "add_to_cart") fbq?.("track", "AddToCart", params);
  if (name === "purchase") fbq?.("track", "Purchase", params);
}
