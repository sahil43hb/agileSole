"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "./cart-provider";
import { formatPkr } from "@/shared/money";

export function PromoCode() {
  const t = useTranslations("cart");
  const c = useTranslations("common");
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
    setMessage(err || (code ? t("applied") : ""));
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
          <span>
            {c("discount")}
            {cart.promoCode ? ` (${cart.promoCode})` : ""}
          </span>
          <span>−{formatPkr(cart.discount)}</span>
        </p>
      ) : null}
      {cart.promoCode ? (
        <button type="button" className="text-xs text-ink-muted" onClick={() => void clear()} disabled={busy}>
          {t("removeCode")}
        </button>
      ) : (
        <form onSubmit={apply} className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t("promo")}
            className="h-11 min-w-0 flex-1 rounded-full border-0 bg-[#f3f5f2] px-4 text-sm outline-none ring-1 ring-transparent placeholder:text-ink-faint focus:bg-white focus:ring-brand/40"
          />
          <button type="submit" disabled={busy || !code} className="btn-primary h-11 rounded-full px-4 text-sm disabled:opacity-50">
            {t("apply")}
          </button>
        </form>
      )}
      {message ? <p className="mt-1 text-xs text-ink-muted">{message}</p> : null}
    </div>
  );
}
