"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { toast, toastApiError } from "@/components/ui/toast";
import { useCan } from "@/components/admin/access";
import { isPkMobile } from "@/shared/phone";

type Geo = { provinces: { name: string; cities: string[] }[] };
type Inv = { sku: string; productTitle: string; color?: string; sizeEu?: string; available: number };
type Line = { sku: string; qty: number };

const field = "mt-1.5 w-full";

export default function ManualOrderPage() {
  const access = useCan("orders");
  const router = useRouter();
  useEffect(() => {
    if (!access.create) router.replace("/admin/orders");
  }, [access.create, router]);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [rows, setRows] = useState<Inv[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("Punjab");
  const [city, setCity] = useState("Gujranwala");
  const [street, setStreet] = useState("");
  const [lines, setLines] = useState<Line[]>([{ sku: "", qty: 1 }]);
  const [notes, setNotes] = useState("");
  const [channel, setChannel] = useState<"admin_manual" | "facebook">("facebook");
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
  const inStock = rows.filter((r) => r.available > 0);

  function skuOptions(currentSku: string) {
    const taken = new Set(lines.map((l) => l.sku).filter((sku) => sku && sku !== currentSku));
    return [
      { value: "", label: "Select size SKU" },
      ...inStock
        .filter((r) => !taken.has(r.sku))
        .map((r) => ({
          value: r.sku,
          label: `${r.productTitle} · ${r.color} EU ${r.sizeEu} · ${r.available} left`,
        })),
    ];
  }

  function setLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const items = lines.filter((l) => l.sku).map((l) => ({ sku: l.sku, qty: Math.max(1, Number(l.qty) || 1) }));
    if (!fullName.trim()) {
      toast.error("Enter the customer’s full name");
      return;
    }
    if (!isPkMobile(phone)) {
      toast.error("Enter a Pakistan mobile like 03XX XXXXXXX");
      return;
    }
    if (!street.trim()) {
      toast.error("Enter house, street, or landmark");
      return;
    }
    if (!items.length) {
      toast.error("Add at least one pair");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/v1/admin/orders/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone, province, city, street, items, notes, channel }),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) {
      toastApiError(json, "Could not create this order");
      return;
    }
    toast.success("COD order created");
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
            description="Facebook, WhatsApp, or walk-in. Add every pair the customer asked for — stock is reserved, no OTP."
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
              <input
                required
                name="phone"
                minLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={field}
                placeholder="03XX XXXXXXX"
                title="Enter a Pakistan mobile like 03XX XXXXXXX"
              />
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight">Pairs & notes</h2>
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, { sku: "", qty: 1 }])}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-dark hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add pair
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, index) => {
              const picked = rows.find((r) => r.sku === line.sku);
              return (
                <div key={`${index}-${line.sku || "empty"}`} className="space-y-2 rounded-xl border border-[var(--admin-line)] bg-[#f6f8f7] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-ink-muted">Pair {index + 1}</p>
                    {lines.length > 1 ? (
                      <button
                        type="button"
                        aria-label="Remove pair"
                        onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                        className="rounded-lg p-1 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <label className="block text-sm font-medium">
                    SKU
                    <AppSelect
                      required
                      value={line.sku}
                      onChange={(sku) => setLine(index, { sku })}
                      placeholder="Select size SKU"
                      options={skuOptions(line.sku)}
                    />
                  </label>
                  {picked ? (
                    <p className="text-xs text-ink-faint">
                      {picked.productTitle} · {picked.color} · EU {picked.sizeEu} · {picked.available} left
                    </p>
                  ) : null}
                  <label className="block text-sm font-medium">
                    Quantity
                    <input
                      type="number"
                      min={1}
                      max={picked?.available || undefined}
                      value={line.qty}
                      onChange={(e) => setLine(index, { qty: Number(e.target.value) })}
                      className={field}
                    />
                  </label>
                </div>
              );
            })}
          </div>

          <label className="block text-sm font-medium">
            Staff notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={field} rows={3} placeholder="Optional" />
          </label>
          <Button type="submit" variant="primary" size="lg" block loading={saving} loadingLabel="Creating…">
            Create COD order
          </Button>
        </section>
      </form>
    </div>
  );
}
