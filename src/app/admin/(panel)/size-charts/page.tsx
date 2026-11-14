"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2, X } from "lucide-react";
import {
  AdminModal,
  AdminPageHeader,
  AdminSearch,
  ConfirmDialog,
  EmptyNote,
  SingleSelect,
  RowEditButton,
  rowBtnDanger,
} from "@/components/admin/ui";
import { AppSelect } from "@/components/ui/app-select";

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
  "h-9 w-full rounded-lg border border-[#e7ebe8] bg-white px-2 text-sm outline-none focus:border-brand";

const COLS = [
  { key: "eu" as const, label: "EU", hint: "Europe", desc: "European size — the size Agile Sole sells." },
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
      setFormError(json.error?.message || "Could not save");
      return;
    }
    setEditing(null);
    await load();
  }

  async function remove() {
    if (!pending) return;
    setBusy(true);
    await fetch(`/api/v1/admin/size-charts/${pending.id}`, { method: "DELETE" });
    setBusy(false);
    setPending(null);
    await load();
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Size charts"
        description="How EU sizes map to Pakistan, UK, US, and foot length in centimetres."
        actions={
          <button
            type="button"
            onClick={openNew}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Add chart
          </button>
        }
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
                    <RowEditButton onClick={() => openEdit(c)} />
                    <button type="button" className={rowBtnDanger} onClick={() => setPending(c)}>
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
          <form onSubmit={save} className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#e7ebe8] px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">Catalog</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  {editing === "new" ? "Add size chart" : "Edit size chart"}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">EU is the shop size. PK is Pakistan. UK / US are conversions. CM is foot length.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted hover:bg-[#f4f7f5] hover:text-ink"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-6 py-5">
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
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-medium text-ink-muted">Conversion rows</p>
                  <button
                    type="button"
                    className="text-sm font-medium text-brand-dark"
                    onClick={() => setForm({ ...form, rows: [...form.rows, { eu: "", pk: "", uk: "", us: "", cm: "" }] })}
                  >
                    + Add size
                  </button>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-[#e7ebe8]">
                  <table className="variant-grid min-w-full text-left text-sm">
                    <thead>
                      <tr>
                        {COLS.map((c) => (
                          <th key={c.key}>
                            {c.label}
                            <span className="ms-1 font-normal normal-case tracking-normal text-ink-faint">{c.hint}</span>
                          </th>
                        ))}
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.rows.map((r, i) => (
                        <tr key={i}>
                          {COLS.map((c) => (
                            <td key={c.key}>
                              <input className={cell} value={r[c.key] || ""} onChange={(e) => setRow(i, c.key, e.target.value)} />
                            </td>
                          ))}
                          <td>
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:text-red-700"
                              onClick={() => setForm({ ...form, rows: form.rows.filter((_, j) => j !== i) })}
                              aria-label="Remove row"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {formError ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#e7ebe8] bg-[#f7f8f7] px-6 py-4">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="h-10 rounded-xl border border-[#e7ebe8] bg-white px-4 text-sm font-medium text-ink"
              >
                Cancel
              </button>
              <button type="submit" disabled={busy} className="h-10 rounded-xl bg-brand px-5 text-sm font-medium text-white disabled:opacity-60">
                {busy ? "Saving…" : editing === "new" ? "Create chart" : "Save changes"}
              </button>
            </div>
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
