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

  const field =
    "mt-1.5 w-full rounded-2xl border-0 bg-[#f3f5f2] px-4 py-3 text-sm outline-none ring-1 ring-transparent transition placeholder:text-ink-faint focus:bg-white focus:ring-brand/40";

  return (
    <div className="bg-[#f6f7f5]">
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-[1.6rem] bg-white p-6 shadow-[0_10px_36px_rgba(17,17,17,0.04)] ring-1 ring-black/[0.04] md:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-dark">{t("kicker")}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t("loginTitle")}</h1>
          <p className="mt-2 text-sm text-ink-muted">{t("loginBody")}</p>
          <form onSubmit={sent ? verify : send} className="mt-8 space-y-4">
            <label className="block text-xs font-medium text-ink-muted">
              {t("identifier")}
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                dir="auto"
                className={field}
                required
              />
            </label>
            {sent ? (
              <label className="block text-xs font-medium text-ink-muted">
                {t("code")}
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  className={`${field} text-center text-lg tracking-[0.45em]`}
                  required
                />
              </label>
            ) : null}
            <button type="submit" className="btn-primary mt-2 h-12 w-full rounded-full">
              {sent ? t("verify") : t("sendCode")}
            </button>
          </form>
          {message ? <p className="mt-4 text-sm text-ink-muted">{message}</p> : null}
        </div>
        <p className="mt-6 text-center text-sm text-ink-muted">
          {t("guest")}{" "}
          <Link href="/track-order" className="font-medium text-brand-dark hover:underline">
            {t("trackHint")}
          </Link>
        </p>
      </div>
    </div>
  );
}
