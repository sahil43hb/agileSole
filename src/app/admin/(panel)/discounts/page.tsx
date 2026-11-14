"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";
import { formatPkr } from "@/shared/money";
import {
  AdminModal,
  AdminPageHeader,
  AdminSearch,
  ConfirmDialog,
  EmptyNote,
  SingleSelect,
  StatusBadge,
  RowEditButton,
  rowBtnDanger,
} from "@/components/admin/ui";
import { AppSelect } from "@/components/ui/app-select";

type Discount = {
  _id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
};

const field =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const emptyForm = { code: "", type: "percent", value: "10", minOrder: "0", maxUses: "0", isActive: true };

function typeLabel(type: string) {
  if (type === "percent") return "Percent off";
  if (type === "fixed") return "Fixed PKR";
  return "Free shipping";
}

function valueLabel(r: Discount) {
  if (r.type === "percent") return `${r.value}%`;
  if (r.type === "fixed") return formatPkr(r.value);
  return "—";
}

export default function DiscountsPage() {
  const [rows, setRows] = useState<Discount[]>([]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Discount | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState<Discount | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/admin/discounts");
    const json = await res.json();
    if (json.ok) setRows(json.data.discounts);
  }
  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (kind !== "all" && r.type !== kind) return false;
      if (status === "active" && !r.isActive) return false;
      if (status === "inactive" && r.isActive) return false;
      if (!q) return true;
      return r.code.toLowerCase().includes(q);
    });
  }, [rows, query, kind, status]);

  function openNew() {
    setForm(emptyForm);
    setFormError("");
    setEditing("new");
  }
  function openEdit(r: Discount) {
    setForm({
      code: r.code,
      type: r.type,
      value: String(r.value || 0),
      minOrder: String(r.minOrder || 0),
      maxUses: String(r.maxUses || 0),
      isActive: r.isActive !== false,
    });
    setFormError("");
    setEditing(r);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    const payload = {
      code: form.code,
      type: form.type,
      value: Number(form.value || 0),
      minOrder: Number(form.minOrder || 0),
      maxUses: Number(form.maxUses || 0),
      isActive: form.isActive,
    };
    const isNew = editing === "new";
    const url = isNew ? "/api/v1/admin/discounts" : `/api/v1/admin/discounts/${(editing as Discount)._id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setFormError(json.error?.message || "Could not save");
      return;
    }
    setEditing(null);
    await load();
  }

  async function remove() {
    if (!pending) return;
    setBusy(true);
    await fetch(`/api/v1/admin/discounts/${pending._id}`, { method: "DELETE" });
    setBusy(false);
    setPending(null);
    await load();
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Discounts"
        description={`${rows.length} codes for checkout and Facebook orders`}
        actions={
          <button type="button" onClick={openNew} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-white">
            <Plus className="h-4 w-4" />
            Add code
          </button>
        }
      />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-3 shadow-sm">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search code" />
        <SingleSelect
          label="Type"
          value={kind}
          onChange={setKind}
          options={[
            { id: "all", label: "Any type" },
            { id: "percent", label: "Percent" },
            { id: "fixed", label: "Fixed PKR" },
            { id: "free_shipping", label: "Free shipping" },
          ]}
        />
        <SingleSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { id: "all", label: "Any status" },
            { id: "active", label: "Active" },
            { id: "inactive", label: "Inactive" },
          ]}
        />
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setKind("all");
            setStatus("all");
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[var(--admin-line)] bg-white px-3.5 text-sm text-ink-muted hover:text-ink"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>
      {!visible.length ? (
        <EmptyNote>No discount codes match.</EmptyNote>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Min order</th>
              <th>Used</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r._id}>
                <td className="font-mono font-medium">{r.code}</td>
                <td className="text-ink-muted">{typeLabel(r.type)}</td>
                <td>{valueLabel(r)}</td>
                <td className="text-ink-muted">{r.minOrder ? formatPkr(r.minOrder) : "—"}</td>
                <td>
                  {r.usedCount || 0}
                  {r.maxUses ? <span className="text-ink-faint"> / {r.maxUses}</span> : null}
                </td>
                <td>
                  <StatusBadge value={r.isActive ? "active" : "inactive"} />
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    <RowEditButton onClick={() => openEdit(r)} />
                    <button type="button" className={rowBtnDanger} onClick={() => setPending(r)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing ? (
        <AdminModal onClose={() => setEditing(null)}>
          <form onSubmit={save} className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#e7ebe8] px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">Growth</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">{editing === "new" ? "Add discount" : "Edit discount"}</h2>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted hover:bg-[#f4f7f5]" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <label className="block text-[13px] font-medium text-ink-muted">
                Code
                <input required className={`${field} font-mono uppercase`} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </label>
              <label className="block text-[13px] font-medium text-ink-muted">
                Type
                <AppSelect
                  value={form.type}
                  onChange={(type) => setForm({ ...form, type })}
                  options={[
                    { value: "percent", label: "Percent off" },
                    { value: "fixed", label: "Fixed PKR" },
                    { value: "free_shipping", label: "Free shipping" },
                  ]}
                />
              </label>
              {form.type !== "free_shipping" ? (
                <label className="block text-[13px] font-medium text-ink-muted">
                  {form.type === "percent" ? "Percent" : "Amount (PKR)"}
                  <input type="number" min={0} className={field} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                </label>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-[13px] font-medium text-ink-muted">
                  Min order (PKR)
                  <input type="number" min={0} className={field} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
                </label>
                <label className="block text-[13px] font-medium text-ink-muted">
                  Max uses (0 = unlimited)
                  <input type="number" min={0} className={field} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
                </label>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-sm ${form.isActive ? "border-brand bg-brand-mist text-brand-dark" : "border-[#e7ebe8] bg-[#f7f8f7] text-ink-muted"}`}
              >
                {form.isActive ? "Active at checkout" : "Inactive"}
                <span className={`h-5 w-9 rounded-full p-0.5 ${form.isActive ? "bg-brand" : "bg-[#d5ddd7]"}`}>
                  <span className={`block h-4 w-4 rounded-full bg-white transition ${form.isActive ? "translate-x-4" : ""}`} />
                </span>
              </button>
              {formError ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e7ebe8] bg-[#f7f8f7] px-6 py-4">
              <button type="button" onClick={() => setEditing(null)} className="h-10 rounded-xl border border-[#e7ebe8] bg-white px-4 text-sm font-medium">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="h-10 rounded-xl bg-brand px-5 text-sm font-medium text-white disabled:opacity-60">
                {busy ? "Saving…" : editing === "new" ? "Create code" : "Save changes"}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete this code?"
        body={pending ? `${pending.code} will stop working at checkout.` : ""}
        confirmLabel="Delete"
        danger
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
