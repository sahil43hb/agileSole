"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Star, X } from "lucide-react";
import {
  AdminModal,
  AdminPageHeader,
  AdminSearch,
  EmptyNote,
  SingleSelect,
  StatusBadge,
} from "@/components/admin/ui";

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
    await fetch(`/api/v1/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
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
                    {r.status !== "published" ? (
                      <button type="button" className={btn} disabled={busy} onClick={() => void setReviewStatus(r._id, "published")}>
                        Publish
                      </button>
                    ) : (
                      <button type="button" className={btn} disabled={busy} onClick={() => void setReviewStatus(r._id, "hidden")}>
                        Hide
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {open ? (
        <AdminModal onClose={() => setOpen(null)}>
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#e7ebe8] px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">Review</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">{open.authorName}</h2>
                <p className="mt-1 text-sm text-ink-muted">{open.productSlug} · {open.rating}/5</p>
              </div>
              <button type="button" onClick={() => setOpen(null)} className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted hover:bg-[#f4f7f5]" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="flex items-center gap-2">
                <StatusBadge value={open.status} />
                {open.fit ? <span className="text-xs capitalize text-ink-faint">Fit: {open.fit}</span> : null}
              </div>
              {open.title ? <p className="font-medium">{open.title}</p> : null}
              <p className="whitespace-pre-wrap rounded-2xl border border-[#e7ebe8] px-4 py-3 text-sm leading-relaxed">{open.body}</p>
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
            </div>
            <div className="flex justify-end border-t border-[#e7ebe8] bg-[#f7f8f7] px-6 py-4">
              <button type="button" onClick={() => setOpen(null)} className="h-10 rounded-xl border border-[#e7ebe8] bg-white px-4 text-sm font-medium">
                Close
              </button>
            </div>
          </div>
        </AdminModal>
      ) : null}
    </div>
  );
}
