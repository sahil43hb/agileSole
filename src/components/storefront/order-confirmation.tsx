"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { formatPkr } from "@/shared/money";
import { trackEvent } from "@/lib/analytics";

type Order = {
  number: string;
  status: string;
  items: { title: string; sizeEu?: string; qty: number; price: number }[];
  amounts: { total: number; shipping: number; subtotal: number };
  shippingAddress: { fullName: string; city: string; province: string; phone: string };
  payment: { collectAmount: number };
};

export function OrderConfirmation() {
  const params = useSearchParams();
  const number = params.get("number") || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!number) {
      setError("Missing order number");
      return;
    }
    fetch(`/api/v1/orders/confirmation?number=${encodeURIComponent(number)}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) setError(json.error?.message || "Order not found");
        else {
          const next = json.data.order as Order;
          setOrder(next);
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
      .catch(() => setError("Could not load order"));
  }, [number]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold">Order</h1>
        <p className="mt-3 text-sm text-ink-muted">{error}</p>
        <Link href="/shop" className="mt-6 inline-block text-sm text-brand-dark">
          Shop
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="text-sm text-ink-muted">Loading confirmation…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">Cash on delivery</p>
      <h1 className="mt-2 text-3xl font-semibold">Thank you</h1>
      <p className="mt-3 text-ink-muted">
        Order <span className="font-medium text-ink" data-testid="order-number">{order.number}</span> is pending confirmation. We will call{" "}
        {order.shippingAddress.phone} before packing.
      </p>
      <ul className="mt-8 space-y-2 text-sm">
        {order.items.map((item, i) => (
          <li key={`${item.title}-${i}`} className="flex justify-between">
            <span>
              {item.title} · EU {item.sizeEu} × {item.qty}
            </span>
            <span>{formatPkr(item.price * item.qty)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex justify-between text-sm">
        <span>Shipping</span>
        <span>{order.amounts.shipping ? formatPkr(order.amounts.shipping) : "Free"}</span>
      </p>
      <p className="mt-2 flex justify-between font-medium">
        <span>Pay on delivery</span>
        <span>{formatPkr(order.payment.collectAmount || order.amounts.total)}</span>
      </p>
      <p className="mt-6 text-sm text-ink-muted">
        {order.shippingAddress.fullName} · {order.shippingAddress.city}, {order.shippingAddress.province}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/track-order`}
          className="border border-paper-line px-4 py-2 text-sm"
        >
          Track this order
        </Link>
        <Link href="/account/login" className="border border-paper-line px-4 py-2 text-sm">
          Save to account
        </Link>
        <Link href="/shop" className="btn-primary h-11 px-6">
          Continue shopping
        </Link>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Track anytime with {order.number} and {order.shippingAddress.phone}. Sign in with the same mobile to keep all orders in one place.
      </p>
    </div>
  );
}
