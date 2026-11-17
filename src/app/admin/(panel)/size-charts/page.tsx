"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
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
  RowEditButton,
  modalBtnPrimary,
  modalBtnSecondary,
  rowBtnDanger,
} from "@/components/admin/ui";
import { AppSelect } from "@/components/ui/app-select";
import { toast, toastApiError, toastFromResponse } from "@/components/ui/toast";
import { BusyLabel } from "@/components/ui/spinner";
import { useCan } from "@/components/admin/access";

type Row = { eu?: string; pk?: string; uk?: string; us?: string; cm?: string };
type Chart = {
  id: string;
  code: string;
  productType: string;
  title: string;
  rawTitle?: { en: string; ur: string };
  rows: Row[];
};

const field =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";
const cell =
  "h-11 w-full rounded-xl border border-[#e7ebe8] bg-white px-3 text-center text-sm tabular-nums outline-none transition placeholder:text-ink-faint focus:border-brand focus:ring-2 focus:ring-brand/20";

const COLS = [
  { key: "eu" as const, label: "EU", hint: "Europe", desc: "European size — the size this shop sells." },
  { key: "pk" as const, label: "PK", hint: "Pakistan", desc: "Pakistan size — same numbers as UK in most local shops." },
  { key: "uk" as const, label: "UK", hint: "United Kingdom", desc: "United Kingdom equivalent." },
  { key: "us" as const, label: "US", hint: "United States", desc: "United States equivalent." },
  { key: "cm" as const, label: "CM", hint: "Foot length", desc: "Foot length from heel to longest toe, in centimetres." },
];

const TYPES = [
  { id: "sneaker", label: "Sneaker" },
  { id: "sandal", label: "Sandal" },
  { id: "kids", label: "Kids" },
  { id: "clog", label: "Clog" },
  { id: "slipper", label: "Slipper" },
  { id: "slide", label: "Slide" },
];

const emptyForm = {
  titleEn: "",
  titleUr: "",
  code: "",
  productType: "sneaker",
  rows: [{ eu: "", pk: "", uk: "", us: "", cm: "" }] as Row[],
};

