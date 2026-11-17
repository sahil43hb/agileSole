"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { toast, toastApiError, toastFromResponse } from "@/components/ui/toast";
import { BusyLabel } from "@/components/ui/spinner";
import { useCan } from "@/components/admin/access";
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

type Faq = { _id: string; question: { en: string; ur?: string }; answer: { en: string; ur?: string } };

const field =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";
const area =
  "mt-1.5 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const emptyForm = { qEn: "", qUr: "", aEn: "", aUr: "" };

export default function AdminFaqsPage() {
  const access = useCan("faqs");
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
      toastApiError(json, "Could not save");
      return;
    }
    toast.success("FAQ saved");
    setEditing(null);
    await load();
  }

  async function remove() {
    if (!pending) return;
    setBusy(true);
    const res = await fetch(`/api/v1/admin/faqs/${pending._id}`, { method: "DELETE" });
    setBusy(false);
    const result = await toastFromResponse(res, "Could not delete", "FAQ deleted");
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
        title="FAQs"
        description={`${faqs.length} answers for the store help page`}
        actions={access.create ? <AdminHeaderAction icon={Plus} label="Add FAQ" onClick={openNew} /> : undefined}
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
        <AdminTable>
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
                    {access.update ? <RowEditButton onClick={() => openEdit(f)} /> : null}
                    {access.delete ? (
                    <button type="button" className={rowBtnDanger} onClick={() => setPending(f)}>
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
              kicker="Content"
              title={editing === "new" ? "Add FAQ" : "Edit FAQ"}
              onClose={() => setEditing(null)}
            />
            <AdminModalBody className="space-y-4">
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
            </AdminModalBody>
            <AdminModalFooter>
              <button type="button" onClick={() => setEditing(null)} className={modalBtnSecondary}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={modalBtnPrimary}>
                <BusyLabel loading={busy} label="Saving…">
                  {editing === "new" ? "Create FAQ" : "Save changes"}
                </BusyLabel>
              </button>
            </AdminModalFooter>
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
