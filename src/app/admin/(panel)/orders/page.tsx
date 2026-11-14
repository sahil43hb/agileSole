"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, RotateCcw } from "lucide-react";
import { formatPkr } from "@/shared/money";
import {
  AdminPageHeader,
  AdminSearch,
  EmptyNote,
  MultiSelect,
  SingleSelect,
  StatusBadge,
  formatAdminDate,
} from "@/components/admin/ui";

type Order = {
  _id: string;
  number: string;
  status: string;
  channel: string;
  amounts: { total: number };
  shippingAddress: { fullName: string; city: string; phone: string };
  createdAt: string;
  items: { qty: number }[];
};

const STATUS_OPTIONS = [
  { id: "pending_confirmation", label: "Pending confirmation" },
  { id: "unreachable", label: "Unreachable" },
  { id: "on_hold", label: "On hold" },
  { id: "confirmed", label: "Confirmed" },
  { id: "packed", label: "Packed" },
  { id: "pickup_ready", label: "Pickup ready" },
  { id: "shipped", label: "Shipped" },
  { id: "out_for_delivery", label: "Out for delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "delivery_failed", label: "Failed delivery" },
  { id: "returned", label: "Returned" },
  { id: "cancelled", label: "Cancelled" },
];

const CHANNEL_OPTIONS = [
  { id: "web", label: "Web" },
  { id: "facebook", label: "Facebook" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "manual", label: "Manual" },
];

const RANGE_OPTIONS = [
  { id: "all", label: "Any time" },
  { id: "today", label: "Today" },
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
];

function fromDays(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export default function AdminOrdersPage() {
  const [statuses, setStatuses] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [range, setRange] = useState("all");
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const from = useMemo(() => {
    if (range === "today") return fromDays(0);
    if (range === "7") return fromDays(6);
    if (range === "30") return fromDays(29);
    return "";
  }, [range]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statuses.length) params.set("status", statuses.join(","));
    if (query) params.set("q", query);
    if (channels.length) params.set("channel", channels.join(","));
    if (from) params.set("from", from);
    const res = await fetch(`/api/v1/admin/orders?${params.toString()}`);
    const json = await res.json();
    if (json.ok) setOrders(json.data.orders);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses, channels, range]);

  async function resetFilters() {
    setStatuses([]);
    setChannels([]);
    setRange("all");
    setQuery("");
    setLoading(true);
    const res = await fetch("/api/v1/admin/orders");
    const json = await res.json();
    if (json.ok) setOrders(json.data.orders);
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Orders"
        description="COD queue, packing, and delivery — newest first."
        actions={
          <>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--admin-line)] bg-white text-ink-muted"
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <Link
              href="/admin/orders/new"
              className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Manual order
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-3 shadow-sm">
        <AdminSearch
          value={query}
          onChange={setQuery}
          onSubmit={() => void load()}
          placeholder="Search #, phone, name, CN"
        />
        <MultiSelect label="Status" options={STATUS_OPTIONS} value={statuses} onChange={setStatuses} />
        <MultiSelect label="Channel" options={CHANNEL_OPTIONS} value={channels} onChange={setChannels} />
        <SingleSelect label="Date" options={RANGE_OPTIONS} value={range} onChange={setRange} />
        <button
          type="button"
          onClick={() => void resetFilters()}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[var(--admin-line)] bg-white px-3.5 text-sm text-ink-muted hover:text-ink"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {loading && !orders.length ? (
        <EmptyNote>Loading orders…</EmptyNote>
      ) : !orders.length ? (
        <EmptyNote>No orders match these filters.</EmptyNote>
      ) : (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Created</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Channel</th>
                <th>Items</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const qty = (o.items || []).reduce((sum, i) => sum + (i.qty || 0), 0);
                return (
                  <tr key={o._id}>
                    <td>
                      <Link href={`/admin/orders/${o._id}`} className="font-semibold text-ink hover:text-brand-dark">
                        {o.number}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap text-ink-muted">{formatAdminDate(o.createdAt)}</td>
                    <td>
                      <p className="font-medium">{o.shippingAddress?.fullName}</p>
                      <p className="text-xs text-ink-faint">
                        {o.shippingAddress?.phone} · {o.shippingAddress?.city}
                      </p>
                    </td>
                    <td>
                      <StatusBadge value={o.status} />
                    </td>
                    <td className="capitalize text-ink-muted">{o.channel}</td>
                    <td className="text-ink-muted">{qty}</td>
                    <td className="font-medium">{formatPkr(o.amounts?.total || 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
