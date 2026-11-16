"use client";

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Banknote, MessageCircle, PhoneCall, ShieldCheck, Truck } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { formatPkr } from "@/shared/money";
import { useCart } from "./cart-provider";
import { useWishlist } from "./wishlist-provider";
import { Link } from "@/i18n/navigation";
import { PromoCode } from "./promo-code";
import { AppSelect } from "@/components/ui/app-select";
import { Switch } from "@/components/ui/switch";
import { ShippingEta } from "./shipping-eta";
import { geoLabel } from "@/content/geo-pk";
import { useAuth } from "./auth-provider";
import { isPkMobile, normalizePkPhone } from "@/shared/phone";

type SavedAddress = {
  fullName?: string;
  phone?: string;
  altPhone?: string;
  province?: string;
  city?: string;
  area?: string;
  street?: string;
  landmark?: string;
  isDefault?: boolean;
};

function phonesMatch(a?: string, b?: string) {
  if (!a || !b) return false;
  try {
    return isPkMobile(a) && isPkMobile(b) && normalizePkPhone(a) === normalizePkPhone(b);
  } catch {
    return false;
  }
}

type Geo = {
  provinces: { name: string; cities: string[] }[];
  shipping: { fee: number; eta: string; name: string };
};

const field =
  "mt-1.5 w-full rounded-2xl border-0 bg-[#f3f5f2] px-4 py-3 text-sm outline-none ring-1 ring-transparent transition placeholder:text-ink-faint focus:bg-white focus:ring-brand/40";

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block text-xs font-medium text-ink-muted ${className}`}>
      {label}
      {children}
    </label>
  );
}

function Card({ step, title, hint, children }: { step?: string; title: string; hint?: string; children?: ReactNode }) {
  return (
    <section className="rounded-[1.5rem] bg-white p-5 shadow-[0_10px_36px_rgba(17,17,17,0.04)] ring-1 ring-black/[0.04] md:p-6">
      <div className="flex items-start gap-3">
        {step ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-paper">
            {step}
          </span>
        ) : null}
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {hint ? <p className="mt-0.5 text-sm text-ink-muted">{hint}</p> : null}
        </div>
      </div>
      {children ? <div className="mt-5 space-y-3">{children}</div> : null}
    </section>
  );
}

function idempotency() {
  if (typeof window === "undefined") return "";
  const key = "as_checkout_idemp";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  sessionStorage.setItem(key, next);
  return next;
}

export function CheckoutForm() {
  const locale = useLocale();
  const t = useTranslations("checkout");
  const c = useTranslations("common");
  const router = useRouter();
  const { cart, loading, refresh } = useCart();
  const { customer: sessionCustomer } = useAuth();
  const { markBought } = useWishlist();
  const [geo, setGeo] = useState<Geo | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [email, setEmail] = useState("");
  const [province, setProvince] = useState("Punjab");
  const [city, setCity] = useState("Gujranwala");
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [callBeforeDelivery, setCallBeforeDelivery] = useState(true);
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refresh();
    fetch("/api/v1/checkout/geo")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setGeo(json.data as Geo);
      })
      .catch(() => {});
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || !json.ok) return;
        const profile = json.data.customer as {
          name?: string;
          phone?: string;
          email?: string;
          whatsappOptIn?: boolean;
          addresses?: SavedAddress[];
        };
        const addresses = profile.addresses || [];
        const saved = addresses.find((a) => a.isDefault) || addresses[0];
        const last = (json.data.lastOrder as { shippingAddress?: SavedAddress } | null)?.shippingAddress;
        const from = saved || last;
        setFullName((v) => v || from?.fullName || profile.name || "");
        setPhone((v) => v || from?.phone || profile.phone || "");
        setEmail((v) => v || profile.email || "");
        if (typeof profile.whatsappOptIn === "boolean") setWhatsappOptIn(profile.whatsappOptIn);
        if (from) {
          setAltPhone((v) => v || from.altPhone || "");
          if (from.province) setProvince(from.province);
          if (from.city) setCity(from.city);
          setArea((v) => v || from.area || "");
          setStreet((v) => v || from.street || "");
          setLandmark((v) => v || from.landmark || "");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const cities = useMemo(() => {
    return geo?.provinces.find((p) => p.name === province)?.cities || [];
  }, [geo, province]);

  async function sendOtp() {
    setMessage("");
    const res = await fetch("/api/v1/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: phone, purpose: "checkout" }),
    });
    const json = await res.json();
    if (!json.ok) {
      setMessage(json.error?.message || t("otpFail"));
      return;
    }
    setOtpSent(true);
    const hint = json.data?.devCode ? t("codeSentDev", { code: json.data.devCode }) : t("codeSent");
    setMessage(hint);
    if (json.data?.devCode) setOtp(String(json.data.devCode));
  }

  async function place(e: FormEvent) {
    e.preventDefault();
    if (!acceptTerms) {
      setMessage(t("acceptTerms"));
      return;
    }
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/v1/checkout/place", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        email,
        notes,
        deliveryInstructions,
        callBeforeDelivery,
        whatsappOptIn,
        acceptTerms: true,
        otp: phonesMatch(sessionCustomer?.phone, phone) ? undefined : otp,
        idempotencyKey: idempotency(),
        address: {
          fullName,
          phone,
          altPhone,
          country: "PK",
          province,
          city,
          area,
          street,
          landmark,
        },
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setMessage(json.error?.message || t("placeFail"));
      return;
    }
    sessionStorage.removeItem("as_checkout_idemp");
    const placed = json.data.order as { number: string; items?: { slug?: string }[] };
    markBought((placed.items || []).map((item) => item.slug || ""));
    await refresh();
    router.push(`/checkout/confirmation?number=${encodeURIComponent(placed.number)}`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-site px-4 py-16">
        <p className="text-sm text-ink-muted">{t("loading")}</p>
      </div>
    );
  }

  if (!cart.lines.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-dark">{t("title")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("emptyTitle")}</h1>
        <p className="mt-3 text-sm text-ink-muted">{t("emptyBody")}</p>
        <Link href="/shop" className="btn-primary mt-8 inline-flex h-12 rounded-full px-6">
          {c("continueShopping")}
        </Link>
      </div>
    );
  }

  const placeLabel = busy ? t("placing") : t("place", { amount: formatPkr(cart.total) });
  const signedIn = Boolean(sessionCustomer);
  const skipOtp = phonesMatch(sessionCustomer?.phone, phone);

  return (
    <div className="bg-[#f6f7f5]">
      <div className="mx-auto grid max-w-site gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-12 lg:py-12">
        <form id="agile-checkout" onSubmit={place} className="space-y-5 pb-24 lg:pb-0" data-testid="checkout-form">
          <div>
            <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("back")}
            </Link>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{t("title")}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium ring-1 ring-black/[0.06]">
                <Banknote className="h-3.5 w-3.5 text-brand" />
                {t("cod")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium ring-1 ring-black/[0.06]">
                <Truck className="h-3.5 w-3.5 text-brand" />
                <ShippingEta eta={geo?.shipping.eta} />
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium ring-1 ring-black/[0.06]">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                {t("exchange")}
              </span>
            </div>
          </div>

          <Card step="1" title={t("contact")} hint={signedIn ? t("signedInHint") : t("contactHint")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("fullName")}>
                <input
                  required
                  data-testid="checkout-name"
                  dir="auto"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  className={field}
                />
              </Field>
              <Field label={t("mobile")}>
                <input
                  required
                  data-testid="checkout-phone"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03XX XXXXXXX"
                  className={field}
                />
              </Field>
              <Field label={t("altPhone")}>
                <input value={altPhone} onChange={(e) => setAltPhone(e.target.value)} placeholder={c("optional")} className={field} />
              </Field>
              <Field label={t("email")}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={c("optional")} className={field} />
              </Field>
            </div>
          </Card>

          <Card step="2" title={t("address")} hint={t("addressHint")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("province")}>
                <AppSelect
                  tone="store"
                  value={province}
                  onChange={(next) => {
                    setProvince(next);
                    const nextCities = geo?.provinces.find((p) => p.name === next)?.cities || [];
                    setCity(nextCities[0] || "");
                  }}
                  options={(geo?.provinces || []).map((p) => ({ value: p.name, label: geoLabel(p.name, locale) }))}
                />
              </Field>
              <Field label={t("city")}>
                <AppSelect
                  tone="store"
                  value={city}
                  onChange={setCity}
                  options={cities.map((c) => ({ value: c, label: geoLabel(c, locale) }))}
                />
              </Field>
            </div>
            <Field label={t("area")}>
              <input value={area} onChange={(e) => setArea(e.target.value)} placeholder={t("areaPlaceholder")} className={field} />
            </Field>
            <Field label={t("street")}>
              <input
                required
                data-testid="checkout-street"
                dir="auto"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder={t("streetPlaceholder")}
                className={field}
              />
            </Field>
            <Field label={t("landmark")}>
              <input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder={t("landmarkPlaceholder")} className={field} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("deliveryNotes")}>
                <textarea
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder={t("deliveryPlaceholder")}
                  className={`${field} min-h-[4.25rem] resize-y`}
                  rows={2}
                />
              </Field>
              <Field label={t("orderNote")}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("orderNotePlaceholder")}
                  className={`${field} min-h-[4.25rem] resize-y`}
                  rows={2}
                />
              </Field>
            </div>
          </Card>

          <Card step="3" title={t("preferences")}>
            <div className="flex items-start justify-between gap-3 rounded-2xl bg-[#f6f7f5] px-4 py-3">
              <span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  <PhoneCall className="h-3.5 w-3.5 text-brand" />
                  {t("callBefore")}
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">{t("callBeforeHint")}</span>
              </span>
              <Switch on={callBeforeDelivery} onChange={() => setCallBeforeDelivery((v) => !v)} label={t("callBefore")} />
            </div>
            <div className="flex items-start justify-between gap-3 rounded-2xl bg-[#f6f7f5] px-4 py-3">
              <span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  <MessageCircle className="h-3.5 w-3.5 text-brand" />
                  {t("whatsapp")}
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">{t("whatsappHint")}</span>
              </span>
              <Switch on={whatsappOptIn} onChange={() => setWhatsappOptIn((v) => !v)} label={t("whatsapp")} />
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#f6f7f5] px-4 py-3">
              <input
                type="checkbox"
                data-testid="checkout-terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#1f8a4c]"
              />
              <span className="text-sm text-ink">
                {t("agree")}{" "}
                <Link href="/terms" className="font-medium text-brand-dark underline-offset-2 hover:underline">
                  {t("terms")}
                </Link>
              </span>
            </label>
          </Card>

          {skipOtp ? (
            <Card step="4" title={t("otpTitle")} hint={t("otpSkipped")} />
          ) : (
          <Card step="4" title={t("otpTitle")} hint={t("otpHint")}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                data-testid="checkout-send-otp"
                className="h-11 shrink-0 rounded-full bg-[#f3f5f2] px-5 text-sm font-medium transition hover:bg-[#e8ece8]"
                onClick={() => void sendOtp()}
              >
                {otpSent ? t("resendCode") : t("sendCode")}
              </button>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                data-testid="checkout-otp"
                placeholder="••••••"
                className={`${field} mt-0 max-w-[12rem] text-center text-lg tracking-[0.45em]`}
                required
              />
            </div>
          </Card>
          )}

          {message ? (
            <p className={`px-1 text-sm ${message.toLowerCase().includes("could not") || message.startsWith("Please") ? "text-red-600" : "text-ink-muted"}`}>
              {message}
            </p>
          ) : null}

          <button type="submit" data-testid="checkout-place" disabled={busy} className="btn-primary hidden h-12 w-full rounded-full px-6 disabled:opacity-60 md:inline-flex">
            {placeLabel}
          </button>
        </form>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_10px_36px_rgba(17,17,17,0.04)] ring-1 ring-black/[0.04] md:p-6">
            <h2 className="text-base font-semibold tracking-tight">{t("bag")}</h2>
            <ul className="mt-4 space-y-4">
              {cart.lines.map((line) => (
                <li key={line.sku} className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-mist">
                    {line.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.image} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{line.title}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {line.color ? `${line.color} · ` : ""}EU {line.sizeEu} × {line.qty}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium">{formatPkr(line.price * line.qty)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-5 border-t border-black/[0.06] pt-4">
              <PromoCode />
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink-muted">
                <dt>{c("subtotal")}</dt>
                <dd>{formatPkr(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>{c("shipping")}</dt>
                <dd>{cart.shipping ? formatPkr(cart.shipping) : c("free")}</dd>
              </div>
              <div className="flex justify-between pt-2 text-base font-semibold">
                <dt>{t("collect")}</dt>
                <dd>{formatPkr(cart.total)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-ink-muted">{t("payRider")}</p>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-black/[0.06] bg-white/95 p-3 backdrop-blur md:hidden">
        <button
          type="submit"
          form="agile-checkout"
          disabled={busy}
          className="btn-primary h-12 w-full rounded-full px-6 disabled:opacity-60"
        >
          {placeLabel}
        </button>
      </div>
    </div>
  );
}
