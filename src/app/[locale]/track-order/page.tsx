"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatPkr } from "@/shared/money";
import { statusLabel } from "@/shared/order-copy";
import { OrderTimeline } from "@/components/storefront/order-timeline";
import { ShippingEta } from "@/components/storefront/shipping-eta";
import { Link } from "@/i18n/navigation";
import { geoLabel } from "@/content/geo-pk";

const field =
  "mt-1.5 w-full rounded-2xl border-0 bg-[#f3f5f2] px-4 py-3 text-sm outline-none ring-1 ring-transparent transition placeholder:text-ink-faint focus:bg-white focus:ring-brand/40";

type Order = {
  number: string;
  status: string;
  items: { title: string; sizeEu?: string; qty: number; price: number }[];
  amounts: { total: number; shipping: number };
  payment: { collectAmount: number };
  shippingAddress: { city: string; province: string };
  shippingMethod?: { eta?: string };
  shipment?: { courierName?: string; trackingNumber?: string; trackingUrl?: string };
};

export default function TrackOrderPage() {
  const locale = useLocale();
  const t = useTranslations("track");
  const c = useTranslations("common");
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  async function lookup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOrder(null);
    const res = await fetch(
      `/api/v1/orders/track?number=${encodeURIComponent(number)}&phone=${encodeURIComponent(phone)}&locale=${locale}`,
    );
    const json = await res.json();
    if (!json.ok) setError(json.error?.message || t("notFound"));
    else setOrder(json.data.order);
  }

  return (
    <div className="bg-[#f6f7f5]">
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-[1.6rem] bg-white p-6 shadow-[0_10px_36px_rgba(17,17,17,0.04)] ring-1 ring-black/[0.04] md:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-dark">{c("cod")}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-sm text-ink-muted">{t("body")}</p>
          <form onSubmit={lookup} className="mt-8 space-y-4" data-testid="track-form">
            <label className="block text-xs font-medium text-ink-muted">
              {t("number")}
              <input
                data-testid="track-number"
                dir="ltr"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="AS-100001"
                className={field}
                required
              />
            </label>
            <label className="block text-xs font-medium text-ink-muted">
              {t("mobile")}
              <input
                data-testid="track-phone"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03XX XXXXXXX"
                className={field}
                required
              />
            </label>
            <button type="submit" data-testid="track-submit" className="btn-primary h-12 w-full rounded-full">
              {t("submit")}
            </button>
          </form>
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>

        {order ? (
          <div className="mt-6 rounded-[1.6rem] bg-white p-6 ring-1 ring-black/[0.04] md:p-8">
            <p className="font-semibold">
              {order.number} · {statusLabel(order.status, locale)}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {geoLabel(order.shippingAddress.city, locale)}, {geoLabel(order.shippingAddress.province, locale)}
              {order.shippingMethod?.eta ? (
                <>
                  {" · "}
                  <ShippingEta eta={order.shippingMethod.eta} />
                </>
              ) : null}
            </p>
            <div className="mt-6">
              <OrderTimeline status={order.status} locale={locale} shipment={order.shipment} />
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              {order.items.map((item, i) => (
                <li key={`${item.title}-${i}`} className="flex justify-between gap-3">
                  <span>
                    {item.title} · {c("eu", { size: item.sizeEu || "—" })} × {item.qty}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-semibold">{c("cod")} {formatPkr(order.payment.collectAmount || order.amounts.total)}</p>
            <Link href="/account/login" className="mt-6 inline-block text-sm font-medium text-brand-dark hover:underline">
              {t("signIn")}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
