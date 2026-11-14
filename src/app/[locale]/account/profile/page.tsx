"use client";

import { FormEvent, useEffect, useState } from "react";
import { AccountShell } from "@/components/storefront/account-shell";
import { useAuth } from "@/components/storefront/auth-provider";
import { AppSelect } from "@/components/ui/app-select";

export default function ProfilePage() {
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
    setMessage(json.ok ? "Saved" : json.error?.message);
    if (json.ok) await refresh();
  }

  return (
    <AccountShell>
      <h1 className="text-2xl font-semibold">Profile</h1>
      <form onSubmit={save} className="mt-6 max-w-md space-y-3">
        <label className="block text-sm">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" />
        </label>
        <label className="block text-sm">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" />
        </label>
        <label className="block text-sm">
          Language
          <AppSelect
            tone="store"
            value={locale}
            onChange={setLocale}
            options={[
              { value: "en", label: "English" },
              { value: "ur", label: "Urdu" },
            ]}
          />
        </label>
        <label className="block text-sm">
          Usual size group
          <AppSelect
            tone="store"
            value={preferredGender}
            onChange={setPreferredGender}
            options={[
              { value: "", label: "Not set" },
              { value: "men", label: "Men" },
              { value: "women", label: "Women" },
              { value: "kids", label: "Kids" },
            ]}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} />
          WhatsApp updates
        </label>
        <button type="submit" className="btn-primary h-11 px-6">
          Save
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-ink-muted">{message}</p> : null}
      <div className="mt-10 space-y-2 text-sm">
        <button
          type="button"
          className="block text-ink-muted"
          onClick={async () => {
            await fetch("/api/v1/me/data-request", { method: "POST", credentials: "same-origin" });
            setMessage("Data request sent. Staff will follow up.");
          }}
        >
          Request download / delete of my data
        </button>
        <button
          type="button"
          className="block text-ink-muted"
          onClick={async () => {
            await fetch("/api/v1/auth/logout-all", { method: "POST", credentials: "same-origin" });
            await signOut();
          }}
        >
          Sign out all devices
        </button>
      </div>
    </AccountShell>
  );
}
