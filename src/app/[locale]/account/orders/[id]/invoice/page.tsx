"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { formatPkr } from "@/shared/money";
import { geoLabel } from "@/content/geo-pk";
import { useStoreIdentity } from "@/components/store-identity";

type Order = {
  number: string;
  createdAt: string;
  items: { title: string; sku?: string; sizeEu?: string; qty: number; price: number }[];
  amounts: { subtotal: number; shipping: number; total: number };
  shippingAddress: { fullName: string; phone: string; street: string; city: string; province: string };
  payment: { method: string; collectAmount: number };
};

export default function InvoicePage() {
  const params = useParams<{ id: string }>();
  const locale = useLocale();
  const store = useStoreIdentity();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetch(`/api/v1/me/orders/${params.id}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => j.ok && setOrder(j.data.order));
  }, [params.id]);

  if (!order) return <p className="p-8 text-sm">Loading invoice…</p>;

  return (
    <div className="mx-auto max-w-2xl bg-paper p-8 print:p-0">
      <div className="flex justify-between">
        <div>
          <p className="text-xl font-semibold">{store.name}</p>
          <p className="text-sm text-ink-muted">
            {geoLabel(store.city, locale)}, {geoLabel("Pakistan", locale)}
          </p>
        </div>
        <div className="text-end">
          <p className="text-sm">Invoice</p>
          <p className="font-medium">{order.number}</p>
        </div>
      </div>
      <p className="mt-6 text-sm">
        Bill to: {order.shippingAddress.fullName}
        <br />
        {order.shippingAddress.street}, {geoLabel(order.shippingAddress.city, locale)},{" "}
        {geoLabel(order.shippingAddress.province, locale)}
        <br />
        {order.shippingAddress.phone}
      </p>
      <table className="mt-6 w-full text-start text-sm">
        <thead>
          <tr className="border-b border-paper-line">
            <th className="py-2">Item</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={`${item.sku}-${i}`} className="border-b border-paper-line">
              <td className="py-2">
                {item.title} EU {item.sizeEu}
              </td>
              <td>{item.qty}</td>
              <td>{formatPkr(item.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-sm">Shipping {formatPkr(order.amounts.shipping || 0)}</p>
      <p className="mt-2 font-medium">Collect COD {formatPkr(order.payment.collectAmount || order.amounts.total)}</p>
      <button type="button" className="mt-8 border border-paper-line px-3 py-2 text-sm print:hidden" onClick={() => window.print()}>
        Print / save as PDF
      </button>
    </div>
  );
}
