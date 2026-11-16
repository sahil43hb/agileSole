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
  formatAdminDate,
  RowEditButton,
  rowBtn,
  rowBtnDanger,
} from "@/components/admin/ui";
import { AppSelect } from "@/components/ui/app-select";
import { SwitchTrack } from "@/components/ui/switch";

type Staff = { id: string; name: string; email: string; role: string; isActive: boolean; lastLoginAt?: string };

const field =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const ROLES = [
  { id: "orders", label: "Orders" },
  { id: "catalog", label: "Catalog" },
  { id: "content", label: "Content" },
  { id: "support", label: "Support" },
  { id: "reporter", label: "Reports" },
  { id: "super_admin", label: "Owner" },
];

const emptyForm = { name: "", email: "", password: "", role: "orders", isActive: true };

function roleLabel(role: string) {
  return ROLES.find((r) => r.id === role)?.label || role.replaceAll("_", " ");
}

export default function StaffPage() {
  const [rows, setRows] = useState<Staff[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState<Staff | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/admin/staff");
    const json = await res.json();
    if (json.ok) setRows(json.data.staff);
  }
  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (roleFilter !== "all" && r.role !== roleFilter) return false;
      if (!q) return true;
      return [r.name, r.email, r.role].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, query, roleFilter]);

  function openNew() {
    setForm(emptyForm);
    setFormError("");
    setEditing("new");
  }
  function openEdit(r: Staff) {
    setForm({ name: r.name, email: r.email, password: "", role: r.role, isActive: r.isActive !== false });
    setFormError("");
    setEditing(r);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    const isNew = editing === "new";
    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      role: form.role,
      isActive: form.isActive,
    };
    if (form.password) payload.password = form.password;
    const url = isNew ? "/api/v1/admin/staff" : `/api/v1/admin/staff/${(editing as Staff).id}`;
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

  async function toggleActive(r: Staff) {
    setBusy(true);
    await fetch(`/api/v1/admin/staff/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: r.name, email: r.email, role: r.role, isActive: !r.isActive }),
    });
    setBusy(false);
    setPending(null);
    await load();
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Staff"
        description={`${rows.length} people who can open this workspace`}
        actions={<AdminHeaderAction icon={Plus} label="Invite staff" onClick={openNew} />}
      />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-3 shadow-sm">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search name or email" />
        <SingleSelect
          label="Role"
          value={roleFilter}
          onChange={setRoleFilter}
          options={[{ id: "all", label: "Any role" }, ...ROLES]}
        />
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setRoleFilter("all");
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[var(--admin-line)] bg-white px-3.5 text-sm text-ink-muted hover:text-ink"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>
      {!visible.length ? (
        <EmptyNote>No staff match.</EmptyNote>
      ) : (
        <AdminTable>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Last login</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                      {r.name
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase())
                        .join("")}
                    </span>
                    <span className="font-medium">{r.name}</span>
                  </div>
                </td>
                <td className="text-ink-muted">{r.email}</td>
                <td className="capitalize">{roleLabel(r.role)}</td>
                <td className="whitespace-nowrap text-ink-muted">{formatAdminDate(r.lastLoginAt)}</td>
                <td>
                  <StatusBadge value={r.isActive ? "active" : "inactive"} />
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    <RowEditButton onClick={() => openEdit(r)} />
                    <button type="button" className={r.isActive ? rowBtnDanger : rowBtn} onClick={() => setPending(r)}>
                      {r.isActive ? "Deactivate" : "Activate"}
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
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">Team</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">{editing === "new" ? "Invite staff" : "Edit staff"}</h2>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted hover:bg-[#f4f7f5]" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <label className="block text-[13px] font-medium text-ink-muted">
                Name
                <input required className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="block text-[13px] font-medium text-ink-muted">
                Email
                <input required type="email" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label className="block text-[13px] font-medium text-ink-muted">
                Password {editing === "new" ? "(8+)" : "(leave blank to keep)"}
                <input
                  required={editing === "new"}
                  type="password"
                  minLength={editing === "new" ? 8 : undefined}
                  className={field}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </label>
              <label className="block text-[13px] font-medium text-ink-muted">
                Role
                <AppSelect
                  value={form.role}
                  onChange={(role) => setForm({ ...form, role })}
                  options={ROLES.map((r) => ({ value: r.id, label: r.label }))}
                />
              </label>
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-sm ${form.isActive ? "border-brand bg-brand-mist text-brand-dark" : "border-[#e7ebe8] bg-[#f7f8f7] text-ink-muted"}`}
              >
                {form.isActive ? "Can sign in" : "Deactivated"}
                <SwitchTrack on={form.isActive} />
              </button>
              {formError ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e7ebe8] bg-[#f7f8f7] px-6 py-4">
              <button type="button" onClick={() => setEditing(null)} className="h-10 rounded-xl border border-[#e7ebe8] bg-white px-4 text-sm font-medium">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="h-10 rounded-xl bg-brand px-5 text-sm font-medium text-white disabled:opacity-60">
                {busy ? "Saving…" : editing === "new" ? "Send invite" : "Save changes"}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.isActive ? "Deactivate this person?" : "Activate this person?"}
        body={pending ? `${pending.name} ${pending.isActive ? "will not be able to sign in." : "will be able to sign in again."}` : ""}
        confirmLabel={pending?.isActive ? "Deactivate" : "Activate"}
        danger={Boolean(pending?.isActive)}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && void toggleActive(pending)}
      />
    </div>
  );
}
