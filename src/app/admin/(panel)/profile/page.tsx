"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function AdminProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/v1/admin/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setName(json.data.staff.name);
          setEmail(json.data.staff.email);
          setRole(json.data.staff.role);
        }
      });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    const res = await fetch("/api/v1/admin/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) {
      setError(json.error?.message || "Could not save");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setMessage("Profile updated");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1>Profile</h1>
        <p className="mt-1 text-sm text-ink-muted">Your login details for this workspace.</p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-lg font-semibold text-white ring-4 ring-brand-mist">
          {initialsOf(name) || "A"}
        </span>
        <div>
          <p className="font-semibold">{name || "—"}</p>
          <p className="text-sm text-ink-muted">{email}</p>
          <p className="mt-1 text-xs capitalize text-ink-faint">{role.replaceAll("_", " ")}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-[var(--admin-line)] bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Full name
            <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-2 w-full" />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2 w-full" />
          </label>
        </div>

        <div className="border-t border-[var(--admin-line)] pt-5">
          <p className="text-sm font-medium">Change password</p>
          <p className="mt-1 text-xs text-ink-faint">Leave blank to keep your current password.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Current password
              <span className="relative mt-2 block">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full pe-11"
                />
                <button
                  type="button"
                  className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-ink-faint"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label="Toggle current password"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>
            <label className="block text-sm font-medium">
              New password
              <span className="relative mt-2 block">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={newPassword ? 8 : undefined}
                  className="w-full pe-11"
                />
                <button
                  type="button"
                  className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-ink-faint"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label="Toggle new password"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>
          </div>
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-brand-dark">{message}</p> : null}

        <button type="submit" disabled={saving} className="btn-primary h-11 px-6">
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
