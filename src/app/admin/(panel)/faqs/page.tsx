"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";
import {
  AdminModal,
  AdminPageHeader,
  AdminSearch,
  ConfirmDialog,
  EmptyNote,
  RowEditButton,
  rowBtnDanger,
} from "@/components/admin/ui";

type Faq = { _id: string; question: { en: string; ur?: string }; answer: { en: string; ur?: string } };

const field =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";
const area =
  "mt-1.5 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const emptyForm = { qEn: "", qUr: "", aEn: "", aUr: "" };

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Faq | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState<Faq | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/v1/admin/faqs");
    const json = await res.json();
    if (json.ok) setFaqs(json.data.faqs);
  }
  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter((f) =>
      [f.question?.en, f.question?.ur, f.answer?.en, f.answer?.ur].some((v) => (v || "").toLowerCase().includes(q)),
    );
  }, [faqs, query]);

  function openNew() {
    setForm(emptyForm);
    setFormError("");
    setEditing("new");
  }
  function openEdit(f: Faq) {
    setForm({
      qEn: f.question?.en || "",
      qUr: f.question?.ur || "",
      aEn: f.answer?.en || "",
      aUr: f.answer?.ur || "",
    });
    setFormError("");
    setEditing(f);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    const payload = {
      question: { en: form.qEn, ur: form.qUr },
      answer: { en: form.aEn, ur: form.aUr },
    };
    const isNew = editing === "new";
    const url = isNew ? "/api/v1/admin/faqs" : `/api/v1/admin/faqs/${(editing as Faq)._id}`;
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
    await fetch(`/api/v1/admin/faqs/${pending._id}`, { method: "DELETE" });
    setBusy(false);
    setPending(null);
    await load();
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="FAQs"
        description={`${faqs.length} answers for the store help page`}
        actions={
          <button type="button" onClick={openNew} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-white">
            <Plus className="h-4 w-4" />
            Add FAQ
          </button>
        }
      />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-3 shadow-sm">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search questions" />
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
        <EmptyNote>No FAQs match.</EmptyNote>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>Answer</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((f) => (
              <tr key={f._id}>
                <td className="max-w-sm font-medium">{f.question?.en}</td>
                <td className="max-w-md truncate text-ink-muted">{f.answer?.en}</td>
                <td>
                  <div className="flex justify-end gap-2">
                    <RowEditButton onClick={() => openEdit(f)} />
                    <button type="button" className={rowBtnDanger} onClick={() => setPending(f)}>
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
          <form onSubmit={save} className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#e7ebe8] px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">Content</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">{editing === "new" ? "Add FAQ" : "Edit FAQ"}</h2>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted hover:bg-[#f4f7f5]" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto px-6 py-5">
              <label className="block text-[13px] font-medium text-ink-muted">
                Question (English)
                <input required className={field} value={form.qEn} onChange={(e) => setForm({ ...form, qEn: e.target.value })} />
              </label>
              <label className="block text-[13px] font-medium text-ink-muted">
                Question (Urdu)
                <input dir="rtl" className={`${field} font-urdu`} value={form.qUr} onChange={(e) => setForm({ ...form, qUr: e.target.value })} />
              </label>
              <label className="block text-[13px] font-medium text-ink-muted">
                Answer (English)
                <textarea required className={area} rows={4} value={form.aEn} onChange={(e) => setForm({ ...form, aEn: e.target.value })} />
              </label>
              <label className="block text-[13px] font-medium text-ink-muted">
                Answer (Urdu)
                <textarea dir="rtl" className={`${area} font-urdu`} rows={4} value={form.aUr} onChange={(e) => setForm({ ...form, aUr: e.target.value })} />
              </label>
              {formError ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e7ebe8] bg-[#f7f8f7] px-6 py-4">
              <button type="button" onClick={() => setEditing(null)} className="h-10 rounded-xl border border-[#e7ebe8] bg-white px-4 text-sm font-medium">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="h-10 rounded-xl bg-brand px-5 text-sm font-medium text-white disabled:opacity-60">
                {busy ? "Saving…" : editing === "new" ? "Create FAQ" : "Save changes"}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete this FAQ?"
        body={pending ? pending.question?.en || "This question will be removed from the store." : ""}
        confirmLabel="Delete"
        danger
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
