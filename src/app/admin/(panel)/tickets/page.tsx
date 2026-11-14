"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, RotateCcw, X } from "lucide-react";
import {
  AdminModal,
  AdminPageHeader,
  EmptyNote,
  StatusBadge,
  formatAdminDate,
} from "@/components/admin/ui";
import { AppSelect } from "@/components/ui/app-select";

type Ticket = {
  _id: string;
  type: string;
  status: string;
  reason: string;
  orderNumber?: string;
  orderId?: string;
  customerId?: string;
  locale?: string;
  createdAt: string;
  updatedAt?: string;
  customer?: { id: string; name?: string; phone?: string; email?: string } | null;
};

function localYmd(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [open, setOpen] = useState<Ticket | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/v1/admin/tickets")
      .then((r) => r.json())
      .then((j) => j.ok && setTickets(j.data.tickets));
  }, []);

  const visible = useMemo(
    () =>
      tickets.filter((t) => {
        if (status && t.status !== status) return false;
        if (date && localYmd(t.createdAt) !== date) return false;
        return true;
      }),
    [tickets, status, date],
  );

  async function openTicket(t: Ticket) {
    setOpen(t);
    const res = await fetch(`/api/v1/admin/tickets/${t._id}`);
    const json = await res.json();
    if (json.ok) setOpen(json.data.ticket);
  }

  async function setTicketStatus(id: string, next: string) {
    setBusy(true);
    await fetch(`/api/v1/admin/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    setTickets((prev) => prev.map((x) => (x._id === id ? { ...x, status: next } : x)));
    setOpen((prev) => (prev && prev._id === id ? { ...prev, status: next } : prev));
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Tickets" description="Cancel, return, support, and data requests." />
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "", label: "All" },
          { id: "open", label: "Open" },
          { id: "accepted", label: "Accepted" },
          { id: "closed", label: "Closed" },
        ].map((f) => (
          <button
            key={f.id || "all"}
            type="button"
            onClick={() => setStatus(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm ${
              status === f.id ? "bg-ink text-white" : "border border-[var(--admin-line)] bg-white text-ink-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
        <label className="relative ms-auto">
          <CalendarDays className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="admin-search-input h-11 rounded-xl border border-[var(--admin-line)] bg-white ps-10 pe-3 text-sm shadow-sm"
            aria-label="Filter by date"
          />
        </label>
        {date || status ? (
          <button
            type="button"
            onClick={() => {
              setDate("");
              setStatus("");
            }}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[var(--admin-line)] bg-white px-3.5 text-sm text-ink-muted hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        ) : null}
      </div>
      {!visible.length ? (
        <EmptyNote>No tickets in this filter.</EmptyNote>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Created</th>
              <th>Order</th>
              <th>Status</th>
              <th>Reason</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => (
              <tr
                key={t._id}
                className="cursor-pointer"
                onClick={() => void openTicket(t)}
              >
                <td className="capitalize font-medium">{t.type.replaceAll("_", " ")}</td>
                <td className="whitespace-nowrap text-ink-muted">{formatAdminDate(t.createdAt)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  {t.orderId ? (
                    <Link href={`/admin/orders/${t.orderId}`} className="hover:text-brand-dark">
                      {t.orderNumber || t.orderId}
                    </Link>
                  ) : (
                    t.orderNumber || "—"
                  )}
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <AppSelect
                    size="sm"
                    value={t.status}
                    onChange={(status) => void setTicketStatus(t._id, status)}
                    options={[
                      { value: "open", label: "Open" },
                      { value: "accepted", label: "Accepted" },
                      { value: "closed", label: "Closed" },
                    ]}
                  />
                </td>
                <td className="max-w-xs truncate text-ink-muted">{t.reason}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="h-8 rounded-lg border border-[var(--admin-line)] bg-white px-3 text-xs font-medium text-ink hover:bg-[#f4f7f5]"
                    onClick={() => void openTicket(t)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {open ? (
        <AdminModal onClose={() => setOpen(null)}>
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#e7ebe8] px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">Ticket</p>
                <h2 className="mt-1 text-lg font-semibold capitalize tracking-tight">{open.type.replaceAll("_", " ")}</h2>
                <p className="mt-1 text-sm text-ink-muted">{formatAdminDate(open.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={open.status} />
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted hover:bg-[#f4f7f5] hover:text-ink"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#f7f8f7] px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">Order</p>
                  {open.orderId ? (
                    <Link href={`/admin/orders/${open.orderId}`} className="mt-1 block text-sm font-medium text-brand-dark">
                      {open.orderNumber || open.orderId}
                    </Link>
                  ) : (
                    <p className="mt-1 text-sm">{open.orderNumber || "—"}</p>
                  )}
                </div>
                <div className="rounded-2xl bg-[#f7f8f7] px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">Language</p>
                  <p className="mt-1 text-sm uppercase">{open.locale || "en"}</p>
                </div>
              </div>

              {open.customer || open.customerId ? (
                <div className="rounded-2xl bg-[#f7f8f7] px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">Customer</p>
                  {open.customer ? (
                    <>
                      <p className="mt-1 text-sm font-medium">{open.customer.name || "—"}</p>
                      <p className="text-sm text-ink-muted">{open.customer.phone || open.customer.email || open.customer.id}</p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-ink-muted">{open.customerId}</p>
                  )}
                </div>
              ) : null}

              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">Message</p>
                <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-[#e7ebe8] bg-white px-4 py-3 text-sm leading-relaxed text-ink">
                  {open.reason || "No message"}
                </p>
              </div>

              <div>
                <p className="mb-1.5 text-[13px] font-medium text-ink-muted">Status</p>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#f4f7f5] p-1">
                  {["open", "accepted", "closed"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busy}
                      onClick={() => void setTicketStatus(open._id, s)}
                      className={`h-9 rounded-lg text-sm font-medium capitalize transition disabled:opacity-60 ${
                        open.status === s ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-[#e7ebe8] bg-[#f7f8f7] px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="h-10 rounded-xl border border-[#e7ebe8] bg-white px-4 text-sm font-medium text-ink"
              >
                Close
              </button>
            </div>
          </div>
        </AdminModal>
      ) : null}
    </div>
  );
}
