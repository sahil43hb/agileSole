"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AccountShell } from "@/components/storefront/account-shell";
import { AppSelect } from "@/components/ui/app-select";
import { useAuth } from "@/components/storefront/auth-provider";
import { GEO_PK, geoLabel } from "@/content/geo-pk";
import { toast, toastApiError } from "@/components/ui/toast";
import { BusyLabel } from "@/components/ui/spinner";

const field =
  "mt-1.5 w-full rounded-2xl border-0 bg-[#f3f5f2] px-4 py-3 text-sm outline-none ring-1 ring-transparent transition placeholder:text-ink-faint focus:bg-white focus:ring-brand/40";

type Address = {
  _id: string;
  label?: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  landmark?: string;
  isDefault?: boolean;
};

type Draft = {
  label: string;
  fullName: string;
  phone: string;
  street: string;
  province: string;
  city: string;
  landmark: string;
  isDefault: boolean;
};

function emptyDraft(seed?: { name?: string; phone?: string; isDefault?: boolean }): Draft {
  return {
    label: "Home",
    fullName: seed?.name || "",
    phone: seed?.phone || "",
    street: "",
    province: "Punjab",
    city: "Gujranwala",
    landmark: "",
    isDefault: Boolean(seed?.isDefault),
  };
}

export default function AddressesPage() {
  const locale = useLocale();
  const t = useTranslations("account");
  const c = useTranslations("common");
  const ch = useTranslations("checkout");
  const { customer } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const cities = useMemo(
    () => GEO_PK.find((p) => p.province === draft.province)?.cities || [],
    [draft.province],
  );

  const labels = [
    { id: "Home", label: t("labelHome") },
    { id: "Office", label: t("labelOffice") },
    { id: "Other", label: t("labelOther") },
  ];

  async function load() {
    const res = await fetch("/api/v1/me/addresses", { credentials: "same-origin" });
    const json = await res.json();
    if (json.ok) setAddresses(json.data.addresses);
  }

  useEffect(() => {
    void load();
  }, []);

  function openNew() {
    setEditingId(null);
    setDraft(emptyDraft({ name: customer?.name, phone: customer?.phone, isDefault: addresses.length === 0 }));
    setOpen(true);
    setMessage("");
  }

  function openEdit(addr: Address) {
    setEditingId(addr._id);
    setDraft({
      label: addr.label || "Home",
      fullName: addr.fullName,
      phone: addr.phone,
      street: addr.street,
      province: addr.province || "Punjab",
      city: addr.city || "Gujranwala",
      landmark: addr.landmark || "",
      isDefault: Boolean(addr.isDefault),
    });
    setOpen(true);
    setMessage("");
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setBusy(true);
    const payload = { ...draft, isDefault: draft.isDefault || addresses.length === 0 };
    const res = await fetch(editingId ? `/api/v1/me/addresses/${editingId}` : "/api/v1/me/addresses", {
      method: editingId ? "PATCH" : "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      toastApiError(json, "Could not save");
      return;
    }
    setAddresses((json.data.customer.addresses || []) as Address[]);
    toast.success(t("saveAddress"));
    setOpen(false);
    setEditingId(null);
  }

  async function remove(id: string) {
    const res = await fetch(`/api/v1/me/addresses/${id}`, { method: "DELETE", credentials: "same-origin" });
    const json = await res.json();
    if (!json.ok) toastApiError(json, "Could not remove");
    else {
      setAddresses((json.data.customer.addresses || []) as Address[]);
      toast.success("Address removed");
    }
  }

  async function setPrimary(id: string) {
    const res = await fetch(`/api/v1/me/addresses/${id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    const json = await res.json();
    if (!json.ok) toastApiError(json, "Could not set primary");
    else {
      setAddresses((json.data.customer.addresses || []) as Address[]);
      toast.success("Primary address updated");
    }
  }

  return (
    <AccountShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("addressesTitle")}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t("addressesHint")}</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-paper"
        >
          <Plus className="h-4 w-4" />
          {t("addAddress")}
        </button>
      </div>

      {!addresses.length && !open ? (
        <div className="mt-8 flex flex-col items-center rounded-[1.75rem] bg-white px-6 py-14 text-center shadow-[0_10px_36px_rgba(17,17,17,0.04)] ring-1 ring-black/[0.04]">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-mist text-brand-dark">
            <MapPin className="h-6 w-6" />
          </span>
          <p className="mt-4 max-w-sm text-sm text-ink-muted">{t("noAddresses")}</p>
          <button type="button" onClick={openNew} className="btn-primary mt-5 h-11 rounded-full px-6">
            {t("addAddress")}
          </button>
        </div>
      ) : null}

      <ul className="mt-8 grid gap-4 lg:grid-cols-2">
        {addresses.map((a) => (
          <li
            key={a._id}
            className={`relative overflow-hidden rounded-[1.5rem] bg-white p-5 shadow-[0_10px_36px_rgba(17,17,17,0.04)] ring-1 transition md:p-6 ${
              a.isDefault ? "ring-brand/35" : "ring-black/[0.04]"
            }`}
          >
            {a.isDefault ? <span className="absolute inset-x-0 top-0 h-1 bg-brand" /> : null}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3f5f2] text-ink">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold tracking-tight">
                    {a.label === "Office" ? t("labelOffice") : a.label === "Other" ? t("labelOther") : t("labelHome")}
                  </p>
                  <p className="text-sm text-ink-muted">{a.fullName}</p>
                </div>
              </div>
              {a.isDefault ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-mist px-2.5 py-1 text-[11px] font-semibold text-brand-dark">
                  <Star className="h-3 w-3 fill-current" />
                  {t("primary")}
                </span>
              ) : null}
            </div>
            <p className="mt-4 text-sm leading-6 text-ink-muted">
              {a.street}
              {a.landmark ? ` · ${a.landmark}` : ""}
              <br />
              {geoLabel(a.city, locale)}, {geoLabel(a.province, locale)}
              <br />
              {a.phone}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {!a.isDefault ? (
                <button
                  type="button"
                  onClick={() => void setPrimary(a._id)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f3f5f2] px-3.5 text-xs font-medium text-ink hover:bg-[#e9ece8]"
                >
                  <Check className="h-3.5 w-3.5" />
                  {t("setPrimary")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => openEdit(a)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f3f5f2] px-3.5 text-xs font-medium text-ink hover:bg-[#e9ece8]"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t("editAddress")}
              </button>
              <button
                type="button"
                onClick={() => void remove(a._id)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {c("remove")}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {open ? (
        <form
          onSubmit={save}
          className="mt-6 rounded-[1.5rem] bg-white p-5 shadow-[0_10px_36px_rgba(17,17,17,0.04)] ring-1 ring-black/[0.04] md:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold tracking-tight">{editingId ? t("editAddress") : t("addAddress")}</h2>
              <p className="mt-0.5 text-sm text-ink-muted">{ch("addressHint")}</p>
            </div>
            <button type="button" className="text-sm text-ink-muted hover:text-ink" onClick={() => setOpen(false)}>
              {t("closeForm")}
            </button>
          </div>

          <p className="mt-5 text-xs font-medium text-ink-muted">{t("addressLabel")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {labels.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, label: opt.id }))}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  draft.label === opt.id ? "bg-ink text-paper" : "bg-[#f3f5f2] text-ink-muted hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-ink-muted">
              {ch("fullName")}
              <input required value={draft.fullName} onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))} className={field} />
            </label>
            <label className="block text-xs font-medium text-ink-muted">
              {ch("mobile")}
              <input required value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} className={field} />
            </label>
          </div>
          <label className="mt-3 block text-xs font-medium text-ink-muted">
            {ch("street")}
            <input required value={draft.street} onChange={(e) => setDraft((d) => ({ ...d, street: e.target.value }))} className={field} placeholder={ch("streetPlaceholder")} />
          </label>
          <label className="mt-3 block text-xs font-medium text-ink-muted">
            {ch("landmark")}
            <input value={draft.landmark} onChange={(e) => setDraft((d) => ({ ...d, landmark: e.target.value }))} className={field} placeholder={ch("landmarkPlaceholder")} />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <AppSelect
              tone="store"
              value={draft.province}
              onChange={(next) => {
                const nextCities = GEO_PK.find((p) => p.province === next)?.cities || [];
                setDraft((d) => ({ ...d, province: next, city: nextCities[0] || "" }));
              }}
              options={GEO_PK.map((p) => ({ value: p.province, label: geoLabel(p.province, locale) }))}
            />
            <AppSelect
              tone="store"
              value={draft.city}
              onChange={(city) => setDraft((d) => ({ ...d, city }))}
              options={cities.map((item) => ({ value: item, label: geoLabel(item, locale) }))}
            />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.isDefault}
              onChange={(e) => setDraft((d) => ({ ...d, isDefault: e.target.checked }))}
            />
            {t("makePrimary")}
          </label>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className="btn-primary inline-flex h-11 items-center justify-center rounded-full px-6 disabled:opacity-60">
              <BusyLabel loading={busy} label="Saving…">
                {t("saveAddress")}
              </BusyLabel>
            </button>
            <button type="button" className="h-11 rounded-full px-5 text-sm text-ink-muted hover:text-ink" onClick={() => setOpen(false)}>
              {c("cancel")}
            </button>
          </div>
          {message ? <p className="mt-3 text-sm text-red-700">{message}</p> : null}
        </form>
      ) : null}
    </AccountShell>
  );
}
