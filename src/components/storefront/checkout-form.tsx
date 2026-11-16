"use client";

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { ArrowLeft, Banknote, MessageCircle, PhoneCall, ShieldCheck, Truck } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { formatPkr } from "@/shared/money";
import { useCart } from "./cart-provider";
import { useWishlist } from "./wishlist-provider";
import { Link } from "@/i18n/navigation";
import { PromoCode } from "./promo-code";
import { AppSelect } from "@/components/ui/app-select";

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

function Card({ step, title, hint, children }: { step?: string; title: string; hint?: string; children: ReactNode }) {
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
      <div className="mt-5 space-y-3">{children}</div>
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
  const router = useRouter();
  const { cart, loading, refresh } = useCart();
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
      setMessage(json.error?.message || "Could not send code");
      return;
    }
    setOtpSent(true);
    const hint = json.data?.devCode ? `Code sent. Dev code ${json.data.devCode}` : "Code sent. In development it is printed in the server terminal.";
    setMessage(hint);
    if (json.data?.devCode) setOtp(String(json.data.devCode));
  }

  async function place(e: FormEvent) {
    e.preventDefault();
    if (!acceptTerms) {
      setMessage("Please accept the terms to place a COD order.");
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
        otp,
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
      setMessage(json.error?.message || "Could not place order");
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
        <p className="text-sm text-ink-muted">Loading checkout…</p>
      </div>
    );
  }

  if (!cart.lines.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-dark">Checkout</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your bag is empty</h1>
        <p className="mt-3 text-sm text-ink-muted">Add a size from any pair, then come back to place a cash-on-delivery order.</p>
        <Link href="/shop" className="btn-primary mt-8 inline-flex h-12 rounded-full px-6">
          Continue shopping
        </Link>
      </div>
    );
  }

  const placeLabel = busy ? "Placing…" : `Place COD order · ${formatPkr(cart.total)}`;

  return (
    <div className="bg-[#f6f7f5]">
      <div className="mx-auto grid max-w-site gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-12 lg:py-12">
        <form id="agile-checkout" onSubmit={place} className="space-y-5 pb-24 lg:pb-0" data-testid="checkout-form">
          <div>
            <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to bag
            </Link>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Checkout</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium ring-1 ring-black/[0.06]">
                <Banknote className="h-3.5 w-3.5 text-brand" />
                Cash on delivery
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium ring-1 ring-black/[0.06]">
                <Truck className="h-3.5 w-3.5 text-brand" />
                {geo?.shipping.eta || "2–5 working days"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium ring-1 ring-black/[0.06]">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                Easy size exchange
              </span>
            </div>
          </div>

          <Card step="1" title="Contact" hint="We’ll use this to confirm your COD order.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name">
                <input
                  required
                  data-testid="checkout-name"
                  dir="auto"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Name on the parcel"
                  className={field}
                />
              </Field>
              <Field label="Mobile (03XX or +92 3XX)">
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
              <Field label="Alternate phone">
                <input value={altPhone} onChange={(e) => setAltPhone(e.target.value)} placeholder="Optional" className={field} />
              </Field>
              <Field label="Email">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" className={field} />
              </Field>
            </div>
          </Card>

          <Card step="2" title="Delivery address" hint="City delivery across Pakistan. Pay when the pair arrives.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Province">
                <AppSelect
                  tone="store"
                  value={province}
                  onChange={(next) => {
                    setProvince(next);
                    const nextCities = geo?.provinces.find((p) => p.name === next)?.cities || [];
                    setCity(nextCities[0] || "");
                  }}
                  options={(geo?.provinces || []).map((p) => ({ value: p.name, label: p.name }))}
                />
              </Field>
              <Field label="City">
                <AppSelect tone="store" value={city} onChange={setCity} options={cities.map((c) => ({ value: c, label: c }))} />
              </Field>
            </div>
            <Field label="Area / town">
              <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Neighbourhood" className={field} />
            </Field>
            <Field label="Street / house">
              <input
                required
                data-testid="checkout-street"
                dir="auto"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="House no., street"
                className={field}
              />
            </Field>
            <Field label="Landmark">
              <input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Near mosque, school…" className={field} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Delivery notes">
                <textarea
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Gate code, timing…"
                  className={`${field} min-h-[4.25rem] resize-y`}
                  rows={2}
                />
              </Field>
              <Field label="Order note">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything else?"
                  className={`${field} min-h-[4.25rem] resize-y`}
                  rows={2}
                />
              </Field>
            </div>
          </Card>

          <Card step="3" title="Preferences">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#f6f7f5] px-4 py-3">
              <input
                type="checkbox"
                checked={callBeforeDelivery}
                onChange={(e) => setCallBeforeDelivery(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#1f8a4c]"
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  <PhoneCall className="h-3.5 w-3.5 text-brand" />
                  Call before delivery
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">We’ll ring before the rider leaves the area.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#f6f7f5] px-4 py-3">
              <input
                type="checkbox"
                checked={whatsappOptIn}
                onChange={(e) => setWhatsappOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#1f8a4c]"
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  <MessageCircle className="h-3.5 w-3.5 text-brand" />
                  WhatsApp updates
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">Order status on the number above.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#f6f7f5] px-4 py-3">
              <input
                type="checkbox"
                data-testid="checkout-terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#1f8a4c]"
              />
              <span className="text-sm text-ink">
                I agree to the{" "}
                <Link href="/terms" className="font-medium text-brand-dark underline-offset-2 hover:underline">
                  terms
                </Link>
              </span>
            </label>
          </Card>

          <Card step="4" title="Confirm with OTP" hint="We send a code to the mobile above before the order is reserved.">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                data-testid="checkout-send-otp"
                className="h-11 shrink-0 rounded-full bg-[#f3f5f2] px-5 text-sm font-medium transition hover:bg-[#e8ece8]"
                onClick={() => void sendOtp()}
              >
                {otpSent ? "Resend code" : "Send code"}
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
            <h2 className="text-base font-semibold tracking-tight">Your bag</h2>
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
                <dt>Subtotal</dt>
                <dd>{formatPkr(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>Shipping</dt>
                <dd>{cart.shipping ? formatPkr(cart.shipping) : "Free"}</dd>
              </div>
              <div className="flex justify-between pt-2 text-base font-semibold">
                <dt>Collect on delivery</dt>
                <dd>{formatPkr(cart.total)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-ink-muted">Pay the rider in cash. No card needed. We confirm by phone or OTP first.</p>
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
