"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatPkr } from "@/shared/money";
import { useStoreIdentity } from "@/components/store-identity";

type Order = {
  number: string;
  items: { title: string; sku: string; color?: string; sizeEu?: string; qty: number }[];
  amounts: { total: number };
  payment: { collectAmount: number; method: string };
  shippingAddress: { fullName: string; phone: string; altPhone?: string; street: string; city: string; province: string };
  notes?: string;
  callBeforeDelivery?: boolean;
};

export default function PackingSlipPage() {
  const params = useParams<{ id: string }>();
  const store = useStoreIdentity();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetch(`/api/v1/admin/orders/${params.id}`)
      .then((r) => r.json())
      .then((j) => j.ok && setOrder(j.data.order));
  }, [params.id]);

  if (!order) return <p className="p-8 text-sm">Loading packing slip…</p>;

  return (
    <div className="mx-auto max-w-2xl bg-paper p-8">
      <div className="flex justify-between border-b border-paper-line pb-4">
        <div>
          <p className="text-xl font-semibold">{store.name}</p>
          <p className="text-sm text-ink-muted">Packing slip · {store.city}</p>
        </div>
        <p className="text-lg font-medium">{order.number}</p>
      </div>
      <p className="mt-6 text-2xl font-semibold">Collect COD {formatPkr(order.payment.collectAmount || order.amounts.total)}</p>
      <p className="mt-4 text-sm">
        {order.shippingAddress.fullName}
        <br />
        {order.shippingAddress.phone}
        {order.shippingAddress.altPhone ? ` / ${order.shippingAddress.altPhone}` : ""}
        <br />
        {order.shippingAddress.street}
        <br />
        {order.shippingAddress.city}, {order.shippingAddress.province}
      </p>
      {order.callBeforeDelivery ? <p className="mt-2 text-sm">Call before delivery</p> : null}
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-paper-line">
            <th className="py-2">Item</th>
            <th>SKU</th>
            <th>Qty</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.sku} className="border-b border-paper-line">
              <td className="py-2">
                {item.title} · {item.color} EU {item.sizeEu}
              </td>
              <td className="font-mono text-xs">{item.sku}</td>
              <td>{item.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {order.notes ? <p className="mt-4 text-sm">Note: {order.notes}</p> : null}
      <button type="button" className="mt-8 border border-paper-line px-3 py-2 text-sm print:hidden" onClick={() => window.print()}>
        Print / save as PDF
      </button>
    </div>
  );
}
