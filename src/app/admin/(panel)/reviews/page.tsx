"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Star } from "lucide-react";
import {
  AdminModal,
  AdminModalBody,
  AdminModalFooter,
  AdminModalHeader,
  AdminPageHeader,
  AdminSearch,
  AdminTable,
  EmptyNote,
  SingleSelect,
  StatusBadge,
  modalBtnSecondary,
} from "@/components/admin/ui";
import { toastFromResponse } from "@/components/ui/toast";
import { useCan } from "@/components/admin/access";

type Review = {
  _id: string;
  productSlug: string;
  authorName: string;
  title: string;
  body: string;
  rating: number;
  status: string;
  fit?: string;
};

const btn =
  "h-8 rounded-lg border border-[var(--admin-line)] bg-white px-3 text-xs font-medium text-ink hover:bg-[#f4f7f5]";

export default function AdminReviewsPage() {
  const access = useCan("reviews");
  const [rows, setRows] = useState<Review[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/admin/reviews");
    const json = await res.json();
    if (json.ok) setRows(json.data.reviews);
  }
  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    function onLive(e: Event) {
      if ((e as CustomEvent<{ type?: string }>).detail?.type === "review_pending") void load();
    }
    window.addEventListener("as-admin-live", onLive);
    return () => window.removeEventListener("as-admin-live", onLive);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return [r.authorName, r.productSlug, r.title, r.body].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, query, status]);

  async function setReviewStatus(id: string, next: string) {
    setBusy(true);
    const res = await fetch(`/api/v1/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    const result = await toastFromResponse(res, "Could not update review", next === "published" ? "Review published" : "Review updated");
    if (!result.ok) return;
    setOpen((prev) => (prev && prev._id === id ? { ...prev, status: next } : prev));
    await load();
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Reviews" description={`${rows.length} customer notes · publish before they appear on the store`} />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-3 shadow-sm">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search author, product, text" />
        <SingleSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { id: "all", label: "Any status" },
            { id: "pending", label: "Pending" },
            { id: "published", label: "Published" },
            { id: "hidden", label: "Hidden" },
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
      {!visible.length ? (
        <EmptyNote>No reviews match.</EmptyNote>
      ) : (
        <AdminTable>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Product</th>
              <th>Rating</th>
              <th>Title</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r._id} className="cursor-pointer" onClick={() => setOpen(r)}>
                <td className="font-medium">{r.authorName}</td>
                <td className="font-mono text-xs text-ink-muted">{r.productSlug}</td>
                <td>
                  <span className="inline-flex items-center gap-1 text-sm">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {r.rating}/5
                  </span>
                </td>
                <td className="max-w-xs truncate text-ink-muted">{r.title || r.body}</td>
                <td>
                  <StatusBadge value={r.status} />
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <button type="button" className={btn} onClick={() => setOpen(r)}>
                      View
                    </button>
                    {access.update && r.status !== "published" ? (
                      <button type="button" className={btn} disabled={busy} onClick={() => void setReviewStatus(r._id, "published")}>
                        Publish
                      </button>
                    ) : null}
                    {access.update && r.status === "published" ? (
                      <button type="button" className={btn} disabled={busy} onClick={() => void setReviewStatus(r._id, "hidden")}>
                        Hide
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

      {open ? (
        <AdminModal onClose={() => setOpen(null)}>
          <div className="flex min-h-0 flex-1 flex-col">
            <AdminModalHeader
              kicker="Review"
              title={open.authorName}
              description={`${open.productSlug} · ${open.rating}/5`}
              onClose={() => setOpen(null)}
            />
            <AdminModalBody className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge value={open.status} />
                {open.fit ? <span className="text-xs capitalize text-ink-faint">Fit: {open.fit}</span> : null}
              </div>
              {open.title ? <p className="font-medium">{open.title}</p> : null}
              <p className="whitespace-pre-wrap rounded-2xl border border-[#e7ebe8] px-4 py-3 text-sm leading-relaxed">{open.body}</p>
              {access.update ? (
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#f4f7f5] p-1">
                {["pending", "published", "hidden"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={busy}
                    onClick={() => void setReviewStatus(open._id, s)}
                    className={`h-9 rounded-lg text-sm font-medium capitalize ${open.status === s ? "bg-white text-ink shadow-sm" : "text-ink-muted"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              ) : null}
            </AdminModalBody>
            <AdminModalFooter>
              <button type="button" onClick={() => setOpen(null)} className={modalBtnSecondary}>
                Close
              </button>
            </AdminModalFooter>
          </div>
        </AdminModal>
      ) : null}
    </div>
  );
}
