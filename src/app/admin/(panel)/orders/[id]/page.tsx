"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Banknote, Plus, Printer, Trash2 } from "lucide-react";
import { formatPkr } from "@/shared/money";
import { AdminHeaderAction, AdminPageHeader, AdminTable, StatusBadge, formatAdminDate, rowBtnDanger } from "@/components/admin/ui";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { toast, toastApiError } from "@/components/ui/toast";
import { BusyLabel } from "@/components/ui/spinner";
import { useCan } from "@/components/admin/access";

type Order = {
  _id: string;
  number: string;
  status: string;
  channel: string;
  notes?: string;
  deliveryInstructions?: string;
  callBeforeDelivery?: boolean;
  createdAt?: string;
  items: { sku: string; title: string; color?: string; sizeEu?: string; qty: number; price: number; cost?: number }[];
  amounts: { subtotal: number; shipping: number; discount?: number; total: number };
  shippingAddress: { fullName: string; phone: string; street: string; city: string; province: string };
  payment: { method: string; status: string; collectAmount: number };
  events: { from: string; to: string; note?: string; at: string }[];
  shipment?: { courierName?: string; trackingNumber?: string; trackingUrl?: string };
  customerCancelRequestedAt?: string;
  customerReturnRequestedAt?: string;
  stockCommitted?: boolean;
};

const EDITABLE_ITEM_STATUSES = ["pending_confirmation", "confirmed", "unreachable", "on_hold"];
type Inv = { sku: string; productTitle: string; color?: string; sizeEu?: string; available: number };

const ACTIONS: Record<string, { to: string; label: string; tone: "primary" | "muted" | "danger" | "warn" }[]> = {
  pending_confirmation: [
    { to: "confirmed", label: "Confirm", tone: "primary" },
    { to: "cancelled", label: "Cancel (release stock)", tone: "danger" },
    { to: "unreachable", label: "Unreachable", tone: "warn" },
    { to: "on_hold", label: "Hold", tone: "muted" },
  ],
  unreachable: [
    { to: "confirmed", label: "Confirm", tone: "primary" },
    { to: "cancelled", label: "Cancel", tone: "danger" },
    { to: "on_hold", label: "Hold", tone: "muted" },
  ],
  on_hold: [
    { to: "confirmed", label: "Confirm", tone: "primary" },
    { to: "cancelled", label: "Cancel", tone: "danger" },
  ],
  confirmed: [
    { to: "packed", label: "Packed (commit stock)", tone: "primary" },
    { to: "cancelled", label: "Cancel", tone: "danger" },
    { to: "on_hold", label: "Hold", tone: "muted" },
  ],
  packed: [
    { to: "shipped", label: "Shipped", tone: "primary" },
    { to: "pickup_ready", label: "Ready for pickup", tone: "muted" },
    { to: "cancelled", label: "Cancel (restock)", tone: "danger" },
  ],
  pickup_ready: [
    { to: "delivered", label: "Collected", tone: "primary" },
    { to: "cancelled", label: "Cancel (restock)", tone: "danger" },
  ],
  shipped: [
    { to: "out_for_delivery", label: "Out for delivery", tone: "primary" },
    { to: "delivered", label: "Delivered", tone: "primary" },
    { to: "delivery_failed", label: "Delivery failed", tone: "warn" },
    { to: "returned", label: "Returned", tone: "danger" },
  ],
  out_for_delivery: [
    { to: "delivered", label: "Delivered", tone: "primary" },
    { to: "delivery_failed", label: "Delivery failed", tone: "warn" },
  ],
  delivery_failed: [
    { to: "out_for_delivery", label: "Retry OFD", tone: "primary" },
    { to: "returned", label: "RTO / returned", tone: "warn" },
    { to: "cancelled", label: "Cancel", tone: "danger" },
  ],
  delivered: [{ to: "returned", label: "Return (restock)", tone: "muted" }],
};

const TONE = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  muted: "border border-[var(--admin-line)] bg-white text-ink hover:bg-[#f4f7f5]",
  danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  warn: "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
};

