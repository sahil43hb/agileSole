"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/storefront/auth-provider";
import { Link } from "@/i18n/navigation";

export default function AccountLoginPage() {
  const t = useTranslations("account");
  const router = useRouter();
  const { refresh, customer } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (customer) router.replace("/account");
  }, [customer, router]);

  async function send(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/v1/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, purpose: "login" }),
    });
    const json = await res.json();
    if (!json.ok) {
      setMessage(json.error?.message || "Could not send code");
      return;
    }
    setSent(true);
    setMessage(t("devHint"));
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, code, purpose: "login" }),
    });
    const json = await res.json();
    if (!json.ok) {
      setMessage(json.error?.message || "Invalid code");
      return;
    }
    await refresh();
    router.push("/account");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold">{t("loginTitle")}</h1>
      <p className="mt-2 text-sm text-ink-muted">{t("loginBody")}</p>
      <form onSubmit={sent ? verify : send} className="mt-8 space-y-4">
        <label className="block text-sm">
          {t("identifier")}
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            dir="auto"
            className="mt-1 w-full border border-paper-line bg-paper px-3 py-2"
            required
          />
        </label>
        {sent ? (
          <label className="block text-sm">
            {t("code")}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              className="mt-1 w-full border border-paper-line bg-paper px-3 py-2 tracking-[0.4em]"
              required
            />
          </label>
        ) : null}
        <button type="submit" className="btn-primary mt-2 h-12 w-full">
          {sent ? t("verify") : t("sendCode")}
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-ink-muted">{message}</p> : null}
      <p className="mt-8 text-sm text-ink-muted">
        Guest?{" "}
        <Link href="/track-order" className="text-brand-dark">
          Track with order number + phone
        </Link>
      </p>
    </div>
  );
}
