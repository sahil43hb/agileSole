"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Ban, Mail, MapPin, Phone, Plus, Save, Star, Trash2, User } from "lucide-react";
import { formatPkr } from "@/shared/money";
import {
  AdminHeaderAction,
  AdminPageHeader,
  AdminTable,
  ConfirmDialog,
  EmptyNote,
  StatusBadge,
  formatAdminDate,
  rowBtnDanger,
} from "@/components/admin/ui";
import { AppSelect } from "@/components/ui/app-select";
import { GEO_PK } from "@/content/geo-pk";
import { toast, toastApiError } from "@/components/ui/toast";
import { BusyLabel } from "@/components/ui/spinner";
import { useCan } from "@/components/admin/access";

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

type OrderRow = {
  _id: string;
  number: string;
  status: string;
  channel: string;
  createdAt: string;
  amounts?: { total?: number };
  payment?: { status?: string };
  items: { title?: string; qty?: number }[];
};

type TicketRow = {
  _id: string;
  type: string;
  status: string;
  reason: string;
  orderNumber?: string;
  createdAt: string;
};

type Detail = {
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
    locale: string;
    rtoCount: number;
    blockedAt?: string | null;
    createdAt?: string;
    addresses: Address[];
  };
  stats: { orders: number; ltv: number; tickets: number };
  orders: OrderRow[];
  tickets: TicketRow[];
};

const field =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const emptyAddress = {
  label: "Home",
  fullName: "",
  phone: "",
  street: "",
  province: "Punjab",
  city: "Gujranwala",
  landmark: "",
  isDefault: false,
};

