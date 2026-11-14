"use client";

import { FormEvent, useState } from "react";
import { useLocale } from "next-intl";

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });
    const json = await res.json();
    setNote(json.ok ? "You’re on the drop list." : json.error?.message || "Could not subscribe");
    if (json.ok) setEmail("");
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className={`h-12 min-w-0 flex-1 rounded-full px-5 text-sm outline-none ${
          dark
            ? "border border-white/15 bg-white/10 text-white placeholder:text-white/45 focus:border-white/40"
            : "border border-paper-line bg-paper placeholder:text-ink-faint focus:border-brand"
        }`}
      />
      <button className="btn-primary h-12 shrink-0 rounded-full px-6" type="submit">
        Join
      </button>
      {note ? <p className={`w-full text-sm ${dark ? "text-white/70" : "text-ink-muted"}`}>{note}</p> : null}
    </form>
  );
}
