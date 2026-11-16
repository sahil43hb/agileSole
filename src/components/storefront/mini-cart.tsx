"use client";

import { useTranslations } from "next-intl";
import { Banknote, ShoppingBag, Truck, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatPkr } from "@/shared/money";
import { useCart } from "./cart-provider";
import { QtyStepper } from "./qty-stepper";

export function MiniCart() {
  const t = useTranslations("cart");
  const c = useTranslations("common");
  const { cart, drawerOpen, closeDrawer, setQty, remove } = useCart();
  if (!drawerOpen) return null;

  const freeOver = cart.shippingMeta.freeOver;
  const remaining = Math.max(0, freeOver - cart.subtotal);
  const progress = freeOver ? Math.min(100, (cart.subtotal / freeOver) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-[2px]" onClick={closeDrawer}>
      <aside
        className="flex h-full w-full max-w-[26rem] flex-col bg-white shadow-[-24px_0_80px_rgba(17,17,17,0.14)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
            <p className="text-xs text-ink-muted">
              {cart.count
                ? cart.count === 1
                  ? t("itemsCod", { count: cart.count })
                  : t("itemsCodPlural", { count: cart.count })
                : t("empty")}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("close")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f5f2] text-ink transition hover:bg-[#e8ece8]"
            onClick={closeDrawer}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {cart.lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f5f2]">
                <ShoppingBag className="h-6 w-6 text-ink-muted" />
              </span>
              <p className="mt-4 text-sm font-medium">{t("emptyTitle")}</p>
              <p className="mt-1 text-sm text-ink-muted">{t("emptyBody")}</p>
              <Link href="/shop" className="btn-primary mt-6 h-11 rounded-full px-5" onClick={closeDrawer}>
                {c("shopCollection")}
              </Link>
            </div>
          ) : (
            <>
              {freeOver ? (
                <div className="mb-5 rounded-2xl bg-[#f6f7f5] px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
                    <Truck className="h-3.5 w-3.5 text-brand" />
                    {remaining > 0 ? t("freeMore", { amount: formatPkr(remaining) }) : t("freeNow")}
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : null}
              <ul className="space-y-4">
                {cart.lines.map((line) => (
                  <li key={line.sku} className="flex gap-3">
                    <Link
                      href={`/product/${line.slug}`}
                      onClick={closeDrawer}
                      className="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-brand-mist"
                    >
                      {line.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={line.image} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/product/${line.slug}`}
                          className="text-sm font-medium leading-snug"
                          onClick={closeDrawer}
                        >
                          {line.title}
                        </Link>
                        <p className="shrink-0 text-sm font-medium">{formatPkr(line.price * line.qty)}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {line.color ? `${line.color} · ` : ""}EU {line.sizeEu}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <QtyStepper qty={line.qty} available={line.available} onChange={(qty) => void setQty(line.sku, qty)} />
                        <button
                          type="button"
                          className="text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline"
                          onClick={() => void remove(line.sku)}
                        >
                          {c("remove")}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {cart.lines.length ? (
          <div className="border-t border-black/[0.06] bg-[#f6f7f5] px-5 py-4">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-ink-muted">
                <dt>{c("subtotal")}</dt>
                <dd>{formatPkr(cart.subtotal)}</dd>
              </div>
              {cart.discount ? (
                <div className="flex justify-between text-ink-muted">
                  <dt>
                    {c("discount")}
                    {cart.promoCode ? ` (${cart.promoCode})` : ""}
                  </dt>
                  <dd>−{formatPkr(cart.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-ink-muted">
                <dt>{t("codShipping")}</dt>
                <dd>{cart.shipping ? formatPkr(cart.shipping) : c("free")}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold">
                <dt>{c("total")}</dt>
                <dd>{formatPkr(cart.total)}</dd>
              </div>
            </dl>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-muted">
              <Banknote className="h-3.5 w-3.5 text-brand" />
              {t("payCash")}
            </p>
            <Link
              href="/checkout"
              data-testid="mini-checkout"
              className="btn-primary mt-4 h-12 w-full rounded-full"
              onClick={closeDrawer}
            >
              {t("checkoutCod")}
            </Link>
            <Link href="/cart" className="mt-2.5 block text-center text-sm text-ink-muted hover:text-ink" onClick={closeDrawer}>
              {t("viewBag")}
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
