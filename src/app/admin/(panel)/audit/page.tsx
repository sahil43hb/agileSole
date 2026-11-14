"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { AdminPageHeader, AdminSearch, EmptyNote, SingleSelect, formatAdminDate } from "@/components/admin/ui";

type Entry = {
  _id: string;
  action: string;
  entity: string;
  entityId?: string;
  actorEmail?: string;
  note?: string;
  createdAt: string;
};

export default function AuditPage() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState("all");

  useEffect(() => {
    fetch("/api/v1/admin/audit")
      .then((r) => r.json())
      .then((j) => j.ok && setRows(j.data.entries));
  }, []);

  const entities = useMemo(() => {
    const set = new Set(rows.map((r) => r.entity).filter(Boolean));
    return [...set].sort();
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (entity !== "all" && r.entity !== entity) return false;
      if (!q) return true;
      return [r.action, r.entity, r.entityId, r.actorEmail, r.note].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, query, entity]);

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Audit log" description="Who changed orders, customers, and catalog — newest first." />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-3 shadow-sm">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search action, entity, note" />
        <SingleSelect
          label="Entity"
          value={entity}
          onChange={setEntity}
          options={[{ id: "all", label: "Anything" }, ...entities.map((e) => ({ id: e, label: e }))]}
        />
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setEntity("all");
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[var(--admin-line)] bg-white px-3.5 text-sm text-ink-muted hover:text-ink"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>
      {!visible.length ? (
        <EmptyNote>No audit events match.</EmptyNote>
      ) : (
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Who</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r._id}>
                <td className="whitespace-nowrap text-ink-muted">{formatAdminDate(r.createdAt)}</td>
                <td className="font-mono text-xs">{r.action}</td>
                <td>
                  <span className="capitalize">{r.entity}</span>
                  {r.entityId ? <p className="max-w-[12rem] truncate font-mono text-[11px] text-ink-faint">{r.entityId}</p> : null}
                </td>
                <td className="text-sm text-ink-muted">{r.actorEmail || "—"}</td>
                <td className="max-w-xs truncate text-ink-muted">{r.note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
