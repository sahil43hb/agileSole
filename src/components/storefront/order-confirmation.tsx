"use client";

import { useEffect, useState } from "react";
import { Banknote, Check, Copy, MapPin, Package, PhoneCall, Truck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { geoLabel } from "@/content/geo-pk";
import { Link } from "@/i18n/navigation";
import { formatPkr } from "@/shared/money";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "./auth-provider";
import { useWishlist } from "./wishlist-provider";
import { ShippingEta } from "./shipping-eta";

type Order = {
  number: string;
  status: string;
  items: { title: string; sizeEu?: string; qty: number; price: number; image?: string; color?: string; slug?: string }[];
  amounts: { total: number; shipping: number; subtotal: number };
  shippingAddress: { fullName: string; city: string; province: string; phone: string; street?: string; area?: string };
  shippingMethod?: { eta?: string };
  payment: { collectAmount: number };
};

export function OrderConfirmation() {
  const locale = useLocale();
  const t = useTranslations("confirm");
  const c = useTranslations("common");
  const params = useSearchParams();
  const number = params.get("number") || "";
  const { customer } = useAuth();
  const { markBought } = useWishlist();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!number) {
      setError(t("missing"));
      return;
    }
    fetch(`/api/v1/orders/confirmation?number=${encodeURIComponent(number)}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) setError(json.error?.message || t("notFound"));
        else {
          const next = json.data.order as Order;
          setOrder(next);
          markBought((next.items || []).map((item) => item.slug || ""));
          const key = `as_purchase_${next.number}`;
          if (sessionStorage.getItem(key) !== "1") {
            sessionStorage.setItem(key, "1");
            trackEvent("purchase", {
              currency: "PKR",
              value: next.payment.collectAmount || next.amounts.total,
              transaction_id: next.number,
            });
          }
        }
      })
      .catch(() => setError(t("loadFail")));
  }, [number, markBought, t]);

  async function copyNumber(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  if (error) {
    return (
      <div className="bg-[#f6f7f5]">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{t("order")}</h1>
          <p className="mt-3 text-sm text-ink-muted">{error}</p>
          <Link href="/shop" className="btn-primary mt-8 inline-flex h-11 rounded-full px-6">
            {c("shopCollection")}
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-[#f6f7f5]">
        <div className="mx-auto max-w-lg px-4 py-20">
          <p className="text-sm text-ink-muted">{t("loading")}</p>
        </div>
      </div>
    );
  }

  const collect = order.payment.collectAmount || order.amounts.total;
  const address = [
    order.shippingAddress.street,
    order.shippingAddress.area,
    geoLabel(order.shippingAddress.city, locale),
    geoLabel(order.shippingAddress.province, locale),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="relative overflow-hidden bg-[#f3f6f3]">
      <div className="pointer-events-none absolute -top-24 end-[-6rem] h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute top-40 start-[-8rem] h-80 w-80 rounded-full bg-[#d7eedd] blur-3xl" />

      <div className="relative mx-auto max-w-site px-4 py-10 md:px-8 md:py-14">
        <div className="overflow-hidden rounded-[2rem] bg-ink px-6 py-8 text-paper shadow-[0_30px_80px_rgba(17,17,17,0.18)] md:px-10 md:py-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_10px_30px_rgba(31,166,74,0.45)]">
                <Check className="h-7 w-7" strokeWidth={2.75} />
              </span>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">{t("placed")}</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{t("thanks")}</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
                {t("pendingCall", { phone: order.shippingAddress.phone })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyNumber(order.number)}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15"
            >
              <span className="text-[11px] uppercase tracking-[0.16em] text-white/50">{t("order")}</span>
              <span data-testid="order-number">{order.number}</span>
              <Copy className="h-3.5 w-3.5 text-white/60" />
              <span className="text-xs text-white/50">{copied ? t("copied") : t("copy")}</span>
            </button>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">
              <Banknote className="h-3.5 w-3.5 text-brand" />
              {t("payOnDelivery", { amount: formatPkr(collect) })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">
              <Truck className="h-3.5 w-3.5 text-brand" />
              <ShippingEta eta={order.shippingMethod?.eta} />
            </span>
          </div>
        </div>

        <ol className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { icon: PhoneCall, title: t("weCall"), body: t("weCallBody") },
            { icon: Package, title: t("wePack"), body: t("wePackBody") },
            { icon: Truck, title: t("youPay"), body: t("youPayBody") },
          ].map((step, i) => (
            <li key={step.title} className="relative overflow-hidden rounded-[1.5rem] bg-white p-5 ring-1 ring-black/[0.04]">
              <span className="absolute end-4 top-4 text-3xl font-semibold text-black/[0.05]">{i + 1}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-mist text-brand">
                <step.icon className="h-4 w-4" />
              </span>
              <p className="mt-4 font-semibold">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="rounded-[1.6rem] bg-white p-6 ring-1 ring-black/[0.04] md:p-7">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-muted">{t("pairs")}</h2>
            <ul className="mt-5 space-y-4">
              {order.items.map((item, i) => (
                <li key={`${item.title}-${i}`} className="flex gap-4">
                  <div className="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-brand-mist">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{item.title}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {item.color ? `${item.color} · ` : ""}{c("eu", { size: item.sizeEu || "—" })} × {item.qty}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">{formatPkr(item.price * item.qty)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-[#f6f7f5] p-4 text-sm text-ink-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>
                <span className="font-medium text-ink">{order.shippingAddress.fullName}</span>
                <br />
                {address || `${geoLabel(order.shippingAddress.city, locale)}, ${geoLabel(order.shippingAddress.province, locale)}`}
              </span>
            </p>
          </div>

          <aside className="rounded-[1.6rem] bg-white p-6 ring-1 ring-black/[0.04] md:p-7">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-muted">{c("cod")}</h2>
            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between text-ink-muted">
                <dt>{c("subtotal")}</dt>
                <dd>{formatPkr(order.amounts.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>{c("shipping")}</dt>
                <dd>{order.amounts.shipping ? formatPkr(order.amounts.shipping) : c("free")}</dd>
              </div>
              <div className="flex justify-between border-t border-black/[0.06] pt-3 text-xl font-semibold">
                <dt>{t("payRider")}</dt>
                <dd>{formatPkr(collect)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">{t("keepCash", { amount: formatPkr(collect) })}</p>
            <div className="mt-6 flex flex-col gap-2">
              <Link href="/shop" className="btn-primary h-12 w-full rounded-full">
                {t("continue")}
              </Link>
              <Link
                href={customer ? "/account/orders" : "/track-order"}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#f3f5f2] text-sm font-medium transition hover:bg-[#e8ece8]"
              >
                {customer ? t("viewAccount") : t("track")}
              </Link>
              {!customer ? (
                <Link href="/account/login" className="py-1 text-center text-sm text-ink-muted hover:text-ink">
                  {t("saveAccount")}
                </Link>
              ) : null}
            </div>
          </aside>
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted">
          {t("trackAnytime", { number: order.number, phone: order.shippingAddress.phone })}
        </p>
      </div>
    </div>
  );
}
