"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AccountShell } from "@/components/storefront/account-shell";
import { useAuth } from "@/components/storefront/auth-provider";
import { AppSelect } from "@/components/ui/app-select";
import { Switch } from "@/components/ui/switch";

const field =
  "mt-1.5 w-full rounded-2xl border-0 bg-[#f3f5f2] px-4 py-3 text-sm outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-brand/40";

export default function ProfilePage() {
  const t = useTranslations("account");
  const c = useTranslations("common");
  const n = useTranslations("nav");
  const { refresh, signOut } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [locale, setLocale] = useState("en");
  const [preferredGender, setPreferredGender] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/v1/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return;
        const c = j.data.customer;
        setName(c.name || "");
        setEmail(c.email || "");
        setLocale(c.locale || "en");
        setPreferredGender(c.preferredGender || "");
        setWhatsappOptIn(Boolean(c.whatsappOptIn));
      });
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/me", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, locale, preferredGender, whatsappOptIn }),
    });
    const json = await res.json();
    setMessage(json.ok ? t("saved") : json.error?.message);
    if (json.ok) await refresh();
  }

  return (
    <AccountShell>
      <h1 className="text-3xl font-semibold tracking-tight">{t("profileTitle")}</h1>
      <p className="mt-1 text-sm text-ink-muted">{t("profileHint")}</p>
      <form onSubmit={save} className="mt-6 max-w-lg rounded-[1.35rem] bg-white p-5 ring-1 ring-black/[0.04] md:p-6">
        <label className="block text-xs font-medium text-ink-muted">
          {t("name")}
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="mt-4 block text-xs font-medium text-ink-muted">
          {t("email")}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-ink-muted">
            {t("language")}
            <AppSelect
              tone="store"
              value={locale}
              onChange={setLocale}
              options={[
                { value: "en", label: c("english") },
                { value: "ur", label: c("urdu") },
              ]}
            />
          </label>
          <label className="block text-xs font-medium text-ink-muted">
            {t("sizeGroup")}
            <AppSelect
              tone="store"
              value={preferredGender}
              onChange={setPreferredGender}
              options={[
                { value: "", label: t("notSet") },
                { value: "men", label: n("men") },
                { value: "women", label: n("women") },
                { value: "kids", label: n("kids") },
              ]}
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[#f6f7f5] px-4 py-3">
          <span className="text-sm">{t("whatsapp")}</span>
          <Switch on={whatsappOptIn} onChange={() => setWhatsappOptIn((v) => !v)} label={t("whatsapp")} />
        </div>
        <button type="submit" className="btn-primary mt-5 h-11 rounded-full px-6">
          {c("save")}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-ink-muted">{message}</p> : null}
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          className="text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          onClick={async () => {
            await fetch("/api/v1/me/data-request", { method: "POST", credentials: "same-origin" });
            setMessage(t("dataSent"));
          }}
        >
          {t("dataRequest")}
        </button>
        <button
          type="button"
          className="text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          onClick={async () => {
            await fetch("/api/v1/auth/logout-all", { method: "POST", credentials: "same-origin" });
            await signOut();
          }}
        >
          {t("signOutAll")}
        </button>
      </div>
    </AccountShell>
  );
}
