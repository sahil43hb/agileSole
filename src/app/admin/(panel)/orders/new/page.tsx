"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";

type Geo = { provinces: { name: string; cities: string[] }[] };
type Inv = { sku: string; productTitle: string; color?: string; sizeEu?: string; available: number };

const field = "mt-1.5 w-full";

export default function ManualOrderPage() {
  const router = useRouter();
  const [geo, setGeo] = useState<Geo | null>(null);
  const [rows, setRows] = useState<Inv[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("Punjab");
  const [city, setCity] = useState("Gujranwala");
  const [street, setStreet] = useState("");
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [channel, setChannel] = useState<"admin_manual" | "facebook">("facebook");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/v1/checkout/geo")
      .then((r) => r.json())
      .then((j) => j.ok && setGeo(j.data));
    fetch("/api/v1/admin/inventory")
      .then((r) => r.json())
      .then((j) => j.ok && setRows(j.data.rows));
  }, []);

  const cities = useMemo(() => geo?.provinces.find((p) => p.name === province)?.cities || [], [geo, province]);
  const picked = rows.find((r) => r.sku === sku);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/v1/admin/orders/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone, province, city, street, sku, qty, notes, channel }),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) {
      setError(json.error?.message || "Could not create");
      return;
    }
    router.push(`/admin/orders/${json.data.order._id}`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-ink-muted hover:text-ink">
          ← Orders
        </Link>
        <div className="mt-3">
          <AdminPageHeader
            title="New COD order"
            description="Facebook, WhatsApp, or walk-in. Creates the order and reserves stock — no OTP."
          />
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-4 rounded-2xl border border-[var(--admin-line)] bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight">Customer & address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium sm:col-span-2">
              Channel
              <AppSelect
                value={channel}
                onChange={(next) => setChannel(next as "admin_manual" | "facebook")}
                options={[
                  { value: "facebook", label: "Facebook / WhatsApp" },
                  { value: "admin_manual", label: "Walk-in / phone" },
                ]}
              />
            </label>
            <label className="block text-sm font-medium">
              Full name
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={field} placeholder="Customer name" />
            </label>
            <label className="block text-sm font-medium">
              Phone
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={field} placeholder="03xx…" />
            </label>
            <label className="block text-sm font-medium">
              Province
              <AppSelect
                value={province}
                onChange={(next) => {
                  setProvince(next);
                  const citiesNext = geo?.provinces.find((p) => p.name === next)?.cities || [];
                  setCity(citiesNext[0] || "");
                }}
                options={(geo?.provinces || []).map((p) => ({ value: p.name, label: p.name }))}
              />
            </label>
            <label className="block text-sm font-medium">
              City
              <AppSelect
                value={city}
                onChange={setCity}
                options={cities.map((c) => ({ value: c, label: c }))}
              />
            </label>
            <label className="block text-sm font-medium sm:col-span-2">
              Street / area
              <input required value={street} onChange={(e) => setStreet(e.target.value)} className={field} placeholder="House, street, landmark" />
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-[var(--admin-line)] bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight">Pair & notes</h2>
          <label className="block text-sm font-medium">
            SKU
            <AppSelect
              required
              value={sku}
              onChange={setSku}
              placeholder="Select size SKU"
              options={[
                { value: "", label: "Select size SKU" },
                ...rows
                  .filter((r) => r.available > 0)
                  .map((r) => ({
                    value: r.sku,
                    label: `${r.productTitle} · ${r.color} EU ${r.sizeEu} · ${r.available} left`,
                  })),
              ]}
            />
          </label>
          {picked ? (
            <div className="rounded-xl bg-[#f6f8f7] px-3 py-2.5 text-sm">
              <p className="font-medium">{picked.productTitle}</p>
              <p className="text-xs text-ink-faint">
                {picked.color} · EU {picked.sizeEu} · {picked.sku}
              </p>
            </div>
          ) : null}
          <label className="block text-sm font-medium">
            Quantity
            <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} className={field} />
          </label>
          <label className="block text-sm font-medium">
            Staff notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={field} rows={3} placeholder="Optional" />
          </label>
          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <Button type="submit" variant="primary" size="lg" block disabled={saving}>
            {saving ? "Creating…" : "Create COD order"}
          </Button>
        </section>
      </form>
    </div>
  );
}
