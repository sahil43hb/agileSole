"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, User, X } from "lucide-react";
import { formatPkr } from "@/shared/money";
import { AdminModal, AdminPageHeader, AdminSearch, AdminTable, ConfirmDialog, EmptyNote, RowEditButton, StatusBadge } from "@/components/admin/ui";

const fieldClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

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
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "blocked" | "rto">("all");
  const [pending, setPending] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLocale, setEditLocale] = useState("en");
  const [editRto, setEditRto] = useState(0);
  const [editError, setEditError] = useState("");
  const [busy, setBusy] = useState(false);

  function openEdit(row: Row) {
    setEditing(row);
    setEditName(row.name || "");
    setEditPhone(row.phone || "");
    setEditEmail(row.email || "");
    setEditLocale(row.locale || "en");
    setEditRto(row.rtoCount || 0);
    setEditError("");
  }

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
        description={`${rows.length} in the book · COD history and RTO risk`}
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
                  <p className="font-medium">{r.name || "—"}</p>
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
                    <RowEditButton onClick={() => openEdit(r)} />
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </AdminTable>
      )}

      {editing ? (
        <AdminModal onClose={() => setEditing(null)}>
          <form
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            onSubmit={async (e) => {
              e.preventDefault();
              setEditError("");
              setBusy(true);
              const res = await fetch(`/api/v1/admin/customers/${editing.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: editName,
                  phone: editPhone,
                  email: editEmail,
                  locale: editLocale,
                  rtoCount: editRto,
                }),
              });
              const json = await res.json();
              setBusy(false);
              if (!json.ok) {
                setEditError(json.error?.message || "Could not save");
                return;
              }
              setEditing(null);
              load();
            }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#e7ebe8] px-6 py-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-sm font-semibold text-white">
                  {(editName || "C")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase())
                    .join("") || "C"}
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold tracking-tight">Edit customer</h2>
                  <p className="mt-0.5 truncate text-sm text-ink-muted">{editing.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={editing.blockedAt ? "blocked" : "active"} />
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted hover:bg-[#f4f7f5] hover:text-ink"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <label className="block text-[13px] font-medium text-ink-muted">
                Full name
                <span className="relative mt-1.5 block">
                  <User className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <input required value={editName} onChange={(e) => setEditName(e.target.value)} className={`${fieldClass} mt-0 ps-10`} />
                </span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-[13px] font-medium text-ink-muted">
                  Phone
                  <span className="relative mt-1.5 block">
                    <Phone className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                    <input required value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={`${fieldClass} mt-0 ps-10 font-mono`} />
                  </span>
                </label>
                <label className="block text-[13px] font-medium text-ink-muted">
                  Email
                  <span className="relative mt-1.5 block">
                    <Mail className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Optional"
                      className={`${fieldClass} mt-0 ps-10`}
                    />
                  </span>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[13px] font-medium text-ink-muted">Language</p>
                  <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl bg-[#f4f7f5] p-1">
                    {[
                      { id: "en", label: "English" },
                      { id: "ur", label: "Urdu" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEditLocale(opt.id)}
                        className={`h-9 rounded-lg text-sm font-medium transition ${
                          editLocale === opt.id ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block text-[13px] font-medium text-ink-muted">
                  RTO count
                  <input
                    type="number"
                    min={0}
                    value={editRto}
                    onChange={(e) => setEditRto(Number(e.target.value))}
                    className={fieldClass}
                  />
                </label>
              </div>
              {editError ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</p> : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#e7ebe8] bg-[#f7f8f7] px-6 py-4">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="h-10 rounded-xl border border-[#e7ebe8] bg-white px-4 text-sm font-medium text-ink hover:bg-white"
              >
                Cancel
              </button>
              <button type="submit" disabled={busy} className="h-10 rounded-xl bg-brand px-5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
                {busy ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

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
          await fetch(`/api/v1/admin/customers/${pending.id}/block`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ blocked: !pending.blockedAt }),
          });
          setBusy(false);
          setPending(null);
          load();
        }}
      />
    </div>
  );
}
