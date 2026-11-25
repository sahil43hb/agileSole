"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { AdminHeaderAction, AdminPageHeader } from "@/components/admin/ui";
import { Switch } from "@/components/ui/switch";
import { LOGO_SRC } from "@/components/brand/logo";
import { notifyLogoChanged } from "@/lib/brand-icon";
import { toast, toastApiError } from "@/components/ui/toast";
import { useCan } from "@/components/admin/access";
import { PRODUCT_TYPE_DEFAULTS, type ProductTypeSetting } from "@/shared/product-types";
import { slugify } from "@/shared/money";

const PAYMENT_FLAGS = [
  { key: "cod", label: "Cash on delivery", hint: "Live now — shoppers pay when the pair arrives.", locked: true },
  { key: "jazzcash", label: "JazzCash", hint: "Milestone 2", locked: false },
  { key: "easypaisa", label: "EasyPaisa", hint: "Milestone 2", locked: false },
  { key: "cards", label: "Cards", hint: "Milestone 2", locked: false },
  { key: "stripe", label: "Stripe", hint: "Milestone 2", locked: false },
] as const;

const COURIER_FLAGS = [
  { key: "manual", label: "Manual CN / tracking", hint: "Live now — enter courier numbers by hand.", locked: true },
  { key: "tcsApi", label: "TCS API", hint: "Milestone 2", locked: false },
  { key: "leopardApi", label: "Leopard API", hint: "Milestone 2", locked: false },
  { key: "postex", label: "PostEx API", hint: "Milestone 2", locked: false },
] as const;

const field =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";
const card = "space-y-4 rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm sm:p-6";
const label = "block text-[13px] font-medium text-ink-muted";

function Toggle({
  on,
  locked,
  onClick,
}: {
  on: boolean;
  locked?: boolean;
  onClick: () => void;
}) {
  return <Switch on={on} disabled={locked} onChange={onClick} />;
}

