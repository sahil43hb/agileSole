"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ImagePlus, Plus, RotateCcw, X } from "lucide-react";
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
import { SwitchTrack } from "@/components/ui/switch";
import { toast, toastApiError, toastFromResponse } from "@/components/ui/toast";
import { BusyLabel } from "@/components/ui/spinner";
import { useCan } from "@/components/admin/access";

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
  const access = useCan("brands");
  const [rows, setRows] = useState<Brand[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Brand | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState<{ row: Brand; action: "inactive" | "delete" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  async function uploadLogo(file: File) {
    setFormError("");
    setUploading(true);
    const body = new FormData();
    body.set("file", file);
    const res = await fetch("/api/v1/admin/media", { method: "POST", body });
    const json = await res.json();
    setUploading(false);
    if (!json.ok) {
      toastApiError(json, "Could not upload logo");
      return;
    }
    setForm((prev) => ({ ...prev, logo: json.data.url as string }));
    toast.success("Logo uploaded");
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
      toastApiError(json, "Could not save");
      return;
    }
    toast.success("Brand saved");
    setEditing(null);
    await load();
  }

  async function setActive(row: Brand, isActive: boolean) {
    setBusy(true);
    const res = await fetch(`/api/v1/admin/brands/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    setBusy(false);
    const result = await toastFromResponse(
      res,
      "Could not update brand",
      isActive ? "Brand activated" : "Brand set inactive",
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
    setListError("");
    const res = await fetch(`/api/v1/admin/brands/${pending.row.id}`, { method: "DELETE" });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      toastApiError(json, "Could not delete");
      setPending(null);
      return;
    }
    toast.success("Brand deleted");
    setPending(null);
    await load();
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Brands"
        description={`${rows.length} labels on the store`}
        actions={access.create ? <AdminHeaderAction icon={Plus} label="Add brand" onClick={openNew} /> : undefined}
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
        <AdminTable>
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
              kicker="Catalog"
              title={editing === "new" ? "Add brand" : "Edit brand"}
              description={editing === "new" ? "A label products can be assigned to." : "Update name, slug, or visibility."}
              onClose={() => setEditing(null)}
            />
            <AdminModalBody className="space-y-4">
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
              <div>
                <p className="text-[13px] font-medium text-ink-muted">Logo</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-4">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-[#e7ebe8] bg-[#f7f8f7] p-2">
                    {form.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.logo} alt="" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-ink-faint" />
                    )}
                  </div>
                  <div className="min-w-[12rem] flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <label className="relative inline-flex h-10 cursor-pointer items-center overflow-hidden rounded-xl border border-[#e7ebe8] bg-white px-4 text-sm font-medium">
                        {uploading ? "Uploading…" : "Upload logo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="absolute inset-0 cursor-pointer opacity-0"
                          disabled={uploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) void uploadLogo(file);
                          }}
                        />
                      </label>
                      {form.logo ? (
                        <button
                          type="button"
                          className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#e7ebe8] bg-white px-3 text-sm text-ink-muted"
                          onClick={() => setForm({ ...form, logo: "" })}
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <input
                      className={`${field} mt-0`}
                      value={form.logo}
                      onChange={(e) => setForm({ ...form, logo: e.target.value })}
                      placeholder="Or paste a logo URL"
                    />
                  </div>
                </div>
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
              {formError ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}
            </AdminModalBody>
            <AdminModalFooter>
              <button type="button" onClick={() => setEditing(null)} className={modalBtnSecondary}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={modalBtnPrimary}>
                <BusyLabel loading={busy} label="Saving…">
                  {editing === "new" ? "Create brand" : "Save changes"}
                </BusyLabel>
              </button>
            </AdminModalFooter>
          </form>
        </AdminModal>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.action === "delete" ? "Delete this brand?" : "Make this brand inactive?"}
        body={
          pending?.action === "delete"
            ? `${pending.row.name.en} will be removed. Reassign products first if any still use it.`
            : `${pending?.row.name.en} will be hidden from the brands page. You can activate it again later.`
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
