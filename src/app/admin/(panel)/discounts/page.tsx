"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { formatPkr } from "@/shared/money";
import {
  AdminModal,
  AdminModalBody,
  AdminModalFooter,
  AdminModalHeader,
  AdminHeaderAction,
  AdminPageHeader,
  AdminSearch,
  AdminTable,
  ConfirmDialog,
  EmptyNote,
  SingleSelect,
  StatusBadge,
  RowEditButton,
  modalBtnPrimary,
  modalBtnSecondary,
  rowBtnDanger,
} from "@/components/admin/ui";
import { AppSelect } from "@/components/ui/app-select";
import { SwitchTrack } from "@/components/ui/switch";
import { toast, toastApiError, toastFromResponse } from "@/components/ui/toast";
import { BusyLabel } from "@/components/ui/spinner";
import { useCan } from "@/components/admin/access";

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
  const access = useCan("discounts");
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
      toastApiError(json, "Could not save");
      return;
    }
    toast.success("Discount saved");
    setEditing(null);
    await load();
  }

  async function remove() {
    if (!pending) return;
    setBusy(true);
    const res = await fetch(`/api/v1/admin/discounts/${pending._id}`, { method: "DELETE" });
    setBusy(false);
    const result = await toastFromResponse(res, "Could not delete", "Discount deleted");
    if (!result.ok) {
      setPending(null);
      return;
    }
    setPending(null);
    await load();
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Discounts"
        description={`${rows.length} codes for checkout and Facebook orders`}
        actions={access.create ? <AdminHeaderAction icon={Plus} label="Add code" onClick={openNew} /> : undefined}
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
        <AdminTable>
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
                    {access.update ? <RowEditButton onClick={() => openEdit(r)} /> : null}
                    {access.delete ? (
                    <button type="button" className={rowBtnDanger} onClick={() => setPending(r)}>
                      Delete
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

      {editing ? (
        <AdminModal onClose={() => setEditing(null)}>
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <AdminModalHeader
              kicker="Growth"
              title={editing === "new" ? "Add discount" : "Edit discount"}
              onClose={() => setEditing(null)}
            />
            <AdminModalBody className="space-y-4">
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
                <SwitchTrack on={form.isActive} />
              </button>
              {formError ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}
            </AdminModalBody>
            <AdminModalFooter>
              <button type="button" onClick={() => setEditing(null)} className={modalBtnSecondary}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={modalBtnPrimary}>
                <BusyLabel loading={busy} label="Saving…">
                  {editing === "new" ? "Create code" : "Save changes"}
                </BusyLabel>
              </button>
            </AdminModalFooter>
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
