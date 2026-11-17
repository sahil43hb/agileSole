"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
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
import { toast, toastApiError } from "@/components/ui/toast";
import { BusyLabel } from "@/components/ui/spinner";
import { useCan } from "@/components/admin/access";

type Col = {
  id: string;
  slug: string;
  title: { en: string; ur?: string };
  type?: string;
  productIds: string[];
  isActive: boolean;
};

type Prod = { id: string; title: { en: string } };

const field =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const emptyForm = {
  titleEn: "",
  titleUr: "",
  slug: "",
  type: "manual",
  productIds: [] as string[],
  isActive: true,
};

export default function CollectionsPage() {
  const access = useCan("collections");
  const [rows, setRows] = useState<Col[]>([]);
  const [products, setProducts] = useState<Prod[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [editing, setEditing] = useState<Col | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [productQuery, setProductQuery] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState<Col | null>(null);
  const [busy, setBusy] = useState(false);
  const [listError, setListError] = useState("");

  async function load() {
    const [c, p] = await Promise.all([
      fetch("/api/v1/admin/collections").then((r) => r.json()),
      fetch("/api/v1/admin/products").then((r) => r.json()),
    ]);
    if (c.ok) setRows(c.data.collections);
    if (p.ok) setProducts(p.data.products);
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status === "active" && !r.isActive) return false;
      if (status === "inactive" && r.isActive) return false;
      if (kind !== "all" && (r.type || "manual") !== kind) return false;
      if (!q) return true;
      return [r.title?.en, r.title?.ur, r.slug].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, query, status, kind]);

  const productHits = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return products.filter((p) => !q || (p.title?.en || "").toLowerCase().includes(q));
  }, [products, productQuery]);

  function openNew() {
    setForm(emptyForm);
    setProductQuery("");
    setFormError("");
    setEditing("new");
  }

  function openEdit(row: Col) {
    setForm({
      titleEn: row.title?.en || "",
      titleUr: row.title?.ur || "",
      slug: row.slug || "",
      type: row.type || "manual",
      productIds: row.productIds || [],
      isActive: row.isActive !== false,
    });
    setProductQuery("");
    setFormError("");
    setEditing(row);
  }

  function toggleProduct(id: string) {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id) ? prev.productIds.filter((x) => x !== id) : [...prev.productIds, id],
    }));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    const payload = {
      title: { en: form.titleEn, ur: form.titleUr || form.titleEn },
      slug: form.slug || undefined,
      type: form.type,
      productIds: form.productIds,
      isActive: form.isActive,
    };
    const isNew = editing === "new";
    const url = isNew ? "/api/v1/admin/collections" : `/api/v1/admin/collections/${(editing as Col).id}`;
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
    toast.success("Collection saved");
    setEditing(null);
    await load();
  }

  async function remove() {
    if (!pending) return;
    setBusy(true);
    setListError("");
    const res = await fetch(`/api/v1/admin/collections/${pending.id}`, { method: "DELETE" });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      toastApiError(json, "Could not delete");
      setPending(null);
      return;
    }
    toast.success("Collection deleted");
    setPending(null);
    await load();
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Collections"
        description={`${rows.length} merchandising groups on the store`}
        actions={access.create ? <AdminHeaderAction icon={Plus} label="Add collection" onClick={openNew} /> : undefined}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-3 shadow-sm">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search title or slug" />
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
        <SingleSelect
          label="Type"
          value={kind}
          onChange={setKind}
          options={[
            { id: "all", label: "Any type" },
            { id: "manual", label: "Manual" },
            { id: "rules", label: "Rules" },
          ]}
        />
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setStatus("all");
            setKind("all");
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[var(--admin-line)] bg-white px-3.5 text-sm text-ink-muted hover:text-ink"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {listError ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{listError}</p> : null}

      {!visible.length ? (
        <EmptyNote>No collections match these filters.</EmptyNote>
      ) : (
        <AdminTable>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Type</th>
              <th>Products</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id}>
                <td>
                  <p className="font-medium">{r.title.en}</p>
                  {r.title.ur && r.title.ur !== r.title.en ? (
                    <p className="text-xs text-ink-faint" dir="rtl">
                      {r.title.ur}
                    </p>
                  ) : null}
                </td>
                <td className="font-mono text-xs text-ink-muted">{r.slug}</td>
                <td className="capitalize text-ink-muted">{r.type || "manual"}</td>
                <td>{r.productIds?.length || 0}</td>
                <td>
                  <StatusBadge value={r.isActive ? "active" : "inactive"} />
                </td>
                <td>
                  <div className="flex flex-wrap items-center justify-end gap-2">
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
        <AdminModal onClose={() => setEditing(null)} size="lg">
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <AdminModalHeader
              kicker="Catalog"
              title={editing === "new" ? "Add collection" : "Edit collection"}
              description={`${form.productIds.length} product${form.productIds.length === 1 ? "" : "s"} selected`}
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
                  Slug
                  <input className={field} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from title" />
                </label>
                <label className="block text-[13px] font-medium text-ink-muted">
                  Type
                  <AppSelect
                    value={form.type}
                    onChange={(type) => setForm({ ...form, type })}
                    options={[
                      { value: "manual", label: "Manual" },
                      { value: "rules", label: "Rules" },
                    ]}
                  />
                </label>
              </div>
              <div>
                <p className="text-[13px] font-medium text-ink-muted">Visibility</p>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`mt-1.5 flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-sm ${
                    form.isActive ? "border-brand bg-brand-mist text-brand-dark" : "border-[#e7ebe8] bg-[#f7f8f7] text-ink-muted"
                  }`}
                >
                  {form.isActive ? "Active on store" : "Inactive"}
                  <SwitchTrack on={form.isActive} />
                </button>
              </div>
              <div>
                <p className="mb-2 text-[13px] font-medium text-ink-muted">Products</p>
                <input
                  className={`${field} mt-0 mb-3`}
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search products"
                />
                <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-2xl bg-[#f7f8f7] p-3">
                  {productHits.map((p) => {
                    const on = form.productIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProduct(p.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                          on ? "bg-ink text-white" : "border border-[#e7ebe8] bg-white text-ink-muted"
                        }`}
                      >
                        {p.title.en}
                      </button>
                    );
                  })}
                  {!productHits.length ? <p className="text-sm text-ink-faint">No products match.</p> : null}
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
                  {editing === "new" ? "Create collection" : "Save changes"}
                </BusyLabel>
              </button>
            </AdminModalFooter>
          </form>
        </AdminModal>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete this collection?"
        body={pending ? `${pending.title.en} will be removed from the store. Products stay in the catalog.` : ""}
        confirmLabel="Delete"
        danger
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
