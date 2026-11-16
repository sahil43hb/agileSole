"use client";

import { useTranslations } from "next-intl";
import { Banknote, ShoppingBag, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatPkr } from "@/shared/money";
import { useCart } from "./cart-provider";
import { PromoCode } from "./promo-code";
import { ShippingEta } from "./shipping-eta";
import { QtyStepper } from "./qty-stepper";

export function CartPageView() {
  const t = useTranslations("cart");
  const c = useTranslations("common");
  const { cart, loading, setQty, remove } = useCart();

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
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f5f2]">
          <ShoppingBag className="h-7 w-7 text-ink-muted" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">{t("emptyTitle")}</h1>
        <p className="mt-3 text-sm text-ink-muted">{t("emptyBody")}</p>
        <Link href="/shop" className="btn-primary mt-8 inline-flex h-12 rounded-full px-6">
          {c("shopCollection")}
        </Link>
      </div>
    );
  }

  const freeOver = cart.shippingMeta.freeOver;
  const remaining = Math.max(0, freeOver - cart.subtotal);
  const progress = freeOver ? Math.min(100, (cart.subtotal / freeOver) * 100) : 100;

  return (
    <div className="bg-[#f6f7f5]">
      <div className="mx-auto grid max-w-site gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-12 lg:py-12">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-dark">{t("kicker")}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {cart.count === 1 ? t("itemsCod", { count: cart.count }) : t("itemsCodPlural", { count: cart.count })}
          </p>

          <ul className="mt-6 space-y-3">
            {cart.lines.map((line) => (
              <li key={line.sku} className="flex gap-4 rounded-[1.35rem] bg-white p-4 shadow-[0_8px_28px_rgba(17,17,17,0.04)] ring-1 ring-black/[0.04] md:p-5">
                <Link href={`/product/${line.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-brand-mist md:h-28 md:w-28">
                  {line.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.image} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link href={`/product/${line.slug}`} className="font-medium leading-snug">
                        {line.title}
                      </Link>
                      <p className="mt-0.5 text-sm text-ink-muted">
                        {line.color ? `${line.color} · ` : ""}EU {line.sizeEu}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatPkr(line.price * line.qty)}</p>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{t("each", { amount: formatPkr(line.price) })}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <QtyStepper qty={line.qty} available={line.available} onChange={(qty) => void setQty(line.sku, qty)} />
                    <button
                      type="button"
                      className="text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
                      onClick={() => void remove(line.sku)}
                    >
                      {c("remove")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_10px_36px_rgba(17,17,17,0.04)] ring-1 ring-black/[0.04] md:p-6">
            <h2 className="text-base font-semibold tracking-tight">{t("summary")}</h2>
            {freeOver ? (
              <div className="mt-4 rounded-2xl bg-[#f6f7f5] px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Truck className="h-3.5 w-3.5 text-brand" />
                  {remaining > 0 ? t("freeMore", { amount: formatPkr(remaining) }) : t("freeNow")}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : null}
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink-muted">
                <dt>{c("subtotal")}</dt>
                <dd>{formatPkr(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>{t("shippingNamed", { name: cart.shippingMeta.name })}</dt>
                <dd>{cart.shipping ? formatPkr(cart.shipping) : c("free")}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <PromoCode />
            </div>
            <div className="mt-4 flex justify-between border-t border-black/[0.06] pt-4 text-base font-semibold">
              <span>{t("totalCod")}</span>
              <span>{formatPkr(cart.total)}</span>
            </div>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-muted">
              <Banknote className="h-3.5 w-3.5 text-brand" />
              {t("payCash")} · <ShippingEta eta={cart.shippingMeta.eta} />
            </p>
            <Link href="/checkout" className="btn-primary mt-5 h-12 w-full rounded-full">
              {t("checkout")}
            </Link>
            <Link href="/shop" className="mt-3 block text-center text-sm text-ink-muted hover:text-ink">
              {c("continueShopping")}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
