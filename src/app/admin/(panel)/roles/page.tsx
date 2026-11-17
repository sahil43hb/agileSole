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
  RowEditButton,
  modalBtnPrimary,
  modalBtnSecondary,
  rowBtnDanger,
} from "@/components/admin/ui";
import { toast, toastApiError } from "@/components/ui/toast";
import { BusyLabel } from "@/components/ui/spinner";
import { useCan } from "@/components/admin/access";
import {
  ACTION_LABEL,
  ADMIN_MODULES,
  emptyPermissions,
  type PermissionAction,
  type PermissionsMap,
} from "@/shared/admin-rbac";

type RoleRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
  permissions: PermissionsMap;
};

const field =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";
const area =
  "mt-1.5 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const ACTIONS: PermissionAction[] = ["view", "create", "update", "delete"];

function countPerms(map: PermissionsMap) {
  let n = 0;
  for (const row of Object.values(map || {})) {
    for (const v of Object.values(row || {})) if (v) n += 1;
  }
  return n;
}

function clonePerms(src?: PermissionsMap): PermissionsMap {
  return JSON.parse(JSON.stringify(src || emptyPermissions())) as PermissionsMap;
}

export default function RolesPage() {
  const access = useCan("roles");
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<RoleRow | "new" | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<PermissionsMap>(emptyPermissions());
  const [pending, setPending] = useState<RoleRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/admin/roles");
    const json = await res.json();
    if (json.ok) setRows(json.data.roles);
  }
  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.name, r.slug, r.description].some((v) => (v || "").toLowerCase().includes(q)));
  }, [rows, query]);

  function openNew() {
    setName("");
    setDescription("");
    setPermissions(emptyPermissions());
    setEditing("new");
  }
  function openEdit(r: RoleRow) {
    setName(r.name);
    setDescription(r.description || "");
    setPermissions(clonePerms(r.permissions));
    setEditing(r);
  }

  function toggle(moduleId: string, action: PermissionAction) {
    if (editing !== "new" && editing?.isSystem) return;
    setPermissions((prev) => {
      const row = { ...(prev[moduleId] || {}) };
      row[action] = !row[action];
      if (action !== "view" && row[action]) row.view = true;
      return { ...prev, [moduleId]: row };
    });
  }

  function setModuleAll(moduleId: string, on: boolean) {
    if (editing !== "new" && editing?.isSystem) return;
    const mod = ADMIN_MODULES.find((m) => m.id === moduleId);
    if (!mod) return;
    const row: Record<string, boolean> = {};
    if (on) for (const action of mod.actions) row[action] = true;
    setPermissions((prev) => ({ ...prev, [moduleId]: row }));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const isNew = editing === "new";
    const url = isNew ? "/api/v1/admin/roles" : `/api/v1/admin/roles/${(editing as RoleRow).id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, permissions }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      toastApiError(json, "Could not save role");
      return;
    }
    toast.success("Role saved");
    setEditing(null);
    await load();
  }

  const groups = useMemo(() => {
    const map = new Map<string, typeof ADMIN_MODULES>();
    for (const mod of ADMIN_MODULES) {
      const list = map.get(mod.group) || ([] as unknown as typeof ADMIN_MODULES);
      (list as unknown as (typeof ADMIN_MODULES)[number][]).push(mod);
      map.set(mod.group, list);
    }
    return [...map.entries()];
  }, []);

  const locked = editing !== "new" && Boolean(editing?.isSystem);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Roles"
        description="Create a role, then tick view / create / edit / delete for each module. Staff pick a role — they never get a free-form role list."
        actions={
          access.create ? <AdminHeaderAction icon={Plus} label="Create role" onClick={openNew} /> : undefined
        }
      />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-3 shadow-sm">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search roles" />
        <button
          type="button"
          onClick={() => setQuery("")}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[var(--admin-line)] bg-white px-3.5 text-sm text-ink-muted hover:text-ink"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>
      {!visible.length ? (
        <EmptyNote>No roles yet.</EmptyNote>
      ) : (
        <AdminTable>
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Permissions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id}>
                  <td>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-ink-faint">{r.isSystem ? "System · full access" : r.description || r.slug}</p>
                  </td>
                  <td className="text-ink-muted">{r.isSystem ? "All modules" : `${countPerms(r.permissions)} grants`}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      {access.update ? <RowEditButton onClick={() => openEdit(r)} /> : null}
                      {access.delete && !r.isSystem ? (
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
        <AdminModal onClose={() => setEditing(null)} size="xl">
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <AdminModalHeader
              kicker="Access"
              title={editing === "new" ? "Create role" : "Edit role"}
              description={locked ? "Owner always has every permission. You can rename it, not reduce it." : "Tick what this role can do. View-only means list and detail — no create, edit, or delete."}
              onClose={() => setEditing(null)}
            />
            <AdminModalBody className="space-y-5">
              <label className="block text-[13px] font-medium text-ink-muted">
                Name
                <input required className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Catalog editor" />
              </label>
              <label className="block text-[13px] font-medium text-ink-muted">
                Description
                <textarea className={area} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
              <div className="overflow-hidden rounded-2xl border border-[#e7ebe8]">
                <div className="grid grid-cols-[minmax(0,1fr)_repeat(4,4.5rem)] gap-0 bg-[#f7f8f7] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  <span>Module</span>
                  {ACTIONS.map((a) => (
                    <span key={a} className="text-center">
                      {ACTION_LABEL[a]}
                    </span>
                  ))}
                </div>
                {groups.map(([group, mods]) => (
                  <div key={group}>
                    <p className="border-t border-[#e7ebe8] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      {group}
                    </p>
                    {(mods as typeof ADMIN_MODULES).map((mod) => (
                      <div
                        key={mod.id}
                        className="grid grid-cols-[minmax(0,1fr)_repeat(4,4.5rem)] items-center border-t border-[#f0f2f0] px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{mod.label}</p>
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => setModuleAll(mod.id, true)}
                            className="text-[11px] text-brand-dark hover:underline disabled:opacity-40"
                          >
                            All
                          </button>
                          <span className="px-1 text-ink-faint">·</span>
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => setModuleAll(mod.id, false)}
                            className="text-[11px] text-ink-muted hover:underline disabled:opacity-40"
                          >
                            None
                          </button>
                        </div>
                        {ACTIONS.map((action) => {
                          const allowed = (mod.actions as readonly string[]).includes(action);
                          const on = Boolean(permissions[mod.id]?.[action]);
                          return (
                            <label key={action} className="flex justify-center">
                              <input
                                type="checkbox"
                                disabled={locked || !allowed}
                                checked={allowed && on}
                                onChange={() => toggle(mod.id, action)}
                              />
                            </label>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </AdminModalBody>
            <AdminModalFooter>
              <button type="button" onClick={() => setEditing(null)} className={modalBtnSecondary}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={modalBtnPrimary}>
                <BusyLabel loading={busy} label="Saving…">
                  {editing === "new" ? "Create role" : "Save role"}
                </BusyLabel>
              </button>
            </AdminModalFooter>
          </form>
        </AdminModal>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete this role?"
        body={pending ? `Staff using “${pending.name}” must be moved to another role first.` : ""}
        confirmLabel="Delete"
        danger
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          setBusy(true);
          const res = await fetch(`/api/v1/admin/roles/${pending.id}`, { method: "DELETE" });
          const json = await res.json();
          setBusy(false);
          if (!json.ok) {
            toastApiError(json, "Could not delete role");
            return;
          }
          toast.success("Role deleted");
          setPending(null);
          await load();
        }}
      />
    </div>
  );
}
