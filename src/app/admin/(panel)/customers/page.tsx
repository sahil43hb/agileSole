"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatPkr } from "@/shared/money";
import { AdminPageHeader, AdminSearch, AdminTable, ConfirmDialog, EmptyNote, RowEditButton, StatusBadge } from "@/components/admin/ui";
import { toastFromResponse } from "@/components/ui/toast";
import { useCan } from "@/components/admin/access";

type Row = {
  id: string;
  name: string;
  phone: string;
  email: string;
  locale?: string;
  orders: number;
  ltv: number;
  rtoCount: number;
  blockedAt?: string;
};

export default function AdminCustomersPage() {
  const access = useCan("customers");
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "blocked" | "rto">("all");
  const [pending, setPending] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/admin/customers");
    const json = await res.json();
    if (json.ok) setRows(json.data.customers);
  }
  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "blocked" && !r.blockedAt) return false;
      if (filter === "rto" && !r.rtoCount) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return [r.name, r.phone, r.email].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, query, filter]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Customers"
        description={`${rows.length} in the book · Open a customer to see orders, addresses, and COD risk`}
      />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-3 shadow-sm">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search name, phone, email" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "All" },
          { id: "blocked", label: "Blocked" },
          { id: "rto", label: "Has RTO" },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id as typeof filter)}
            className={`rounded-full px-3.5 py-1.5 text-sm ${
              filter === f.id ? "bg-ink text-white" : "border border-[var(--admin-line)] bg-white text-ink-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {!visible.length ? (
        <EmptyNote>No customers match.</EmptyNote>
      ) : (
        <AdminTable>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>LTV</th>
              <th>RTO</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/admin/customers/${r.id}`} className="font-medium hover:text-brand-dark">
                    {r.name || "—"}
                  </Link>
                  <p className="text-xs text-ink-faint">{r.email || "No email"}</p>
                </td>
                <td className="font-mono text-xs">{r.phone}</td>
                <td>{r.orders}</td>
                <td>{formatPkr(r.ltv)}</td>
                <td>{r.rtoCount}</td>
                <td>
                  <StatusBadge value={r.blockedAt ? "blocked" : "active"} />
                </td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    <RowEditButton href={`/admin/customers/${r.id}`}>View</RowEditButton>
                    {access.update ? (
                    <button
                      type="button"
                      className={
                        r.blockedAt
                          ? "h-8 rounded-lg border border-[var(--admin-line)] bg-white px-3 text-xs font-medium text-ink hover:bg-[#f4f7f5]"
                          : "h-8 rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-700 hover:bg-red-50"
                      }
                      onClick={() => setPending(r)}
                    >
                      {r.blockedAt ? "Unblock" : "Block"}
                    </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </AdminTable>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.blockedAt ? "Unblock this customer?" : "Block this customer?"}
        body={
          pending?.blockedAt
            ? `${pending.name || pending.phone} will be able to place COD orders again.`
            : `${pending?.name || pending?.phone} will not be able to place COD orders until you unblock them.`
        }
        confirmLabel={pending?.blockedAt ? "Unblock" : "Block"}
        danger={!pending?.blockedAt}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          setBusy(true);
          const res = await fetch(`/api/v1/admin/customers/${pending.id}/block`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ blocked: !pending.blockedAt }),
          });
          setBusy(false);
          const result = await toastFromResponse(
            res,
            "Could not update customer",
            pending.blockedAt ? "Customer unblocked" : "Customer blocked",
          );
          setPending(null);
          if (result.ok) load();
        }}
      />
    </div>
  );
}
