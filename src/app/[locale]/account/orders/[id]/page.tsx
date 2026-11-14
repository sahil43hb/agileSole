"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { AccountShell } from "@/components/storefront/account-shell";
import { OrderTimeline } from "@/components/storefront/order-timeline";
import { formatPkr } from "@/shared/money";
import { CUSTOMER_CANCEL_STATUSES, CUSTOMER_RETURN_STATUSES, statusLabel } from "@/shared/order-copy";
import { useCart } from "@/components/storefront/cart-provider";

type Order = {
  _id: string;
  number: string;
  status: string;
  items: { title: string; sizeEu?: string; qty: number; price: number }[];
  amounts: { subtotal: number; shipping: number; total: number };
  payment: { collectAmount: number };
  shippingAddress: { fullName: string; phone: string; street: string; city: string; province: string };
  shippingMethod?: { eta?: string };
  shipment?: { courierName?: string; trackingNumber?: string; trackingUrl?: string };
};

export default function AccountOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const locale = useLocale();
  const router = useRouter();
  const { refresh } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");

  async function load() {
    const res = await fetch(`/api/v1/me/orders/${params.id}?locale=${locale}`, { credentials: "same-origin" });
    const json = await res.json();
    if (json.ok) setOrder(json.data.order);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, locale]);

  async function act(path: string) {
    setMessage("");
    const res = await fetch(`/api/v1/me/orders/${params.id}/${path}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!json.ok) setMessage(json.error?.message || "Could not update");
    else {
      if (json.data.order) setOrder(json.data.order as Order);
      if (path === "reorder") {
        await refresh();
        router.push("/cart");
      }
    }
  }

  if (!order) {
    return (
      <AccountShell>
        <p className="text-sm text-ink-muted">Loading order…</p>
      </AccountShell>
    );
  }

  const canCancel = (CUSTOMER_CANCEL_STATUSES as readonly string[]).includes(order.status);
  const canReturn = (CUSTOMER_RETURN_STATUSES as readonly string[]).includes(order.status);

  return (
    <AccountShell>
      <Link href="/account/orders" className="text-sm text-ink-muted">
        ← Orders
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">{order.number}</h1>
      <p className="text-sm text-ink-muted">
        {statusLabel(order.status, locale)}
        {order.shippingMethod?.eta ? ` · ${order.shippingMethod.eta}` : ""}
      </p>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <OrderTimeline status={order.status} locale={locale} shipment={order.shipment} />
        <div>
          <h2 className="font-medium">Items</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {order.items.map((item, i) => (
              <li key={`${item.title}-${i}`} className="flex justify-between">
                <span>
                  {item.title} · EU {item.sizeEu} × {item.qty}
                </span>
                <span>{formatPkr(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-medium">COD {formatPkr(order.payment.collectAmount || order.amounts.total)}</p>
          <p className="mt-4 text-sm text-ink-muted">
            {order.shippingAddress.fullName}
            <br />
            {order.shippingAddress.street}, {order.shippingAddress.city}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={`/account/orders/${order._id}/invoice`} className="border border-paper-line px-3 py-2 text-sm">
          Invoice
        </Link>
        <button type="button" className="border border-paper-line px-3 py-2 text-sm" onClick={() => void act("reorder")}>
          Reorder
        </button>
      </div>

      {canCancel || canReturn ? (
        <div className="mt-8 max-w-md space-y-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional note"
            className="w-full border border-paper-line px-3 py-2 text-sm"
            rows={2}
          />
          {canCancel ? (
            <button type="button" className="border border-paper-line px-3 py-2 text-sm" onClick={() => void act("cancel")}>
              Cancel this order
            </button>
          ) : null}
          {canReturn ? (
            <button type="button" className="border border-paper-line px-3 py-2 text-sm" onClick={() => void act("return")}>
              Request return / exchange
            </button>
          ) : null}
        </div>
      ) : null}

      <form
        className="mt-8 max-w-md space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const body = new FormData(form);
          const res = await fetch("/api/v1/me/tickets", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order._id,
              orderNumber: order.number,
              reason: String(body.get("ticket") || ""),
            }),
          });
          const json = await res.json();
          setMessage(json.ok ? "Message sent to the shop." : json.error?.message);
          form.reset();
        }}
      >
        <label className="block text-sm">
          Message the shop about this order
          <textarea name="ticket" required className="mt-1 w-full border border-paper-line px-3 py-2" rows={2} />
        </label>
        <button type="submit" className="text-sm text-brand-dark">
          Send
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-ink-muted">{message}</p> : null}
    </AccountShell>
  );
}
