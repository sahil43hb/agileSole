"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { BrandIconSync } from "@/components/brand/brand-icon-sync";
import { DEFAULT_LOGO } from "@/lib/brand-icon";

function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("sahilmubeen30@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoSrc, setLogoSrc] = useState(DEFAULT_LOGO);

  useEffect(() => {
    fetch("/api/v1/settings/public")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.data?.logo) setLogoSrc(j.data.logo);
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/v1/auth/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setError(json.error?.message || "Could not sign in");
      return;
    }
    router.push(params.get("from") || "/admin");
    router.refresh();
  }

  return (
    <div className="grid min-h-dvh bg-paper-warm lg:grid-cols-2">
      <BrandIconSync src={logoSrc} />
      <aside className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/catalog/grey-pedestal.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a10] via-[#0b1a10]/55 to-[#0b1a10]/25" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(31,166,74,0.28),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div className="inline-flex w-fit rounded-2xl bg-white/95 px-4 py-3 shadow-sm">
            <Wordmark src={logoSrc} />
          </div>
          <div className="max-w-md space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-brand-light">Admin & staff</p>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight">
              Every step a
              <span className="block text-brand-light">perfect beat.</span>
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-white/75">
              Orders, catalog, and Gujranwala COD — one calm desk for the Agile Sole team.
            </p>
          </div>
        </div>
      </aside>

      <main className="relative flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -end-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute -bottom-28 -start-16 h-64 w-64 rounded-full bg-brand-mint/60 blur-3xl" />
        </div>

        <div className="relative w-full max-w-[420px]">
          <div className="mb-8 lg:hidden">
            <Wordmark src={logoSrc} />
          </div>

          <div className="rounded-3xl border border-white/80 bg-paper/80 p-7 shadow-[0_24px_80px_rgba(17,17,17,0.08)] backdrop-blur-xl sm:p-9">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-mist px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-brand-dark">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure access
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink">Welcome back</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Sign in as owner or staff to manage Agile Sole.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <label className="block text-[13px] font-medium text-ink">
                Email
                <input
                  type="email"
                  autoComplete="username"
                  data-testid="admin-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-paper-line bg-paper px-4 py-3 text-sm shadow-sm transition placeholder:text-ink-faint focus-visible:border-brand"
                  placeholder="you@agilesole.com"
                  required
                />
              </label>

              <label className="block text-[13px] font-medium text-ink">
                Password
                <span className="relative mt-2 block">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    data-testid="admin-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-paper-line bg-paper px-4 py-3 pe-12 text-sm shadow-sm transition placeholder:text-ink-faint focus-visible:border-brand"
                    placeholder="Enter your password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-ink-faint transition hover:bg-paper-warm hover:text-ink"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              {error ? (
                <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                data-testid="admin-submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(31,166,74,0.28)] transition hover:bg-brand-dark disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
                {!loading ? (
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                ) : null}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-ink-faint">Agile Sole · Gujranwala · Admin & staff</p>
        </div>
      </main>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
