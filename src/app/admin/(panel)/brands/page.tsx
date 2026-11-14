"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";
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

type Brand = {
  id: string;
  slug: string;
  name: { en: string; ur: string };
  description?: { en: string; ur: string };
  logo?: string;
  isActive: boolean;
};

const field =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";
const area =
  "mt-1.5 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const emptyForm = {
  nameEn: "",
  nameUr: "",
  slug: "",
  description: "",
  logo: "",
  isActive: true,
};

export default function BrandsPage() {
  const [rows, setRows] = useState<Brand[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Brand | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState<Brand | null>(null);
  const [busy, setBusy] = useState(false);
  const [listError, setListError] = useState("");

  async function load() {
    const res = await fetch("/api/v1/admin/brands");
    const json = await res.json();
    if (json.ok) setRows(json.data.brands);
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status === "active" && !r.isActive) return false;
      if (status === "inactive" && r.isActive) return false;
      if (!q) return true;
      return [r.name?.en, r.name?.ur, r.slug].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, query, status]);

  function openNew() {
    setForm(emptyForm);
    setFormError("");
    setEditing("new");
  }

  function openEdit(row: Brand) {
    setForm({
      nameEn: row.name?.en || "",
      nameUr: row.name?.ur || "",
      slug: row.slug || "",
      description: row.description?.en || "",
      logo: row.logo || "",
      isActive: row.isActive !== false,
    });
    setFormError("");
    setEditing(row);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    const payload = {
      name: { en: form.nameEn, ur: form.nameUr },
      description: form.description.trim() ? { en: form.description.trim(), ur: "" } : undefined,
      slug: form.slug || undefined,
      logo: form.logo.trim() || undefined,
      isActive: form.isActive,
    };
    const isNew = editing === "new";
    const url = isNew ? "/api/v1/admin/brands" : `/api/v1/admin/brands/${(editing as Brand).id}`;
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
    setListError("");
    const res = await fetch(`/api/v1/admin/brands/${pending.id}`, { method: "DELETE" });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setListError(json.error?.message || "Could not delete");
      setPending(null);
      return;
    }
    setPending(null);
    await load();
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Brands"
        description={`${rows.length} labels on the store`}
        actions={
          <button
            type="button"
            onClick={openNew}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Add brand
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-3 shadow-sm">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search name or slug" />
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
            setStatus("all");
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[var(--admin-line)] bg-white px-3.5 text-sm text-ink-muted hover:text-ink"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {listError ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{listError}</p> : null}

      {!visible.length ? (
        <EmptyNote>No brands match these filters.</EmptyNote>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f4f7f5] text-xs font-semibold text-brand-dark">
                      {r.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.logo} alt="" className="h-full w-full object-contain" />
                      ) : (
                        (r.name.en || "B")
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p) => p[0]?.toUpperCase())
                          .join("")
                      )}
                    </span>
                    <div>
                      <p className="font-medium">{r.name.en}</p>
                      {r.name.ur ? (
                        <p className="text-xs text-ink-faint" dir="rtl">
                          {r.name.ur}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="font-mono text-xs text-ink-muted">{r.slug}</td>
                <td>
                  <StatusBadge value={r.isActive ? "active" : "inactive"} />
                </td>
                <td>
                  <div className="flex flex-wrap items-center justify-end gap-2">
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
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">Catalog</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  {editing === "new" ? "Add brand" : "Edit brand"}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {editing === "new" ? "A label products can be assigned to." : "Update name, slug, or visibility."}
                </p>
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
              <label className="block text-[13px] font-medium text-ink-muted">
                English name
                <input required className={field} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
              </label>
              <label className="block text-[13px] font-medium text-ink-muted">
                Urdu name
                <input dir="rtl" className={field} value={form.nameUr} onChange={(e) => setForm({ ...form, nameUr: e.target.value })} />
              </label>
              <label className="block text-[13px] font-medium text-ink-muted">
                Slug
                <input className={field} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" />
              </label>
              <label className="block text-[13px] font-medium text-ink-muted">
                Description
                <textarea className={area} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
              </label>
              <label className="block text-[13px] font-medium text-ink-muted">
                Logo URL
                <input className={field} value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="https://… or /uploads/…" />
              </label>
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
                  <span className={`h-5 w-9 rounded-full p-0.5 ${form.isActive ? "bg-brand" : "bg-[#d5ddd7]"}`}>
                    <span className={`block h-4 w-4 rounded-full bg-white transition ${form.isActive ? "translate-x-4" : ""}`} />
                  </span>
                </button>
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
                {busy ? "Saving…" : editing === "new" ? "Create brand" : "Save changes"}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete this brand?"
        body={pending ? `${pending.name.en} will be removed. Reassign products first if any still use it.` : ""}
        confirmLabel="Delete"
        danger
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