export default function AdminSizeChartsPage() {
  const access = useCan("size_charts");
  const [charts, setCharts] = useState<Chart[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [editing, setEditing] = useState<Chart | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState<Chart | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/admin/size-charts");
    const json = await res.json();
    if (json.ok) setCharts(json.data.charts);
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return charts.filter((c) => {
      if (type !== "all" && c.productType !== type) return false;
      if (!q) return true;
      return [c.title, c.code, c.productType].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [charts, query, type]);

  function openNew() {
    setForm(emptyForm);
    setFormError("");
    setEditing("new");
  }

  function openEdit(c: Chart) {
    setForm({
      titleEn: c.rawTitle?.en || c.title,
      titleUr: c.rawTitle?.ur || "",
      code: c.code,
      productType: c.productType || "sneaker",
      rows: c.rows.length
        ? c.rows.map((r) => ({ ...r, pk: r.pk || r.uk || "" }))
        : [{ eu: "", pk: "", uk: "", us: "", cm: "" }],
    });
    setFormError("");
    setEditing(c);
  }

  function setRow(i: number, key: keyof Row, value: string) {
    setForm((prev) => {
      const rows = [...prev.rows];
      rows[i] = { ...rows[i], [key]: value };
      return { ...prev, rows };
    });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    const payload = {
      code: form.code.trim(),
      productType: form.productType,
      title: { en: form.titleEn, ur: form.titleUr },
      rows: form.rows.filter((r) => r.eu || r.pk || r.uk || r.us || r.cm),
    };
    const isNew = editing === "new";
    const url = isNew ? "/api/v1/admin/size-charts" : `/api/v1/admin/size-charts/${(editing as Chart).id}`;
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
    toast.success("Size chart saved");
    setEditing(null);
    await load();
  }

  async function remove() {
    if (!pending) return;
    setBusy(true);
    const res = await fetch(`/api/v1/admin/size-charts/${pending.id}`, { method: "DELETE" });
    setBusy(false);
    const result = await toastFromResponse(res, "Could not delete", "Size chart deleted");
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
        title="Size charts"
        description="How EU sizes map to Pakistan, UK, US, and foot length in centimetres."
        actions={access.create ? <AdminHeaderAction icon={Plus} label="Add chart" onClick={openNew} /> : undefined}
      />

      <div className="grid gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        {COLS.map((c) => (
          <div key={c.key} className="rounded-xl bg-[#f7f8f7] px-4 py-3">
            <p className="text-sm font-semibold tracking-tight">{c.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-3 shadow-sm">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search title or code" />
        <SingleSelect
          label="Type"
          value={type}
          onChange={setType}
          options={[{ id: "all", label: "Any type" }, ...TYPES]}
        />
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setType("all");
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[var(--admin-line)] bg-white px-3.5 text-sm text-ink-muted hover:text-ink"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {!visible.length ? (
        <EmptyNote>No size charts match these filters.</EmptyNote>
      ) : (
        <AdminTable>
        <table>
          <thead>
            <tr>
              <th>Chart</th>
              <th>Code</th>
              <th>Type</th>
              <th>Sizes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => (
              <tr key={c.id}>
                <td>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-ink-faint">
                    EU {c.rows[0]?.eu || "—"}–{c.rows[c.rows.length - 1]?.eu || "—"}
                  </p>
                </td>
                <td className="font-mono text-xs text-ink-muted">{c.code}</td>
                <td className="capitalize text-ink-muted">{c.productType}</td>
                <td>{c.rows.length}</td>
                <td>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {access.update ? <RowEditButton onClick={() => openEdit(c)} /> : null}
                    {access.delete ? (
                    <button type="button" className={rowBtnDanger} onClick={() => setPending(c)}>
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
        <AdminModal onClose={() => setEditing(null)} size="xl">
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <AdminModalHeader
              kicker="Catalog"
              title={editing === "new" ? "Add size chart" : "Edit size chart"}
              description="EU is the shop size. PK is Pakistan. UK / US are conversions. CM is foot length."
              onClose={() => setEditing(null)}
            />
            <AdminModalBody className="space-y-4">
              <label className="block text-[13px] font-medium text-ink-muted">
                English title
                <input required className={field} value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} />
              </label>
              <label className="block text-[13px] font-medium text-ink-muted">
                Urdu title
                <input dir="rtl" className={field} value={form.titleUr} onChange={(e) => setForm({ ...form, titleUr: e.target.value })} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-[13px] font-medium text-ink-muted">
                  Code
                  <input required className={field} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="men-eu" />
                </label>
                <label className="block text-[13px] font-medium text-ink-muted">
                  Product type
                  <AppSelect
                    value={form.productType}
                    onChange={(productType) => setForm({ ...form, productType })}
                    options={TYPES.map((t) => ({ value: t.id, label: t.label }))}
                  />
                </label>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-ink">Conversion rows</p>
                    <p className="text-xs text-ink-faint">{form.rows.length} size{form.rows.length === 1 ? "" : "s"}</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center rounded-full bg-brand-mist px-3 text-xs font-semibold text-brand-dark hover:bg-brand/15"
                    onClick={() => setForm({ ...form, rows: [...form.rows, { eu: "", pk: "", uk: "", us: "", cm: "" }] })}
                  >
                    <Plus className="me-1 h-3.5 w-3.5" />
                    Add size
                  </button>
                </div>

                <div className="space-y-3 sm:hidden">
                  {form.rows.map((r, i) => (
                    <div key={i} className="rounded-2xl border border-[#e7ebe8] bg-[#f7f8f7] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold text-ink-muted">Size {i + 1}</p>
                        <button
                          type="button"
                          disabled={form.rows.length === 1}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-white hover:text-red-700 disabled:opacity-30"
                          onClick={() => setForm({ ...form, rows: form.rows.filter((_, j) => j !== i) })}
                          aria-label="Remove size"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {COLS.map((c) => (
                          <label key={c.key} className="block text-[11px] font-medium text-ink-muted">
                            {c.label}
                            <span className="ms-1 font-normal text-ink-faint">{c.hint}</span>
                            <input
                              className={`${cell} mt-1`}
                              value={r[c.key] || ""}
                              onChange={(e) => setRow(i, c.key, e.target.value)}
                              placeholder={c.key === "cm" ? "25.5" : c.key === "eu" ? "40" : "6"}
                              inputMode="decimal"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto rounded-2xl border border-[#e7ebe8] sm:block">
                  <div className="min-w-[40rem]">
                    <div className="grid grid-cols-[3rem_repeat(5,minmax(0,1fr))_2.75rem] gap-2 border-b border-[#eef1ef] bg-[#f7f8f7] px-3 py-2.5">
                      <p className="self-end pb-1 text-[11px] font-medium uppercase tracking-wide text-ink-faint">#</p>
                      {COLS.map((c) => (
                        <div key={c.key} className="min-w-0 px-1">
                          <p className="text-sm font-semibold tracking-tight text-ink">{c.label}</p>
                          <p className="truncate text-[11px] text-ink-faint">{c.hint}</p>
                        </div>
                      ))}
                      <span />
                    </div>
                    <div className="divide-y divide-[#eef1ef]">
                      {form.rows.map((r, i) => (
                        <div key={i} className="grid grid-cols-[3rem_repeat(5,minmax(0,1fr))_2.75rem] items-center gap-2 px-3 py-2.5">
                          <p className="text-center text-xs font-medium tabular-nums text-ink-faint">{i + 1}</p>
                          {COLS.map((c) => (
                            <input
                              key={c.key}
                              className={cell}
                              value={r[c.key] || ""}
                              onChange={(e) => setRow(i, c.key, e.target.value)}
                              placeholder={c.key === "cm" ? "25.5" : c.key === "eu" ? "40" : "6"}
                              inputMode="decimal"
                              aria-label={`${c.label} size ${i + 1}`}
                            />
                          ))}
                          <button
                            type="button"
                            disabled={form.rows.length === 1}
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-faint hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                            onClick={() => setForm({ ...form, rows: form.rows.filter((_, j) => j !== i) })}
                            aria-label="Remove size"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {formError ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}
            </AdminModalBody>
            <AdminModalFooter>
              <button type="button" onClick={() => setEditing(null)} className={modalBtnSecondary}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={modalBtnPrimary}>
                <BusyLabel loading={busy} label="Saving…">
                  {editing === "new" ? "Create chart" : "Save changes"}
                </BusyLabel>
              </button>
            </AdminModalFooter>
          </form>
        </AdminModal>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete this size chart?"
        body={pending ? `${pending.title} will be removed. Products that used it will fall back to a default chart.` : ""}
        confirmLabel="Delete"
        danger
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
