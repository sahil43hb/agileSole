"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/storefront/auth-provider";
import { toast, toastApiError } from "@/components/ui/toast";
import { BusyLabel } from "@/components/ui/spinner";

const field =
  "mt-1.5 w-full rounded-2xl border-0 bg-[#f3f5f2] px-4 py-3 text-sm outline-none ring-1 ring-transparent transition placeholder:text-ink-faint focus:bg-white focus:ring-brand/40 disabled:opacity-70";

export function LoginOtpForm({
  onSuccess,
  heading: Heading = "h2",
}: {
  onSuccess?: () => void | Promise<void>;
  heading?: "h1" | "h2";
}) {
  const t = useTranslations("account");
  const { refresh } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (identifier.trim().length < 5) {
      toast.error("Enter a valid phone or email");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/v1/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, purpose: "login" }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      toastApiError(json, "Could not send the code");
      return;
    }
    setSent(true);
    toast.success("We sent a 6-digit code");
    if (json.data?.devCode) toast.info(t("devHint"));
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/v1/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, code, purpose: "login" }),
    });
    const json = await res.json();
    if (!json.ok) {
      setBusy(false);
      toastApiError(json, "That code is incorrect");
      return;
    }
    toast.success("Signed in");
    await refresh();
    await onSuccess?.();
    setBusy(false);
  }

  return (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-dark">{t("kicker")}</p>
      <Heading className="mt-1 text-3xl font-semibold tracking-tight">{t("loginTitle")}</Heading>
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
            minLength={5}
            placeholder="03XX XXXXXXX or email"
            name="identifier"
            disabled={busy}
          />
        </label>
        {sent ? (
          <label className="block text-xs font-medium text-ink-muted">
            {t("code")}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              minLength={6}
              pattern="\d{6}"
              name="code"
              title="Enter the 6-digit code"
              className={`${field} text-center text-lg tracking-[0.45em]`}
              required
              disabled={busy}
            />
          </label>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="btn-primary mt-2 inline-flex h-12 w-full items-center justify-center rounded-full disabled:opacity-60"
        >
          <BusyLabel loading={busy} label={sent ? t("verifying") : t("sendingCode")}>
            {sent ? t("verify") : t("sendCode")}
          </BusyLabel>
        </button>
      </form>
    </>
  );
}
