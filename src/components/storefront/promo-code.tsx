"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "./cart-provider";
import { useAuth } from "./auth-provider";
import { LoginModal } from "./login-modal";
import { formatPkr } from "@/shared/money";
import { BusyLabel } from "@/components/ui/spinner";

export function PromoCode() {
  const t = useTranslations("cart");
  const c = useTranslations("common");
  const { customer, loading } = useAuth();
  const { cart, applyPromo, clearPromo } = useCart();
  const [code, setCode] = useState(cart.promoCode || "");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"ok" | "error" | "">("");
  const [busy, setBusy] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  async function submitCode(value: string) {
    setBusy(true);
    const err = await applyPromo(value);
    setBusy(false);
    if (err) {
      setTone("error");
      setMessage(err);
      return;
    }
    setTone("ok");
    setMessage(t("applied"));
  }

  async function apply(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setTone("");
    if (!code.trim()) return;
    if (loading) return;
    if (!customer) {
      setLoginOpen(true);
      return;
    }
    await submitCode(code);
  }

  async function onLoggedIn() {
    setLoginOpen(false);
    await submitCode(code);
  }

  async function clear() {
    setBusy(true);
    await clearPromo();
    setCode("");
    setBusy(false);
    setMessage("");
    setTone("");
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
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-full border-0 bg-[#f3f5f2] px-4 text-sm outline-none ring-1 ring-transparent placeholder:text-ink-faint focus:bg-white focus:ring-brand/40"
          />
          <button
            type="submit"
            disabled={busy || !code}
            className="btn-primary inline-flex h-11 items-center justify-center rounded-full px-4 text-sm disabled:opacity-50"
          >
            <BusyLabel loading={busy} label={t("applying")}>
              {t("apply")}
            </BusyLabel>
          </button>
        </form>
      )}
      {message ? <p className={`mt-1 text-xs ${tone === "error" ? "text-red-600" : "text-ink-muted"}`}>{message}</p> : null}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={() => void onLoggedIn()} />
    </div>
  );
}
