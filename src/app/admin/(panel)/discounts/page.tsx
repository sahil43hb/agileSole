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
  rowBtn,
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
  maxPerCustomer?: number;
  usedCount: number;
  isActive: boolean;
};

const field =
  "h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm tabular-nums text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const emptyForm = {
  code: "",
  type: "percent",
  value: "10",
  minOrder: "0",
  maxUses: "1",
  maxPerCustomer: "1",
  capUses: false,
  capPerCustomer: false,
  isActive: true,
};

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
  const [pending, setPending] = useState<{ row: Discount; action: "inactive" | "delete" } | null>(null);
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
    const capUses = Boolean(r.maxUses);
    const capPerCustomer = Boolean(r.maxPerCustomer);
    setForm({
      code: r.code,
      type: r.type,
      value: String(r.value || 0),
      minOrder: String(r.minOrder || 0),
      maxUses: String(r.maxUses || 1),
      maxPerCustomer: String(r.maxPerCustomer || 1),
      capUses,
      capPerCustomer,
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
      maxUses: form.capUses ? Math.max(1, Number(form.maxUses || 1)) : 0,
      maxPerCustomer: form.capPerCustomer ? Math.max(1, Number(form.maxPerCustomer || 1)) : 0,
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

  async function setActive(row: Discount, isActive: boolean) {
    setBusy(true);
    const res = await fetch(`/api/v1/admin/discounts/${row._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    setBusy(false);
    const result = await toastFromResponse(
      res,
      "Could not update discount",
      isActive ? "Discount activated" : "Discount set inactive",
    );
    if (!result.ok) {
      setPending(null);
      return;
    }
    setPending(null);
    await load();
  }

  async function remove() {
    if (!pending) return;
    setBusy(true);
    const res = await fetch(`/api/v1/admin/discounts/${pending.row._id}`, { method: "DELETE" });
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
              <th>Per shopper</th>
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
                <td className="text-ink-muted">{r.maxPerCustomer ? `${r.maxPerCustomer} each` : "—"}</td>
                <td>
                  <StatusBadge value={r.isActive ? "active" : "inactive"} />
                </td>
                <td>
                  <div className="flex flex-nowrap items-center justify-end gap-1.5">
                    {access.update ? <RowEditButton onClick={() => openEdit(r)} /> : null}
                    {access.update && r.isActive ? (
                      <button type="button" className={rowBtn} onClick={() => setPending({ row: r, action: "inactive" })}>
                        Inactive
                      </button>
                    ) : null}
                    {access.update && !r.isActive ? (
                      <button type="button" className={rowBtn} disabled={busy} onClick={() => void setActive(r, true)}>
                        Activate
                      </button>
                    ) : null}
                    {access.delete ? (
                    <button type="button" className={rowBtnDanger} onClick={() => setPending({ row: r, action: "delete" })}>
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
            <AdminModalBody className="space-y-5">
              <label className="block space-y-1.5 text-[13px] font-medium text-ink-muted">
                Code
                <input required className={`${field} font-mono uppercase`} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </label>
              <div className={form.type === "free_shipping" ? "" : "grid gap-4 sm:grid-cols-2"}>
                <label className="block space-y-1.5 text-[13px] font-medium text-ink-muted">
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
                  <label className="block space-y-1.5 text-[13px] font-medium text-ink-muted">
                    {form.type === "percent" ? "Percent off" : "Amount"}
                    <div className="relative">
                      <input type="number" min={0} className={`${field} ${form.type === "fixed" ? "pr-14" : "pr-10"}`} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                      <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-ink-faint">{form.type === "percent" ? "%" : "PKR"}</span>
                    </div>
                  </label>
                ) : null}
              </div>
              <label className="block space-y-1.5 text-[13px] font-medium text-ink-muted">
                Minimum order
                <div className="relative">
                  <input type="number" min={0} className={`${field} pr-14`} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
                  <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-ink-faint">PKR</span>
                </div>
                <span className="block text-[12px] font-normal text-ink-faint">Use 0 if any order size can apply this code.</span>
              </label>
              <div className="space-y-3 rounded-2xl border border-[#e7ebe8] bg-[#fafbfa] p-4">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Usage limits</p>
                  <p className="mt-0.5 text-[12px] text-ink-faint">Leave a limit off for unlimited uses. Shoppers must be signed in to apply a code.</p>
                </div>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={form.capUses}
                    onChange={(e) => setForm({ ...form, capUses: e.target.checked })}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">Limit total uses</span>
                    {form.capUses ? (
                      <span className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          className={`${field} h-10 w-[5.5rem] shrink-0 px-3`}
                          value={form.maxUses}
                          onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                        />
                        <span className="text-[13px] font-normal text-ink-muted">times in total</span>
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-[12px] font-normal text-ink-faint">Anyone can redeem until you turn this on.</span>
                    )}
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 border-t border-[#eef1ef] pt-3">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={form.capPerCustomer}
                    onChange={(e) => setForm({ ...form, capPerCustomer: e.target.checked })}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">Limit per customer</span>
                    {form.capPerCustomer ? (
                      <span className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          className={`${field} h-10 w-[5.5rem] shrink-0 px-3`}
                          value={form.maxPerCustomer}
                          onChange={(e) => setForm({ ...form, maxPerCustomer: e.target.value })}
                        />
                        <span className="text-[13px] font-normal text-ink-muted">times per signed-in shopper</span>
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-[12px] font-normal text-ink-faint">The same shopper can reuse this code.</span>
                    )}
                  </span>
                </label>
                {editing !== "new" ? (
                  <p className="border-t border-[#eef1ef] pt-3 text-[12px] text-ink-faint">
                    Used {(editing as Discount).usedCount || 0}
                    {(editing as Discount).maxUses ? ` of ${(editing as Discount).maxUses}` : ""} times so far.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`flex h-12 w-full items-center justify-between rounded-xl border px-3.5 text-sm ${form.isActive ? "border-brand bg-brand-mist text-brand-dark" : "border-[#e7ebe8] bg-[#f7f8f7] text-ink-muted"}`}
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
        title={pending?.action === "delete" ? "Delete this code?" : "Make this code inactive?"}
        body={
          pending?.action === "delete"
            ? `${pending.row.code} will stop working at checkout.`
            : `${pending?.row.code} will stop working at checkout. You can activate it again later.`
        }
        confirmLabel={pending?.action === "delete" ? "Delete" : "Set inactive"}
        danger={pending?.action === "delete"}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          if (pending.action === "delete") void remove();
          else void setActive(pending.row, false);
        }}
      />
    </div>
  );
}
