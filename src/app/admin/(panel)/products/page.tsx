"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, RotateCcw, Upload } from "lucide-react";
import { formatPkr } from "@/shared/money";
import {
  AdminHeaderAction,
  AdminPageHeader,
  AdminSearch,
  AdminTable,
  ConfirmDialog,
  EmptyNote,
  MultiSelect,
  RowEditButton,
  StatusBadge,
  rowBtn,
  rowBtnDanger,
} from "@/components/admin/ui";
import { toastFromResponse } from "@/components/ui/toast";
import { useCan } from "@/components/admin/access";

type Row = {
  id: string;
  slug: string;
  title: { en: string };
  gender: string;
  status: string;
  featured?: boolean;
  image?: string;
  skus?: string;
  variantCount: number;
  stock: number;
  price: number;
};

const GENDERS = [
  { id: "men", label: "Men" },
  { id: "women", label: "Women" },
  { id: "kids", label: "Kids" },
  { id: "unisex", label: "Unisex" },
];

const STATUSES = [
  { id: "active", label: "Active" },
  { id: "draft", label: "Draft" },
  { id: "unlisted", label: "Inactive" },
  { id: "archived", label: "Archived" },
];

export default function ProductsPage() {
  const access = useCan("products");
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [genders, setGenders] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [pending, setPending] = useState<{ row: Row; action: "inactive" | "archive" | "delete" } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/admin/products");
    const json = await res.json();
    if (json.ok) setRows(json.data.products);
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      if (genders.length && !genders.includes(p.gender)) return false;
      if (statuses.length && !statuses.includes(p.status)) return false;
      if (!q) return true;
      return [p.title?.en, p.slug, p.skus].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, query, genders, statuses]);

  async function setStatus(id: string, status: string) {
    setBusy(true);
    const res = await fetch(`/api/v1/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    const label =
      status === "archived" ? "Product archived" : status === "active" ? "Product activated" : "Product set inactive";
    const result = await toastFromResponse(res, "Could not update product", label);
    if (!result.ok) {
      setPending(null);
      return;
    }
    setPending(null);
    await load();
  }

  async function destroy(id: string) {
    setBusy(true);
    const res = await fetch(`/api/v1/admin/products/${id}`, { method: "DELETE" });
    setBusy(false);
    const result = await toastFromResponse(res, "Could not delete product", "Product permanently deleted");
    setPending(null);
    if (result.ok) await load();
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Products"
        description={`${rows.length} styles in the catalog`}
        actions={
          access.create ? (
          <>
            <AdminHeaderAction icon={Upload} label="Import CSV" href="/admin/products/import" variant="secondary" />
            <AdminHeaderAction icon={Plus} label="Add product" href="/admin/products/new" />
          </>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-3 shadow-sm">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search title or SKU" />
        <MultiSelect label="Gender" options={GENDERS} value={genders} onChange={setGenders} />
        <MultiSelect label="Status" options={STATUSES} value={statuses} onChange={setStatuses} />
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setGenders([]);
            setStatuses([]);
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[var(--admin-line)] bg-white px-3.5 text-sm text-ink-muted hover:text-ink"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {!visible.length ? (
        <EmptyNote>No products match these filters.</EmptyNote>
      ) : (
        <AdminTable>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Gender</th>
              <th>Status</th>
              <th>Variants</th>
              <th>Stock</th>
              <th>From</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#f4f7f5]">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <div className="min-w-0">
                      <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-brand-dark">
                        {p.title.en}
                      </Link>
                      <p className="text-xs text-ink-faint">{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="capitalize text-ink-muted">{p.gender}</td>
                <td>
                  <StatusBadge value={p.status === "unlisted" ? "inactive" : p.status} />
                </td>
                <td>{p.variantCount}</td>
                <td>{p.stock}</td>
                <td className="font-medium">{formatPkr(p.price)}</td>
                <td>
                  <div className="flex flex-nowrap items-center justify-end gap-1.5">
                    {access.update ? <RowEditButton href={`/admin/products/${p.id}`} /> : (
                      <RowEditButton href={`/admin/products/${p.id}`}>View</RowEditButton>
                    )}
                    {access.update && p.status === "active" ? (
                      <button type="button" className={rowBtn} onClick={() => setPending({ row: p, action: "inactive" })}>
                        Inactive
                      </button>
                    ) : null}
                    {access.update && p.status !== "active" ? (
                      <button type="button" className={rowBtn} disabled={busy} onClick={() => void setStatus(p.id, "active")}>
                        Activate
                      </button>
                    ) : null}
                    {access.update && p.status !== "archived" ? (
                      <button type="button" className={rowBtn} onClick={() => setPending({ row: p, action: "archive" })}>
                        Archive
                      </button>
                    ) : null}
                    {access.delete && p.status === "archived" ? (
                      <button type="button" className={rowBtnDanger} onClick={() => setPending({ row: p, action: "delete" })}>
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

      <ConfirmDialog
        open={Boolean(pending)}
        title={
          pending?.action === "delete"
            ? "Permanently delete this product?"
            : pending?.action === "archive"
              ? "Archive this product?"
              : "Make this product inactive?"
        }
        body={
          pending?.action === "delete"
            ? `${pending.row.title.en} will be removed from the catalog for good. Past orders keep their history.`
            : pending?.action === "archive"
              ? `${pending.row.title.en} will leave the store but stay in this list. You can activate it later.`
              : `${pending?.row.title.en} will be hidden from the store. You can activate it again later.`
        }
        confirmLabel={
          pending?.action === "delete" ? "Delete forever" : pending?.action === "archive" ? "Archive" : "Set inactive"
        }
        danger={pending?.action === "delete"}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          if (pending.action === "delete") {
            void destroy(pending.row.id);
            return;
          }
          void setStatus(pending.row.id, pending.action === "archive" ? "archived" : "unlisted");
        }}
      />
    </div>
  );
}