export default function SettingsPage() {
  const access = useCan("settings");
  const router = useRouter();
  const [store, setStore] = useState({
    name: "Agile Sole",
    city: "Gujranwala",
    whatsapp: "",
    email: "",
    ntn: "",
    logo: LOGO_SRC,
    returnDays: 14,
    maxCod: 50000,
    minOrder: 0,
    highValue: 15000,
    shippingAlwaysFree: false,
    shippingFee: 250,
    shippingFreeOver: 5000,
  });
  const [analytics, setAnalytics] = useState({ ga4Id: "", metaPixelId: "" });
  const [payments, setPayments] = useState({
    cod: true,
    jazzcash: false,
    easypaisa: false,
    cards: false,
    stripe: false,
  });
  const [couriers, setCouriers] = useState({
    manual: true,
    tcsApi: false,
    leopardApi: false,
    postex: false,
  });
  const [productTypes, setProductTypes] = useState<ProductTypeSetting[]>(PRODUCT_TYPE_DEFAULTS);
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [logoError, setLogoError] = useState("");

  useEffect(() => {
    fetch("/api/v1/admin/settings")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return;
        setStore((s) => ({ ...s, ...j.data.store, logo: j.data.store?.logo || LOGO_SRC }));
        setAnalytics((s) => ({ ...s, ...j.data.analytics }));
        setPayments((s) => ({ ...s, ...j.data.payments }));
        setCouriers((s) => ({ ...s, ...j.data.couriers }));
        if (j.data.catalog?.productTypes?.length) setProductTypes(j.data.catalog.productTypes);
      });
  }, []);

  async function uploadLogo(file: File) {
    setLogoError("");
    const body = new FormData();
    body.set("file", file);
    const res = await fetch("/api/v1/admin/media", { method: "POST", body });
    const json = await res.json();
    if (!json.ok) {
      toastApiError(json, "Could not upload logo");
      return;
    }
    const url = json.data.url as string;
    setStore((s) => ({ ...s, logo: url }));
    notifyLogoChanged(url);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved("");
    const res = await fetch("/api/v1/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store: { ...store, logo: store.logo || LOGO_SRC },
        analytics,
        payments: { ...payments, cod: true },
        couriers: { ...couriers, manual: true },
        catalog: { productTypes },
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (json.ok) {
      notifyLogoChanged(store.logo || LOGO_SRC);
      router.refresh();
      toast.success("Settings saved");
    } else {
      toastApiError(json, "Could not save");
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <AdminPageHeader
        title="Store settings"
        description="Brand, contact, shipping, COD limits, and what goes live next."
        actions={
          access.update ? (
          <AdminHeaderAction
            icon={Check}
            type="submit"
            label="Save settings"
            loadingLabel="Saving…"
            disabled={busy}
          />
          ) : undefined
        }
      />
      {saved ? <p className="rounded-xl bg-brand-mist px-3 py-2 text-sm text-brand-dark">{saved}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className={card}>
            <h2 className="text-sm font-semibold tracking-tight">Company logo</h2>
            <p className="text-sm text-ink-muted">Shown on the store header, footer, and this workspace. PNG or SVG with a clear mark works best.</p>
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-[var(--admin-line)] bg-[#f7f8f7] p-3">
                {store.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={store.logo} alt="Company logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-ink-faint" />
                )}
              </div>
              <div className="min-w-[16rem] flex-1 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[var(--admin-line)] bg-white px-4 text-sm font-medium">
                    Upload logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadLogo(file);
                      }}
                    />
                  </label>
                  {store.logo && store.logo !== LOGO_SRC ? (
                    <button
                      type="button"
                      className="inline-flex h-10 items-center gap-1 rounded-xl border border-[var(--admin-line)] bg-white px-3 text-sm text-ink-muted"
                      onClick={() => setStore({ ...store, logo: LOGO_SRC })}
                    >
                      <X className="h-4 w-4" />
                      Use default
                    </button>
                  ) : null}
                </div>
                <input
                  className={`${field} mt-0`}
                  value={store.logo}
                  onChange={(e) => setStore({ ...store, logo: e.target.value })}
                  placeholder="/favicon.png"
                />
                {logoError ? <p className="text-sm text-red-700">{logoError}</p> : null}
              </div>
            </div>
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold tracking-tight">Store profile</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={`${label} sm:col-span-2`}>
                Store name
                <input className={field} value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} />
              </label>
              <label className={label}>
                City
                <input className={field} value={store.city} onChange={(e) => setStore({ ...store, city: e.target.value })} />
              </label>
              <label className={label}>
                WhatsApp
                <input className={field} value={store.whatsapp} onChange={(e) => setStore({ ...store, whatsapp: e.target.value })} placeholder="92300…" />
              </label>
              <label className={label}>
                Email
                <input type="email" className={field} value={store.email} onChange={(e) => setStore({ ...store, email: e.target.value })} />
              </label>
              <label className={label}>
                NTN
                <input className={field} value={store.ntn} onChange={(e) => setStore({ ...store, ntn: e.target.value })} placeholder="Optional tax number" />
              </label>
            </div>
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold tracking-tight">Orders & COD</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Return window (days)
                <input type="number" min={0} className={field} value={store.returnDays} onChange={(e) => setStore({ ...store, returnDays: Number(e.target.value) })} />
              </label>
              <label className={label}>
                Min order (PKR)
                <input type="number" min={0} className={field} value={store.minOrder} onChange={(e) => setStore({ ...store, minOrder: Number(e.target.value) })} />
              </label>
              <label className={label}>
                Max COD (PKR)
                <input type="number" min={0} className={field} value={store.maxCod} onChange={(e) => setStore({ ...store, maxCod: Number(e.target.value) })} />
              </label>
              <label className={label}>
                High-value order (PKR)
                <input type="number" min={0} className={field} value={store.highValue} onChange={(e) => setStore({ ...store, highValue: Number(e.target.value) })} />
              </label>
            </div>
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold tracking-tight">Shipping</h2>
            <p className="text-sm text-ink-muted">
              Controls COD delivery on the bag and checkout. Promo codes that waive shipping still work on top of this.
            </p>
            <div
              className={`flex items-center justify-between gap-4 rounded-xl border px-3.5 py-3 ${
                store.shippingAlwaysFree
                  ? "border-brand bg-brand-mist"
                  : "border-[#e7ebe8] bg-[#f7f8f7]"
              }`}
            >
              <div>
                <p className={`text-sm font-medium ${store.shippingAlwaysFree ? "text-brand-dark" : "text-ink"}`}>
                  Always free shipping
                </p>
                <p className="mt-0.5 text-[12px] text-ink-faint">Turn on to waive delivery on every order.</p>
              </div>
              <Switch
                on={store.shippingAlwaysFree}
                onChange={() => setStore({ ...store, shippingAlwaysFree: !store.shippingAlwaysFree })}
              />
            </div>
            {store.shippingAlwaysFree ? (
              <p className="text-sm text-ink-muted">Every order ships at no extra charge. Turn this off to set a delivery fee.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>
                  Shipping charge (PKR)
                  <input
                    type="number"
                    min={0}
                    className={field}
                    value={store.shippingFee}
                    onChange={(e) => setStore({ ...store, shippingFee: Number(e.target.value) })}
                  />
                  <span className="mt-1 block text-[12px] font-normal text-ink-faint">Fee when the order is below the free threshold.</span>
                </label>
                <label className={label}>
                  Free shipping from (PKR)
                  <input
                    type="number"
                    min={0}
                    className={field}
                    value={store.shippingFreeOver}
                    onChange={(e) => setStore({ ...store, shippingFreeOver: Number(e.target.value) })}
                  />
                  <span className="mt-1 block text-[12px] font-normal text-ink-faint">
                    Orders at or above this amount ship free. Use 0 to always charge.
                  </span>
                </label>
              </div>
            )}
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold tracking-tight">Analytics</h2>
            <p className="text-sm text-ink-muted">Scripts load only after the shopper accepts marketing cookies.</p>
            <label className={label}>
              GA4 measurement ID
              <input className={field} value={analytics.ga4Id} onChange={(e) => setAnalytics({ ...analytics, ga4Id: e.target.value })} placeholder="G-XXXXXXXX" />
            </label>
            <label className={label}>
              Meta Pixel ID
              <input className={field} value={analytics.metaPixelId} onChange={(e) => setAnalytics({ ...analytics, metaPixelId: e.target.value })} />
            </label>
            <p className="text-sm text-ink-muted">
              Catalog feeds:{" "}
              <a className="font-medium text-brand-dark" href="/api/v1/feeds/google">
                Google
              </a>
              {" · "}
              <a className="font-medium text-brand-dark" href="/api/v1/feeds/meta">
                Meta
              </a>
            </p>
          </section>

          <section className={card}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">Product types</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  These appear on product create/edit, size charts, and shop filters. Add boots, heels, or anything else you sell.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--admin-line)] bg-white px-3 text-sm font-medium"
                onClick={() =>
                  setProductTypes((prev) => [...prev, { id: "", label: "", labelUr: "", openFootwear: false }])
                }
              >
                <Plus className="h-4 w-4" />
                Add type
              </button>
            </div>
            <div className="space-y-3">
              {productTypes.map((row, i) => (
                <div key={i} className="rounded-2xl border border-[#e7ebe8] bg-[#f7f8f7] p-3">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem_auto]">
                    <label className={label}>
                      Name
                      <input
                        className={`${field} mt-1`}
                        value={row.label}
                        placeholder="e.g. Boot"
                        onChange={(e) => {
                          const label = e.target.value;
                          const next = [...productTypes];
                          next[i] = { ...row, label, id: row.id || slugify(label) };
                          setProductTypes(next);
                        }}
                        onBlur={() => {
                          const next = [...productTypes];
                          next[i] = { ...row, id: slugify(row.id || row.label) };
                          setProductTypes(next);
                        }}
                      />
                    </label>
                    <label className={label}>
                      Urdu
                      <input
                        dir="rtl"
                        className={`${field} mt-1`}
                        value={row.labelUr}
                        onChange={(e) => {
                          const next = [...productTypes];
                          next[i] = { ...row, labelUr: e.target.value };
                          setProductTypes(next);
                        }}
                      />
                    </label>
                    <label className={label}>
                      Code
                      <input
                        className={`${field} mt-1 font-mono text-xs`}
                        value={row.id}
                        onChange={(e) => {
                          const next = [...productTypes];
                          next[i] = { ...row, id: slugify(e.target.value) };
                          setProductTypes(next);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="mt-7 flex h-11 w-11 items-center justify-center rounded-xl text-ink-faint hover:bg-white hover:text-red-700 disabled:opacity-30"
                      disabled={productTypes.length <= 1}
                      onClick={() => setProductTypes(productTypes.filter((_, j) => j !== i))}
                      aria-label="Remove type"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#cfd6d1] text-brand"
                      checked={row.openFootwear}
                      onChange={(e) => {
                        const next = [...productTypes];
                        next[i] = { ...row, openFootwear: e.target.checked };
                        setProductTypes(next);
                      }}
                    />
                    Open footwear — use the sandal size chart
                  </label>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className={card}>
            <h2 className="text-sm font-semibold tracking-tight">Payments</h2>
            <p className="text-sm text-ink-muted">COD is on. Wallets and cards wait for Milestone 2.</p>
            <ul className="space-y-3">
              {PAYMENT_FLAGS.map((flag) => (
                <li key={flag.key} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{flag.label}</p>
                    <p className="text-xs text-ink-faint">{flag.hint}</p>
                  </div>
                  <Toggle
                    on={Boolean(payments[flag.key as keyof typeof payments])}
                    locked={flag.locked}
                    onClick={() => setPayments({ ...payments, [flag.key]: !payments[flag.key as keyof typeof payments] } as typeof payments)}
                  />
                </li>
              ))}
            </ul>
          </section>
          <section className={card}>
            <h2 className="text-sm font-semibold tracking-tight">Couriers</h2>
            <ul className="space-y-3">
              {COURIER_FLAGS.map((flag) => (
                <li key={flag.key} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{flag.label}</p>
                    <p className="text-xs text-ink-faint">{flag.hint}</p>
                  </div>
                  <Toggle
                    on={Boolean(couriers[flag.key as keyof typeof couriers])}
                    locked={flag.locked}
                    onClick={() => setCouriers({ ...couriers, [flag.key]: !couriers[flag.key as keyof typeof couriers] } as typeof couriers)}
                  />
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </form>
  );
}
