"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { formatPkr } from "@/shared/money";
import { useCart } from "./cart-provider";
import { Link } from "@/i18n/navigation";
import { PromoCode } from "./promo-code";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";

type Geo = {
  provinces: { name: string; cities: string[] }[];
  shipping: { fee: number; freeOver: number; eta: string; name: string };
};

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
    const number = json.data.order.number as string;
    await refresh();
    router.push(`/checkout/confirmation?number=${encodeURIComponent(number)}`);
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
      <div className="mx-auto max-w-site px-4 py-16">
        <h1 className="text-3xl font-semibold">Checkout</h1>
        <p className="mt-3 text-ink-muted">Your bag is empty.</p>
        <Link href="/shop" className="mt-6 inline-block text-sm text-brand-dark">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-site gap-10 px-4 py-12 md:grid-cols-[1fr_320px]">
      <form onSubmit={place} className="space-y-6" data-testid="checkout-form">
        <h1 className="text-3xl font-semibold">Cash on delivery</h1>
        <p className="text-sm text-ink-muted">Pay when your pair arrives. We will call to confirm the order.</p>

        <fieldset className="space-y-3">
          <legend className="font-medium">Delivery address</legend>
          <label className="block text-sm">
            Full name
            <input required data-testid="checkout-name" dir="auto" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" />
          </label>
          <label className="block text-sm">
            Mobile (03XX or +92 3XX)
            <input required data-testid="checkout-phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" />
          </label>
          <label className="block text-sm">
            Alternate phone
            <input value={altPhone} onChange={(e) => setAltPhone(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" />
          </label>
          <label className="block text-sm">
            Email (optional)
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Province
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
            </label>
            <label className="block text-sm">
              City
              <AppSelect
                tone="store"
                value={city}
                onChange={setCity}
                options={cities.map((c) => ({ value: c, label: c }))}
              />
            </label>
          </div>
          <label className="block text-sm">
            Area / town
            <input value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" />
          </label>
          <label className="block text-sm">
            Street / house
            <input required data-testid="checkout-street" dir="auto" value={street} onChange={(e) => setStreet(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" />
          </label>
          <label className="block text-sm">
            Landmark
            <input value={landmark} onChange={(e) => setLandmark(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" />
          </label>
        </fieldset>

        <label className="block text-sm">
          Delivery notes
          <textarea value={deliveryInstructions} onChange={(e) => setDeliveryInstructions(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" rows={2} />
        </label>
        <label className="block text-sm">
          Order note
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" rows={2} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={callBeforeDelivery} onChange={(e) => setCallBeforeDelivery(e.target.checked)} />
          Call before delivery
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} />
          WhatsApp updates
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" data-testid="checkout-terms" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
          I agree to the{" "}
          <Link href="/terms" className="text-brand-dark">
            terms
          </Link>
        </label>

        <div className="border border-paper-line p-4">
          <p className="font-medium">Confirm with OTP</p>
          <p className="mt-1 text-sm text-ink-muted">We send a code to the mobile above before the order is reserved.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" data-testid="checkout-send-otp" className="border border-paper-line px-3 py-2 text-sm" onClick={() => void sendOtp()}>
              {otpSent ? "Resend code" : "Send code"}
            </button>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              data-testid="checkout-otp"
              placeholder="6-digit code"
              className="border border-paper-line px-3 py-2 tracking-[0.3em]"
              required
            />
          </div>
        </div>

        {message ? <p className="text-sm text-ink-muted">{message}</p> : null}

        <Button type="submit" data-testid="checkout-place" disabled={busy} size="lg">
          {busy ? "Placing…" : `Place COD order · ${formatPkr(cart.total)}`}
        </Button>
      </form>

      <aside className="h-fit bg-paper-warm p-5">
        <h2 className="font-semibold">Your bag</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {cart.lines.map((line) => (
            <li key={line.sku} className="flex justify-between gap-2">
              <span>
                {line.title} · EU {line.sizeEu} × {line.qty}
              </span>
              <span>{formatPkr(line.price * line.qty)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatPkr(cart.subtotal)}</span>
        </p>
        <PromoCode />
        <p className="mt-4 flex justify-between text-sm">
          <span>Shipping</span>
          <span>{cart.shipping ? formatPkr(cart.shipping) : "Free"}</span>
        </p>
        <p className="mt-2 flex justify-between font-medium">
          <span>Collect on delivery</span>
          <span>{formatPkr(cart.total)}</span>
        </p>
      </aside>
    </div>
  );
}
