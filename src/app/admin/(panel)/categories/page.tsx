"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";
import {
  AdminModal,
  AdminHeaderAction,
  AdminPageHeader,
  AdminSearch,
  AdminTable,
  ConfirmDialog,
  EmptyNote,
  SingleSelect,
  StatusBadge,
  RowEditButton,
  rowBtnDanger,
} from "@/components/admin/ui";
import { AppSelect } from "@/components/ui/app-select";
import { SwitchTrack } from "@/components/ui/switch";

type Cat = {
  id: string;
  slug: string;
  parentId: string | null;
  name: { en: string; ur: string };
  description?: { en: string; ur: string };
  isActive: boolean;
  sort?: number;
};

const field =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";
const area =
  "mt-1.5 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";
const emptyForm = {
  nameEn: "",
  nameUr: "",
  slug: "",
  parentId: "",
  description: "",
  sort: "0",
  isActive: true,
};

export default function CategoriesPage() {
  const [rows, setRows] = useState<Cat[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [level, setLevel] = useState("all");
  const [parentFilter, setParentFilter] = useState("all");
  const [editing, setEditing] = useState<Cat | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState<Cat | null>(null);
  const [busy, setBusy] = useState(false);
  const [listError, setListError] = useState("");

  async function load() {
    const res = await fetch("/api/v1/admin/categories");
    const json = await res.json();
    if (json.ok) setRows(json.data.categories);
  }

  useEffect(() => {
    void load();
  }, []);

  const parents = useMemo(() => rows.filter((r) => !r.parentId), [rows]);
  const parentName = (id: string | null) => rows.find((p) => p.id === id)?.name.en || "—";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status === "active" && !r.isActive) return false;
      if (status === "inactive" && r.isActive) return false;
      if (level === "top" && r.parentId) return false;
      if (level === "sub" && !r.parentId) return false;
      if (parentFilter !== "all" && r.parentId !== parentFilter && r.id !== parentFilter) return false;
      if (!q) return true;
      return [r.name?.en, r.name?.ur, r.slug, parentName(r.parentId)].some((v) =>
        (v || "").toLowerCase().includes(q),
      );
    });
  }, [rows, query, status, level, parentFilter]);

  function openNew() {
    setForm(emptyForm);
    setFormError("");
    setEditing("new");
  }

  function openEdit(row: Cat) {
    setForm({
      nameEn: row.name?.en || "",
      nameUr: row.name?.ur || "",
      slug: row.slug || "",
      parentId: row.parentId || "",
      description: row.description?.en || "",
      sort: String(row.sort ?? 0),
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
      parentId: form.parentId || null,
      sort: Number(form.sort || 0),
      isActive: form.isActive,
    };
    const isNew = editing === "new";
    const url = isNew ? "/api/v1/admin/categories" : `/api/v1/admin/categories/${(editing as Cat).id}`;
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
    const res = await fetch(`/api/v1/admin/categories/${pending.id}`, { method: "DELETE" });
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

  const parentChoices = parents.filter((p) => editing !== "new" && editing ? p.id !== editing.id : true);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Categories"
        description={`${rows.length} groups for the catalog · men, women, kids, and comfort`}
        actions={<AdminHeaderAction icon={Plus} label="Add category" onClick={openNew} />}
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
        <SingleSelect
          label="Level"
          value={level}
          onChange={setLevel}
          options={[
            { id: "all", label: "All levels" },
            { id: "top", label: "Top level" },
            { id: "sub", label: "Subcategory" },
          ]}
        />
        <SingleSelect
          label="Parent"
          value={parentFilter}
          onChange={setParentFilter}
          options={[{ id: "all", label: "Any parent" }, ...parents.map((p) => ({ id: p.id, label: p.name.en }))]}
        />
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setStatus("all");
            setLevel("all");
            setParentFilter("all");
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[var(--admin-line)] bg-white px-3.5 text-sm text-ink-muted hover:text-ink"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {listError ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{listError}</p> : null}

      {!visible.length ? (
        <EmptyNote>No categories match these filters.</EmptyNote>
      ) : (
        <AdminTable>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Parent</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id}>
                <td>
                  <p className="font-medium">{r.name.en}</p>
                  {r.name.ur ? <p className="text-xs text-ink-faint" dir="rtl">{r.name.ur}</p> : null}
                </td>
                <td className="font-mono text-xs text-ink-muted">{r.slug}</td>
                <td className="text-ink-muted">{parentName(r.parentId)}</td>
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
        </AdminTable>
      )}

      {editing ? (
        <AdminModal onClose={() => setEditing(null)}>
          <form onSubmit={save} className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#e7ebe8] px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">Catalog</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  {editing === "new" ? "Add category" : "Edit category"}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {editing === "new" ? "Shown on the store menu and product filters." : "Update names, parent, or visibility."}
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
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-[13px] font-medium text-ink-muted">
                  Slug
                  <input className={field} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" />
                </label>
                <label className="block text-[13px] font-medium text-ink-muted">
                  Parent
                  <AppSelect
                    value={form.parentId}
                    onChange={(parentId) => setForm({ ...form, parentId })}
                    options={[
                      { value: "", label: "Top level" },
                      ...parentChoices.map((p) => ({ value: p.id, label: p.name.en })),
                    ]}
                  />
                </label>
              </div>
              <label className="block text-[13px] font-medium text-ink-muted">
                Description
                <textarea className={area} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-[13px] font-medium text-ink-muted">
                  Sort
                  <input type="number" className={field} value={form.sort} onChange={(e) => setForm({ ...form, sort: e.target.value })} />
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
                    <SwitchTrack on={form.isActive} />
                  </button>
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
                {busy ? "Saving…" : editing === "new" ? "Create category" : "Save changes"}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete this category?"
        body={
          pending
            ? `${pending.name.en} will be removed. Products must be moved out first, and it cannot have child categories.`
            : ""
        }
        confirmLabel="Delete"
        danger
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
