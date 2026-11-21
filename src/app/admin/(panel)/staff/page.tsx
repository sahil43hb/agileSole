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
  formatAdminDate,
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
import { useAdminAccess, useCan } from "@/components/admin/access";

type Staff = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  lastLoginAt?: string;
  locked?: boolean;
};

type RoleOpt = { id: string; name: string; slug: string; isSystem?: boolean };

const field =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const emptyForm = { name: "", email: "", password: "", roleId: "", isActive: true };

function isLocked(r: Staff) {
  return Boolean(r.locked) || r.email.toLowerCase() === "agilesole@gmail.com";
}

export default function StaffPage() {
  const access = useCan("staff");
  const { staff: me } = useAdminAccess();
  const [rows, setRows] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<RoleOpt[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pending, setPending] = useState<{ row: Staff; action: "status" | "delete" } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const staffRes = await fetch("/api/v1/admin/staff");
    const staffJson = await staffRes.json();
    if (staffJson.ok) {
      setRows(staffJson.data.staff);
      if (staffJson.data.roles) setRoles(staffJson.data.roles);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (roleFilter !== "all" && r.roleId !== roleFilter && r.role !== roleFilter) return false;
      if (!q) return true;
      return [r.name, r.email, r.roleName, r.role].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, query, roleFilter]);

  function openNew() {
    setForm({ ...emptyForm, roleId: roles.find((r) => !r.isSystem)?.id || roles[0]?.id || "" });
    setEditing("new");
  }
  function openEdit(r: Staff) {
    setForm({ name: r.name, email: r.email, password: "", roleId: r.roleId, isActive: r.isActive !== false });
    setEditing(r);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const isNew = editing === "new";
    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      roleId: form.roleId,
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
      toastApiError(json, "Could not save");
      return;
    }
    toast.success("Staff saved");
    setEditing(null);
    await load();
  }

  async function toggleActive(r: Staff) {
    if (isLocked(r)) return;
    setBusy(true);
    const res = await fetch(`/api/v1/admin/staff/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: r.name, email: r.email, roleId: r.roleId, isActive: !r.isActive }),
    });
    setBusy(false);
    const result = await toastFromResponse(res, "Could not update staff", r.isActive ? "Staff deactivated" : "Staff activated");
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
    const res = await fetch(`/api/v1/admin/staff/${pending.row.id}`, { method: "DELETE" });
    setBusy(false);
    const result = await toastFromResponse(res, "Could not delete staff", "Staff deleted");
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
        title="Staff"
        description={`${rows.length} people who can open this workspace · Access comes from a role, not a hardcoded list`}
        actions={access.create ? <AdminHeaderAction icon={Plus} label="Invite staff" onClick={openNew} /> : undefined}
      />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-3 shadow-sm">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search name or email" />
        <SingleSelect
          label="Role"
          value={roleFilter}
          onChange={setRoleFilter}
          options={[{ id: "all", label: "Any role" }, ...roles.map((r) => ({ id: r.id, label: r.name }))]}
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
                <td>{r.roleName || r.role}</td>
                <td className="whitespace-nowrap text-ink-muted">{formatAdminDate(r.lastLoginAt)}</td>
                <td>
                  <StatusBadge value={r.isActive ? "active" : "inactive"} />
                </td>
                <td>
                  <div className="flex flex-nowrap items-center justify-end gap-1.5">
                    {access.update ? <RowEditButton onClick={() => openEdit(r)} /> : null}
                    {access.update && !isLocked(r) ? (
                      <button
                        type="button"
                        className={r.isActive ? rowBtn : rowBtn}
                        onClick={() => setPending({ row: r, action: "status" })}
                      >
                        {r.isActive ? "Deactivate" : "Activate"}
                      </button>
                    ) : null}
                    {access.delete && !isLocked(r) && me?.id !== r.id ? (
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
              kicker="Team"
              title={editing === "new" ? "Invite staff" : "Edit staff"}
              onClose={() => setEditing(null)}
            />
            <AdminModalBody className="space-y-4">
              <label className="block text-[13px] font-medium text-ink-muted">
                Name
                <input required className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="block text-[13px] font-medium text-ink-muted">
                Email
                <input
                  required
                  type="email"
                  className={field}
                  value={form.email}
                  disabled={editing !== "new" && isLocked(editing)}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
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
                  value={form.roleId}
                  onChange={(roleId) => setForm({ ...form, roleId })}
                  options={roles.map((r) => ({ value: r.id, label: r.name }))}
                />
              </label>
              {editing !== "new" && isLocked(editing) ? (
                <p className="rounded-xl bg-[#f7f8f7] px-3.5 py-2.5 text-sm text-ink-muted">
                  This is the store owner account. It stays active and cannot be deleted.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-sm ${form.isActive ? "border-brand bg-brand-mist text-brand-dark" : "border-[#e7ebe8] bg-[#f7f8f7] text-ink-muted"}`}
                >
                  {form.isActive ? "Can sign in" : "Deactivated"}
                  <SwitchTrack on={form.isActive} />
                </button>
              )}
            </AdminModalBody>
            <AdminModalFooter>
              <button type="button" onClick={() => setEditing(null)} className={modalBtnSecondary}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={modalBtnPrimary}>
                <BusyLabel loading={busy} label="Saving…">
                  {editing === "new" ? "Send invite" : "Save changes"}
                </BusyLabel>
              </button>
            </AdminModalFooter>
          </form>
        </AdminModal>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        title={
          pending?.action === "delete"
            ? "Delete this person?"
            : pending?.row.isActive
              ? "Deactivate this person?"
              : "Activate this person?"
        }
        body={
          pending?.action === "delete"
            ? `${pending.row.name} will be removed and will no longer be able to sign in.`
            : pending
              ? `${pending.row.name} ${pending.row.isActive ? "will not be able to sign in." : "will be able to sign in again."}`
              : ""
        }
        confirmLabel={pending?.action === "delete" ? "Delete" : pending?.row.isActive ? "Deactivate" : "Activate"}
        danger={pending?.action === "delete" || Boolean(pending?.row.isActive)}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          if (pending.action === "delete") void remove();
          else void toggleActive(pending.row);
        }}
      />
    </div>
  );
}
