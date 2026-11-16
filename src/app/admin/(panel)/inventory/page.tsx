"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw, X } from "lucide-react";
import {
  AdminModal,
  AdminPageHeader,
  AdminSearch,
  AdminTable,
  EmptyNote,
  MultiSelect,
  SingleSelect,
  StatusBadge,
  RowEditButton,
} from "@/components/admin/ui";

type Row = {
  sku: string;
  productId: string;
  productTitle: string;
  slug: string;
  gender?: string;
  color?: string;
  sizeEu?: string;
  onHand: number;
  reserved: number;
  available: number;
  isActive?: boolean;
};

const field =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

function stockKey(r: Row) {
  if (r.available <= 0) return "out";
  if (r.available <= 2) return "low";
  return "in";
}

function stockLabel(r: Row) {
  const k = stockKey(r);
  if (k === "out") return "out of stock";
  if (k === "low") return "low stock";
  return "in stock";
}

export default function InventoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [stock, setStock] = useState("all");
  const [products, setProducts] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [onHand, setOnHand] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/admin/inventory");
    const json = await res.json();
    if (json.ok) setRows(json.data.rows);
  }

  useEffect(() => {
    void load();
  }, []);

  const productOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) map.set(r.productId, r.productTitle);
    return [...map.entries()].map(([id, label]) => ({ id, label }));
  }, [rows]);

  const colorOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.color).filter(Boolean) as string[]);
    return [...set].sort().map((c) => ({ id: c, label: c }));
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (stock !== "all" && stockKey(r) !== stock) return false;
      if (products.length && !products.includes(r.productId)) return false;
      if (colors.length && !colors.includes(r.color || "")) return false;
      if (genders.length && !genders.includes(r.gender || "")) return false;
      if (!q) return true;
      return [r.productTitle, r.sku, r.color, r.sizeEu, r.slug].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, query, stock, products, colors, genders]);

  const low = rows.filter((r) => stockKey(r) === "low").length;
  const out = rows.filter((r) => stockKey(r) === "out").length;

  function openEdit(r: Row) {
    setEditing(r);
    setOnHand(r.onHand);
    setError("");
  }

  async function save(sku: string, next: number) {
    setError("");
    setBusy(true);
    const res = await fetch("/api/v1/admin/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, onHand: next }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setError(json.error?.message || "Could not save");
      return false;
    }
    await load();
    return true;
  }

  async function submitEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const ok = await save(editing.sku, onHand);
    if (ok) setEditing(null);
  }

  const availablePreview = editing ? Math.max(0, onHand - (editing.reserved || 0)) : 0;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Inventory"
        description={`${rows.length} SKUs · ${low} low · ${out} out of stock`}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-3 shadow-sm">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search product, SKU, color" />
        <SingleSelect
          label="Stock"
          value={stock}
          onChange={setStock}
          options={[
            { id: "all", label: "Any stock" },
            { id: "in", label: "In stock" },
            { id: "low", label: "Low stock" },
            { id: "out", label: "Out of stock" },
          ]}
        />
        <MultiSelect label="Product" options={productOptions} value={products} onChange={setProducts} />
        <MultiSelect label="Color" options={colorOptions} value={colors} onChange={setColors} />
        <MultiSelect
          label="Gender"
          options={[
            { id: "men", label: "Men" },
            { id: "women", label: "Women" },
            { id: "kids", label: "Kids" },
            { id: "unisex", label: "Unisex" },
          ]}
          value={genders}
          onChange={setGenders}
        />
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setStock("all");
            setProducts([]);
            setColors([]);
            setGenders([]);
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[var(--admin-line)] bg-white px-3.5 text-sm text-ink-muted hover:text-ink"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {error && !editing ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {!visible.length ? (
        <EmptyNote>No SKUs match these filters.</EmptyNote>
      ) : (
        <AdminTable>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Color</th>
              <th>EU</th>
              <th>On hand</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.sku}>
                <td>
                  <Link href={`/admin/products/${r.productId}`} className="font-medium hover:text-brand-dark">
                    {r.productTitle}
                  </Link>
                </td>
                <td className="font-mono text-xs text-ink-muted">{r.sku}</td>
                <td className="text-ink-muted">{r.color || "—"}</td>
                <td>{r.sizeEu || "—"}</td>
                <td className="font-medium">{r.onHand}</td>
                <td className="text-ink-muted">{r.reserved}</td>
                <td className="font-medium">{r.available}</td>
                <td>
                  <StatusBadge value={stockLabel(r)} />
                </td>
                <td>
                  <div className="flex justify-end">
                    <RowEditButton onClick={() => openEdit(r)} />
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
          <form onSubmit={submitEdit} className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#e7ebe8] px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">Stock</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">Edit inventory</h2>
                <p className="mt-1 text-sm text-ink-muted">{editing.productTitle}</p>
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

            <div className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f7f8f7] px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">SKU</p>
                  <p className="mt-1 font-mono text-sm">{editing.sku}</p>
                </div>
                <div className="rounded-2xl bg-[#f7f8f7] px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">Variant</p>
                  <p className="mt-1 text-sm">
                    {editing.color || "—"} · EU {editing.sizeEu || "—"}
                  </p>
                </div>
              </div>

              <label className="block text-[13px] font-medium text-ink-muted">
                On hand
                <div className="mt-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e7ebe8] bg-white text-lg"
                    onClick={() => setOnHand((n) => Math.max(editing.reserved || 0, n - 1))}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={editing.reserved || 0}
                    className={`${field} mt-0 text-center`}
                    value={onHand}
                    onChange={(e) => setOnHand(Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e7ebe8] bg-white text-lg"
                    onClick={() => setOnHand((n) => n + 1)}
                  >
                    +
                  </button>
                </div>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f7f8f7] px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">Reserved</p>
                  <p className="mt-1 text-sm font-medium">{editing.reserved}</p>
                </div>
                <div className="rounded-2xl bg-[#f7f8f7] px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">Available</p>
                  <p className="mt-1 text-sm font-medium">{availablePreview}</p>
                </div>
              </div>
              <p className="text-xs text-ink-faint">On-hand cannot go below reserved COD units.</p>
              {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
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
                {busy ? "Saving…" : "Save stock"}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}
    </div>
  );
}