export default function AdminOrderDetailPage() {
  const access = useCan("orders");
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [inventory, setInventory] = useState<Inv[]>([]);
  const [addSku, setAddSku] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [savingItems, setSavingItems] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/v1/admin/orders/${params.id}`);
    const json = await res.json();
    if (json.ok) {
      const next = json.data.order as Order;
      setOrder(next);
      setCourierName(next.shipment?.courierName || "");
      setTrackingNumber(next.shipment?.trackingNumber || "");
      setTrackingUrl(next.shipment?.trackingUrl || "");
    } else toastApiError(json, "Not found");
  }

  useEffect(() => {
    void load();
    fetch("/api/v1/admin/inventory")
      .then((r) => r.json())
      .then((j) => j.ok && setInventory(j.data.rows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function move(to: string) {
    setError("");
    setActionBusy(to);
    const res = await fetch(`/api/v1/admin/orders/${params.id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, note }),
    });
    const json = await res.json();
    setActionBusy(null);
    if (!json.ok) toastApiError(json, "Could not update");
    else {
      toast.success("Order updated");
      setOrder(json.data.order);
      setNote("");
    }
  }

  if (!order) {
    return <p className="text-sm text-ink-muted">{error || "Loading…"}</p>;
  }

  const actions = access.update ? ACTIONS[order.status] || [] : [];
  const canEditItems =
    access.update &&
    EDITABLE_ITEM_STATUSES.includes(order.status) &&
    !order.stockCommitted &&
    order.payment.status !== "paid";

  async function saveItems(nextItems: { sku: string; qty: number }[]) {
    if (!nextItems.length) {
      toast.error("Keep at least one pair, or cancel the order");
      return;
    }
    setError("");
    setSavingItems(true);
    const res = await fetch(`/api/v1/admin/orders/${params.id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: nextItems }),
    });
    const json = await res.json();
    setSavingItems(false);
    if (!json.ok) toastApiError(json, "Could not update items");
    else {
      toast.success("Items updated");
      setOrder(json.data.order);
      setAddSku("");
      setAddQty(1);
    }
  }

  const addOptions = inventory
    .filter((r) => r.available > 0 && !order.items.some((item) => item.sku === r.sku))
    .map((r) => ({
      value: r.sku,
      label: `${r.productTitle} · ${r.color} EU ${r.sizeEu} · ${r.available} left`,
    }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-ink-muted hover:text-ink">
          ← Orders
        </Link>
        <div className="mt-3">
          <AdminPageHeader
            title={order.number}
            actions={
              <>
                <AdminHeaderAction
                  icon={Printer}
                  label="Packing slip"
                  href={`/admin/orders/${order._id}/pack`}
                  variant="secondary"
                />
                {access.update && order.payment.status !== "paid" ? (
                  <AdminHeaderAction
                    icon={Banknote}
                    label="Mark COD collected"
                    disabled={actionBusy === "collect"}
                    loadingLabel="Saving…"
                    onClick={async () => {
                      setActionBusy("collect");
                      const res = await fetch(`/api/v1/admin/orders/${params.id}/collect`, { method: "POST" });
                      const json = await res.json();
                      setActionBusy(null);
                      if (json.ok) {
                        toast.success("COD marked collected");
                        setOrder(json.data.order);
                      } else toastApiError(json, "Could not mark collected");
                    }}
                  />
                ) : order.payment.status === "paid" ? (
                  <span className="hidden h-11 items-center rounded-xl bg-brand-mist px-4 text-sm text-brand-dark sm:inline-flex">
                    COD collected
                  </span>
                ) : null}
              </>
            }
          />
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge value={order.status} />
            <StatusBadge value={order.channel} />
            <StatusBadge value={order.payment.status === "paid" ? "paid" : "unpaid"} />
            {order.createdAt ? <span className="text-ink-faint">{formatAdminDate(order.createdAt)}</span> : null}
          </div>
        </div>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {order.customerCancelRequestedAt ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Customer requested cancel.</p>
      ) : null}
      {order.customerReturnRequestedAt ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Customer requested return / exchange.</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">Ship to</p>
          <p className="mt-3 text-base font-semibold">{order.shippingAddress.fullName}</p>
          <p className="mt-1 text-sm text-ink-muted">{order.shippingAddress.phone}</p>
          <p className="mt-2 text-sm">
            {order.shippingAddress.street}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.province}
          </p>
          {order.callBeforeDelivery ? <p className="mt-3 text-xs font-medium text-brand-dark">Call before delivery</p> : null}
          {order.deliveryInstructions ? <p className="mt-2 text-sm text-ink-muted">{order.deliveryInstructions}</p> : null}
          {order.notes ? <p className="mt-2 text-sm text-ink-muted">{order.notes}</p> : null}
        </div>
        <div className="rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">Collect COD</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{formatPkr(order.payment.collectAmount || order.amounts.total)}</p>
          <p className="mt-2 text-sm text-ink-muted">
            Subtotal {formatPkr(order.amounts.subtotal)}
            {order.amounts.discount ? ` · Discount ${formatPkr(order.amounts.discount)}` : ""} · Shipping{" "}
            {formatPkr(order.amounts.shipping || 0)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <AdminTable>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Cost</th>
                <th>Profit</th>
                {canEditItems ? <th></th> : null}
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.sku}>
                  <td>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-ink-faint">
                      {item.color} · EU {item.sizeEu}
                    </p>
                  </td>
                  <td className="font-mono text-xs text-ink-muted">{item.sku}</td>
                  <td>
                    {canEditItems ? (
                      <input
                        type="number"
                        min={1}
                        disabled={savingItems}
                        defaultValue={item.qty}
                        key={`${item.sku}-${item.qty}`}
                        className="w-20"
                        onBlur={(e) => {
                          const qty = Math.max(1, Number(e.target.value) || 1);
                          if (qty === item.qty) return;
                          void saveItems(order.items.map((row) => (row.sku === item.sku ? { sku: row.sku, qty } : { sku: row.sku, qty: row.qty })));
                        }}
                      />
                    ) : (
                      item.qty
                    )}
                  </td>
                  <td className="font-medium">{formatPkr(item.price)}</td>
                  <td className="text-ink-muted">{item.cost ? formatPkr(item.cost) : "—"}</td>
                  <td>{item.cost ? formatPkr((item.price - item.cost) * item.qty) : "—"}</td>
                  {canEditItems ? (
                    <td>
                      <button
                        type="button"
                        disabled={savingItems || order.items.length < 2}
                        title={order.items.length < 2 ? "Cancel the order to remove the last pair" : "Remove pair"}
                        className={rowBtnDanger}
                        onClick={() =>
                          void saveItems(order.items.filter((row) => row.sku !== item.sku).map((row) => ({ sku: row.sku, qty: row.qty })))
                        }
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Remove
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTable>

        {canEditItems ? (
          <div className="rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold">Add pair</p>
            <p className="mt-1 text-xs text-ink-muted">Customer called to add a size? Reserve it here before packing.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_7rem_auto]">
              <AppSelect
                value={addSku}
                onChange={setAddSku}
                placeholder="Select size SKU"
                options={[{ value: "", label: "Select size SKU" }, ...addOptions]}
              />
              <input type="number" min={1} value={addQty} onChange={(e) => setAddQty(Number(e.target.value))} />
              <Button
                type="button"
                variant="secondary"
                disabled={savingItems || !addSku}
                onClick={() => {
                  const existing = order.items.find((row) => row.sku === addSku);
                  const qty = Math.max(1, addQty || 1);
                  const next = existing
                    ? order.items.map((row) => (row.sku === addSku ? { sku: row.sku, qty: row.qty + qty } : { sku: row.sku, qty: row.qty }))
                    : [...order.items.map((row) => ({ sku: row.sku, qty: row.qty })), { sku: addSku, qty }];
                  void saveItems(next);
                }}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink-muted">
            Items lock after packing or COD collection. Hold the order (if still confirmed) before changing pairs.
          </p>
        )}
      </div>

      {actions.length ? (
        <div className="space-y-4 rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold">Next step</p>
          <label className="block text-sm font-medium">
            Staff note
            <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5 w-full" placeholder="Optional note on this action" />
          </label>
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
              <button
                key={a.to}
                type="button"
                disabled={actionBusy !== null}
                data-testid={`order-action-${a.to}`}
                onClick={() => void move(a.to)}
                className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-60 ${TONE[a.tone]}`}
              >
                <BusyLabel loading={actionBusy === a.to} label="Updating…">
                  {a.label}
                </BusyLabel>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <form
        className="grid gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm md:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setActionBusy("tracking");
          const res = await fetch(`/api/v1/admin/orders/${params.id}/shipment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courierName, trackingNumber, trackingUrl }),
          });
          const json = await res.json();
          setActionBusy(null);
          if (!json.ok) toastApiError(json, "Could not save tracking");
          else {
            toast.success("Tracking saved");
            setOrder(json.data.order);
          }
        }}
      >
        <p className="text-sm font-semibold md:col-span-3">Tracking</p>
        <input placeholder="Courier" value={courierName} onChange={(e) => setCourierName(e.target.value)} />
        <input placeholder="Tracking / CN" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
        <input placeholder="Tracking URL" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
        {access.update ? (
        <button type="submit" disabled={actionBusy === "tracking"} className="inline-flex items-center justify-center rounded-xl border border-[var(--admin-line)] bg-[#f6f8f7] px-4 py-2.5 text-sm disabled:opacity-60 md:col-span-3">
          <BusyLabel loading={actionBusy === "tracking"} label="Saving…">
            Save tracking (shown to customer)
          </BusyLabel>
        </button>
        ) : null}
      </form>

      <div className="rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold">Timeline</p>
        <ol className="mt-4 space-y-4">
          {(order.events || []).map((ev, i) => (
            <li key={`${ev.to}-${i}`} className="flex gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
              <div>
                <p className="text-sm">
                  <span className="capitalize text-ink-faint">{ev.from.replaceAll("_", " ")}</span>
                  <span className="mx-1.5 text-ink-faint">→</span>
                  <span className="font-medium capitalize">{ev.to.replaceAll("_", " ")}</span>
                </p>
                {ev.note ? <p className="text-xs text-ink-muted">{ev.note}</p> : null}
                {ev.at ? <p className="text-xs text-ink-faint">{formatAdminDate(ev.at)}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
