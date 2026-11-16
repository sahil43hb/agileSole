"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { AccountShell } from "@/components/storefront/account-shell";
import { OrderTimeline } from "@/components/storefront/order-timeline";
import { formatPkr } from "@/shared/money";
import { CUSTOMER_CANCEL_STATUSES, CUSTOMER_RETURN_STATUSES, statusLabel } from "@/shared/order-copy";
import { useCart } from "@/components/storefront/cart-provider";

const field =
  "mt-1.5 w-full rounded-2xl border-0 bg-[#f3f5f2] px-4 py-3 text-sm outline-none ring-1 ring-transparent transition placeholder:text-ink-faint focus:bg-white focus:ring-brand/40";

type Order = {
  _id: string;
  number: string;
  status: string;
  items: { title: string; sizeEu?: string; qty: number; price: number; image?: string; color?: string }[];
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
  const collect = order.payment.collectAmount || order.amounts.total;

  return (
    <AccountShell>
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" />
        Orders
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{order.number}</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {statusLabel(order.status, locale)}
        {order.shippingMethod?.eta ? ` · ${order.shippingMethod.eta}` : ""}
      </p>

      <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-2">
        <div className="flex h-full flex-col rounded-[1.35rem] bg-white p-5 ring-1 ring-black/[0.04] md:p-6">
          <h2 className="text-sm font-semibold">Timeline</h2>
          <div className="mt-4 flex-1">
            <OrderTimeline status={order.status} locale={locale} shipment={order.shipment} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-black/[0.06] pt-4">
            <Link
              href={`/account/orders/${order._id}/invoice`}
              className="inline-flex h-11 items-center rounded-full bg-[#f3f5f2] px-5 text-sm font-medium hover:bg-[#e8ece8]"
            >
              Invoice
            </Link>
            <button
              type="button"
              className="inline-flex h-11 items-center rounded-full bg-[#f3f5f2] px-5 text-sm font-medium hover:bg-[#e8ece8]"
              onClick={() => void act("reorder")}
            >
              Reorder
            </button>
          </div>
        </div>
        <div className="flex h-full flex-col rounded-[1.35rem] bg-white p-5 ring-1 ring-black/[0.04] md:p-6">
          <h2 className="text-sm font-semibold">Items</h2>
          <ul className="mt-4 flex-1 space-y-4">
            {order.items.map((item, i) => (
              <li key={`${item.title}-${i}`} className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-mist">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-ink-muted">
                    {item.color ? `${item.color} · ` : ""}EU {item.sizeEu} × {item.qty}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium">{formatPkr(item.price * item.qty)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-black/[0.06] pt-4 text-sm">
            <div className="flex justify-between text-ink-muted">
              <dt>Subtotal</dt>
              <dd>{formatPkr(order.amounts.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-ink-muted">
              <dt>Shipping</dt>
              <dd>{order.amounts.shipping ? formatPkr(order.amounts.shipping) : "Free"}</dd>
            </div>
            <div className="flex justify-between pt-1 font-semibold">
              <dt>COD</dt>
              <dd>{formatPkr(collect)}</dd>
            </div>
          </dl>
          <p className="mt-4 flex items-start gap-2 text-sm text-ink-muted">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>
              <span className="font-medium text-ink">{order.shippingAddress.fullName}</span>
              <br />
              {order.shippingAddress.street}, {order.shippingAddress.city}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-2">
        <div className="flex h-full flex-col rounded-[1.35rem] bg-white p-5 ring-1 ring-black/[0.04] md:p-6">
          {canCancel || canReturn ? (
            <>
              <p className="text-sm font-semibold">Need to change this order?</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional note"
                className={`${field} min-h-[6.5rem] flex-1 resize-y`}
                rows={3}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {canCancel ? (
                  <button
                    type="button"
                    className="h-11 rounded-full px-5 text-sm font-medium ring-1 ring-black/[0.08] hover:bg-[#f3f5f2]"
                    onClick={() => void act("cancel")}
                  >
                    Cancel this order
                  </button>
                ) : null}
                {canReturn ? (
                  <button
                    type="button"
                    className="h-11 rounded-full px-5 text-sm font-medium ring-1 ring-black/[0.08] hover:bg-[#f3f5f2]"
                    onClick={() => void act("return")}
                  >
                    Request return / exchange
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-muted">This order can no longer be cancelled from here. Message the shop if you need help.</p>
          )}
        </div>
        <form
          className="flex h-full flex-col rounded-[1.35rem] bg-white p-5 ring-1 ring-black/[0.04] md:p-6"
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
          <label className="flex flex-1 flex-col text-xs font-medium text-ink-muted">
            Message the shop about this order
            <textarea name="ticket" required className={`${field} min-h-[6.5rem] flex-1 resize-y`} rows={3} />
          </label>
          <button type="submit" className="btn-primary mt-3 h-11 w-fit rounded-full px-6">
            Send
          </button>
        </form>
      </div>
      {message ? <p className="mt-3 text-sm text-ink-muted">{message}</p> : null}
    </AccountShell>
  );
}
