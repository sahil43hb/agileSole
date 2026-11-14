"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    const res = await fetch("/api/v1/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, contact, message }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setStatus(json.error?.message || "Could not send");
      return;
    }
    setName("");
    setContact("");
    setMessage("");
    setStatus("Received. We will reply on WhatsApp or phone.");
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-3">
      <label className="block text-sm">
        Name
        <input required dir="auto" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" />
      </label>
      <label className="block text-sm">
        Phone or email
        <input required dir="auto" value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" />
      </label>
      <label className="block text-sm">
        Message
        <textarea required dir="auto" minLength={8} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" rows={4} />
      </label>
      <button type="submit" disabled={busy} className="btn-primary h-11 px-6">
        {busy ? "Sending…" : "Send"}
      </button>
      {status ? <p className="text-sm text-ink-muted">{status}</p> : null}
    </form>
  );
}
