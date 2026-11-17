"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast, toastApiError } from "@/components/ui/toast";
import { BusyLabel } from "@/components/ui/spinner";

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("footer");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/v1/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });
    const json = await res.json();
    setBusy(false);
    if (json.ok) {
      toast.success(t("joined"));
      setEmail("");
    } else toastApiError(json, t("joinFail"));
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("email")}
        className={`h-12 min-w-0 flex-1 rounded-full px-5 text-sm outline-none ${
          dark
            ? "border border-white/15 bg-white/10 text-white placeholder:text-white/45 focus:border-white/40"
            : "border border-paper-line bg-paper placeholder:text-ink-faint focus:border-brand"
        }`}
      />
      <button className="btn-primary inline-flex h-12 shrink-0 items-center justify-center rounded-full px-6 disabled:opacity-60" type="submit" disabled={busy}>
        <BusyLabel loading={busy} label={t("joining")}>
          {t("join")}
        </BusyLabel>
      </button>
    </form>
  );
}
