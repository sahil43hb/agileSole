"use client";

import { FormEvent, useEffect, useState } from "react";
import { AccountShell } from "@/components/storefront/account-shell";

const field =
  "w-full rounded-2xl border-0 bg-[#f3f5f2] px-4 py-3 text-sm outline-none ring-1 ring-transparent transition placeholder:text-ink-faint focus:bg-white focus:ring-brand/40";

type Address = {
  _id: string;
  label?: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("Punjab");
  const [city, setCity] = useState("Gujranwala");
  const [street, setStreet] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/v1/me/addresses", { credentials: "same-origin" });
    const json = await res.json();
    if (json.ok) setAddresses(json.data.addresses);
  }

  useEffect(() => {
    void load();
  }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/v1/me/addresses", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone, province, city, street, isDefault: !addresses.length }),
    });
    const json = await res.json();
    if (!json.ok) setMessage(json.error?.message || "Could not save");
    else {
      setAddresses((json.data.customer.addresses || []) as Address[]);
      setStreet("");
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/v1/me/addresses/${id}`, { method: "DELETE", credentials: "same-origin" });
    const json = await res.json();
    if (json.ok) setAddresses((json.data.customer.addresses || []) as Address[]);
  }

  return (
    <AccountShell>
      <h1 className="text-3xl font-semibold tracking-tight">Addresses</h1>
      <p className="mt-1 text-sm text-ink-muted">Saved COD delivery spots.</p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {addresses.map((a) => (
          <li key={a._id} className="rounded-[1.25rem] bg-white p-5 ring-1 ring-black/[0.04]">
            <p className="font-semibold">{a.label || a.fullName}</p>
            <p className="mt-1 text-sm text-ink-muted">
              {a.street}
              <br />
              {a.city}, {a.province}
              <br />
              {a.phone}
            </p>
            <button type="button" className="mt-3 text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline" onClick={() => void remove(a._id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="mt-6 max-w-lg rounded-[1.35rem] bg-white p-5 ring-1 ring-black/[0.04] md:p-6">
        <h2 className="font-semibold">Add address</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input required placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={field} />
          <input required placeholder="Mobile" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
        </div>
        <input required placeholder="Street / house" value={street} onChange={(e) => setStreet(e.target.value)} className={`${field} mt-3`} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input placeholder="Province" value={province} onChange={(e) => setProvince(e.target.value)} className={field} />
          <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className={field} />
        </div>
        <button type="submit" className="btn-primary mt-5 h-11 rounded-full px-6">
          Save address
        </button>
        {message ? <p className="mt-3 text-sm text-ink-muted">{message}</p> : null}
      </form>
    </AccountShell>
  );
}
