"use client";

import { FormEvent, useState } from "react";
import { useCart } from "./cart-provider";
import { formatPkr } from "@/shared/money";

export function PromoCode() {
  const { cart, applyPromo, clearPromo } = useCart();
  const [code, setCode] = useState(cart.promoCode || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function apply(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const err = await applyPromo(code);
    setBusy(false);
    setMessage(err || (code ? "Code applied" : ""));
  }

  async function clear() {
    setBusy(true);
    await clearPromo();
    setCode("");
    setBusy(false);
    setMessage("");
  }

  return (
    <div className="mt-4">
      {cart.discount ? (
        <p className="mb-2 flex justify-between text-sm">
          <span>Discount{cart.promoCode ? ` (${cart.promoCode})` : ""}</span>
          <span>−{formatPkr(cart.discount)}</span>
        </p>
      ) : null}
      {cart.promoCode ? (
        <button type="button" className="text-xs text-ink-muted" onClick={() => void clear()} disabled={busy}>
          Remove code
        </button>
      ) : (
        <form onSubmit={apply} className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Promo code"
            className="min-w-0 flex-1 border border-paper-line px-3 py-2 text-sm"
          />
          <button type="submit" disabled={busy || !code} className="btn-primary h-11 px-4 disabled:opacity-50">
            Apply
          </button>
        </form>
      )}
      {message ? <p className="mt-1 text-xs text-ink-muted">{message}</p> : null}
    </div>
  );
}