export default function AdminCustomerDetailPage() {
  const access = useCan("customers");
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingBlock, setPendingBlock] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [locale, setLocale] = useState("en");
  const [rtoCount, setRtoCount] = useState(0);

  const [form, setForm] = useState(emptyAddress);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch(`/api/v1/admin/customers/${params.id}`);
    const json = await res.json();
    if (!json.ok) {
      toastApiError(json, "Not found");
      return;
    }
    const next = json.data as Detail;
    setData(next);
    setName(next.customer.name || "");
    setPhone(next.customer.phone || "");
    setEmail(next.customer.email || "");
    setLocale(next.customer.locale || "en");
    setRtoCount(next.customer.rtoCount || 0);
    setError("");
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const cities = useMemo(
    () => GEO_PK.find((p) => p.province === form.province)?.cities || [],
    [form.province],
  );

  if (!data) {
    return <p className="text-sm text-ink-muted">{error || "Loading…"}</p>;
  }

  const customer = data.customer;

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch(`/api/v1/admin/customers/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, locale, rtoCount }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) toastApiError(json, "Could not save");
    else {
      toast.success("Profile saved");
      void load();
    }
  }

  async function saveAddress(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const payload = {
      label: form.label,
      fullName: form.fullName,
      phone: form.phone,
      street: form.street,
      province: form.province,
      city: form.city,
      landmark: form.landmark,
      isDefault: form.isDefault || !customer.addresses.length,
    };
    const res = await fetch(
      editingId
        ? `/api/v1/admin/customers/${params.id}/addresses/${editingId}`
        : `/api/v1/admin/customers/${params.id}/addresses`,
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      toastApiError(json, "Could not save address");
      return;
    }
    toast.success(editingId ? "Address saved" : "Address added");
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyAddress, fullName: name, phone });
    void load();
  }

  function startEdit(addr: Address) {
    setEditingId(addr._id);
    setForm({
      label: addr.label || "Home",
      fullName: addr.fullName,
      phone: addr.phone,
      street: addr.street,
      province: addr.province || "Punjab",
      city: addr.city || "Gujranwala",
      landmark: addr.landmark || "",
      isDefault: Boolean(addr.isDefault),
    });
    setShowForm(true);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/admin/customers" className="text-sm text-ink-muted hover:text-ink">
          ← Customers
        </Link>
        <div className="mt-3">
          <AdminPageHeader
            title={customer.name || customer.phone || "Customer"}
            description={`In the book since ${formatAdminDate(customer.createdAt)}`}
            actions={
              access.update ? (
              <AdminHeaderAction
                icon={Ban}
                label={customer.blockedAt ? "Unblock" : "Block COD"}
                variant={customer.blockedAt ? "secondary" : "primary"}
                onClick={() => setPendingBlock(true)}
              />
              ) : undefined
            }
          />
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge value={customer.blockedAt ? "blocked" : "active"} />
            <span className="text-ink-faint">{customer.phone}</span>
            {customer.email ? <span className="text-ink-faint">{customer.email}</span> : null}
          </div>
        </div>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Orders", value: data.stats.orders },
          { label: "Lifetime value", value: formatPkr(data.stats.ltv) },
          { label: "RTO", value: customer.rtoCount },
          { label: "Tickets", value: data.stats.tickets },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[var(--admin-line)] bg-white p-4 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <form onSubmit={saveProfile} className="space-y-4 rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold">Profile</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Full name
            <span className="relative mt-1.5 block">
              <User className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input required value={name} onChange={(e) => setName(e.target.value)} className={`${field} mt-0 ps-10`} />
            </span>
          </label>
          <label className="block text-sm font-medium">
            Phone
            <span className="relative mt-1.5 block">
              <Phone className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={`${field} mt-0 ps-10 font-mono`} />
            </span>
          </label>
          <label className="block text-sm font-medium">
            Email
            <span className="relative mt-1.5 block">
              <Mail className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${field} mt-0 ps-10`} placeholder="Optional" />
            </span>
          </label>
          <label className="block text-sm font-medium">
            RTO count
            <input type="number" min={0} value={rtoCount} onChange={(e) => setRtoCount(Number(e.target.value))} className={field} />
          </label>
        </div>
        <div>
          <p className="text-sm font-medium">Language</p>
          <div className="mt-1.5 grid max-w-xs grid-cols-2 gap-1 rounded-xl bg-[#f4f7f5] p-1">
            {[
              { id: "en", label: "English" },
              { id: "ur", label: "Urdu" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLocale(opt.id)}
                className={`h-9 rounded-lg text-sm font-medium transition ${
                  locale === opt.id ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {access.update ? (
        <button type="submit" disabled={busy} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
          <Save className="h-4 w-4" />
          <BusyLabel loading={busy} label="Saving…">
            Save profile
          </BusyLabel>
        </button>
        ) : null}
      </form>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight">Addresses</h2>
          {access.update ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline"
            onClick={() => {
              setEditingId(null);
              setForm({ ...emptyAddress, fullName: name, phone, isDefault: customer.addresses.length === 0 });
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add address
          </button>
          ) : null}
        </div>

        {!customer.addresses.length ? <EmptyNote>No saved addresses yet.</EmptyNote> : null}

        <div className="grid gap-3 md:grid-cols-2">
          {customer.addresses.map((addr) => (
            <article
              key={addr._id}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${
                addr.isDefault ? "border-brand/40 ring-1 ring-brand/20" : "border-[var(--admin-line)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-mist text-brand-dark">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold">{addr.label || "Home"}</p>
                    <p className="text-xs text-ink-muted">{addr.fullName}</p>
                  </div>
                </div>
                {addr.isDefault ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-mist px-2.5 py-1 text-[11px] font-medium text-brand-dark">
                    <Star className="h-3 w-3 fill-current" />
                    Primary
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-ink-muted">
                {addr.street}
                <br />
                {addr.city}, {addr.province}
                {addr.landmark ? (
                  <>
                    <br />
                    {addr.landmark}
                  </>
                ) : null}
                <br />
                {addr.phone}
              </p>
              {access.update ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {!addr.isDefault ? (
                  <button
                    type="button"
                    className="inline-flex h-8 items-center rounded-full border border-[#e7ebe8] bg-white px-3 text-xs font-medium hover:bg-[#f4f7f5]"
                    onClick={async () => {
                      const res = await fetch(`/api/v1/admin/customers/${params.id}/addresses/${addr._id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isDefault: true }),
                      });
                      const json = await res.json();
                      if (!json.ok) toastApiError(json, "Could not set primary");
                      else {
                        toast.success("Primary address updated");
                        void load();
                      }
                    }}
                  >
                    Set primary
                  </button>
                ) : null}
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-full border border-[#e7ebe8] bg-white px-3 text-xs font-medium hover:bg-[#f4f7f5]"
                  onClick={() => startEdit(addr)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={rowBtnDanger}
                  onClick={async () => {
                    const res = await fetch(`/api/v1/admin/customers/${params.id}/addresses/${addr._id}`, { method: "DELETE" });
                    const json = await res.json();
                    if (!json.ok) toastApiError(json, "Could not remove address");
                    else {
                      toast.success("Address removed");
                      void load();
                    }
                  }}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Remove
                </button>
              </div>
              ) : null}
            </article>
          ))}
        </div>

        {showForm ? (
          <form onSubmit={saveAddress} className="space-y-3 rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold">{editingId ? "Edit address" : "New address"}</p>
            <div className="flex flex-wrap gap-2">
              {["Home", "Office", "Other"].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, label }))}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    form.label === label ? "bg-ink text-white" : "border border-[var(--admin-line)] bg-white text-ink-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input required placeholder="Full name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} className={field} />
              <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={field} />
            </div>
            <input required placeholder="House, street" value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} className={field} />
            <input placeholder="Landmark (optional)" value={form.landmark} onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))} className={field} />
            <div className="grid gap-3 sm:grid-cols-2">
              <AppSelect
                value={form.province}
                onChange={(next) => {
                  const nextCities = GEO_PK.find((p) => p.province === next)?.cities || [];
                  setForm((f) => ({ ...f, province: next, city: nextCities[0] || "" }));
                }}
                options={GEO_PK.map((p) => ({ value: p.province, label: p.province }))}
              />
              <AppSelect
                value={form.city}
                onChange={(city) => setForm((f) => ({ ...f, city }))}
                options={cities.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              />
              Primary address
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="h-10 rounded-xl bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
                <BusyLabel loading={busy} label="Saving…">
                  Save address
                </BusyLabel>
              </button>
              <button
                type="button"
                className="h-10 rounded-xl border border-[var(--admin-line)] px-4 text-sm"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Orders</h2>
        {!data.orders.length ? (
          <EmptyNote>No orders for this phone yet.</EmptyNote>
        ) : (
          <AdminTable>
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Channel</th>
                  <th>Items</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((o) => {
                  const qty = (o.items || []).reduce((sum, i) => sum + (i.qty || 0), 0);
                  return (
                    <tr key={o._id}>
                      <td>
                        <Link href={`/admin/orders/${o._id}`} className="font-semibold hover:text-brand-dark">
                          {o.number}
                        </Link>
                        <p className="text-xs text-ink-faint">
                          {(o.items || [])
                            .slice(0, 2)
                            .map((i) => i.title)
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </td>
                      <td className="whitespace-nowrap text-ink-muted">{formatAdminDate(o.createdAt)}</td>
                      <td>
                        <StatusBadge value={o.status} />
                      </td>
                      <td className="capitalize text-ink-muted">{o.channel}</td>
                      <td className="text-ink-muted">{qty}</td>
                      <td className="font-medium">{formatPkr(o.amounts?.total || 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </AdminTable>
        )}
      </section>

      {data.tickets.length ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">Tickets</h2>
          <AdminTable>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {data.tickets.map((t) => (
                  <tr key={t._id}>
                    <td className="capitalize">{t.type}</td>
                    <td>
                      <StatusBadge value={t.status} />
                    </td>
                    <td>
                      <p className="max-w-md truncate text-sm">{t.reason}</p>
                      {t.orderNumber ? (
                        <p className="text-xs text-ink-faint">{t.orderNumber}</p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap text-ink-muted">{formatAdminDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
        </section>
      ) : null}

      <ConfirmDialog
        open={pendingBlock}
        title={customer.blockedAt ? "Unblock this customer?" : "Block this customer?"}
        body={
          customer.blockedAt
            ? `${customer.name || customer.phone} will be able to place COD orders again.`
            : `${customer.name || customer.phone} will not be able to place COD orders until you unblock them.`
        }
        confirmLabel={customer.blockedAt ? "Unblock" : "Block"}
        danger={!customer.blockedAt}
        busy={busy}
        onCancel={() => setPendingBlock(false)}
        onConfirm={async () => {
          setBusy(true);
          const res = await fetch(`/api/v1/admin/customers/${params.id}/block`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ blocked: !customer.blockedAt }),
          });
          const json = await res.json();
          setBusy(false);
          setPendingBlock(false);
          if (!json.ok) toastApiError(json, "Could not update customer");
          else {
            toast.success(customer.blockedAt ? "Customer unblocked" : "Customer blocked");
            void load();
          }
        }}
      />
    </div>
  );
}
