"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { toast, toastApiError } from "@/components/ui/toast";
import { BusyLabel } from "@/components/ui/spinner";

const field =
  "mt-1.5 w-full rounded-2xl border-0 bg-[#f3f5f2] px-4 py-3 text-sm outline-none ring-1 ring-transparent transition placeholder:text-ink-faint focus:bg-white focus:ring-brand/40";

export function ContactForm() {
  const t = useTranslations("contact");
  const c = useTranslations("common");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    setOk(false);
    const res = await fetch("/api/v1/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, contact, message }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      toastApiError(json, t("fail"));
      return;
    }
    setName("");
    setContact("");
    setMessage("");
    setOk(true);
    toast.success(t("sent"));
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-xs font-medium text-ink-muted">
        {t("name")}
        <input required dir="auto" value={name} onChange={(e) => setName(e.target.value)} className={field} />
      </label>
      <label className="block text-xs font-medium text-ink-muted">
        {t("contact")}
        <input required dir="auto" value={contact} onChange={(e) => setContact(e.target.value)} className={field} />
      </label>
      <label className="block text-xs font-medium text-ink-muted">
        {t("message")}
        <textarea
          required
          dir="auto"
          minLength={8}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${field} min-h-[8rem] resize-y`}
          rows={4}
        />
      </label>
      <button type="submit" disabled={busy} className="btn-primary inline-flex h-12 w-full items-center justify-center rounded-full disabled:opacity-60">
        <BusyLabel loading={busy} label={t("sending")}>
          {c("send")}
        </BusyLabel>
      </button>
      {status ? <p className={`text-sm ${ok ? "text-brand-dark" : "text-red-600"}`}>{status}</p> : null}
    </form>
  );
}
