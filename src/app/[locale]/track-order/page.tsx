"use client";

import { FormEvent, useState } from "react";
import { useLocale } from "next-intl";
import { formatPkr } from "@/shared/money";
import { statusLabel } from "@/shared/order-copy";
import { OrderTimeline } from "@/components/storefront/order-timeline";
import { Link } from "@/i18n/navigation";

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
    if (!json.ok) setError(json.error?.message || "Not found");
    else setOrder(json.data.order);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-3xl font-semibold">{locale === "ur" ? "آرڈر ٹریک" : "Track order"}</h1>
      <p className="mt-2 text-sm text-ink-muted">
        {locale === "ur"
          ? "تصدیقی صفحے کا آرڈر نمبر اور چیک آؤٹ والا موبائل لکھیں۔"
          : "Use the order number from your confirmation SMS or page, plus the mobile used at checkout."}
      </p>
      <form onSubmit={lookup} className="mt-8 space-y-3" data-testid="track-form">
        <label className="block text-sm">
          {locale === "ur" ? "آرڈر نمبر" : "Order number"}
          <input data-testid="track-number" dir="ltr" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="AS-100001" className="mt-1 w-full border border-paper-line px-3 py-2" required />
        </label>
        <label className="block text-sm">
          {locale === "ur" ? "موبائل" : "Mobile"}
          <input data-testid="track-phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03XX XXXXXXX" className="mt-1 w-full border border-paper-line px-3 py-2" required />
        </label>
        <button type="submit" data-testid="track-submit" className="btn-primary h-11 px-6">
          {locale === "ur" ? "ٹریک" : "Track"}
        </button>
      </form>
      {error ? <p className="mt-4 text-sm text-ink-muted">{error}</p> : null}
      {order ? (
        <div className="mt-10">
          <p className="font-medium">
            {order.number} · {statusLabel(order.status, locale)}
          </p>
          <p className="text-sm text-ink-muted">
            {order.shippingAddress.city}, {order.shippingAddress.province}
            {order.shippingMethod?.eta ? ` · ${order.shippingMethod.eta}` : ""}
          </p>
          <div className="mt-6">
            <OrderTimeline status={order.status} locale={locale} shipment={order.shipment} />
          </div>
          <ul className="mt-6 space-y-1 text-sm">
            {order.items.map((item, i) => (
              <li key={`${item.title}-${i}`}>
                {item.title} · EU {item.sizeEu} × {item.qty}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">COD {formatPkr(order.payment.collectAmount || order.amounts.total)}</p>
          <Link href="/account/login" className="mt-6 inline-block text-sm text-brand-dark">
            Sign in to see all orders
          </Link>
        </div>
      ) : null}
    </div>
  );
}
