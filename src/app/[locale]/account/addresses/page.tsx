"use client";

import { FormEvent, useEffect, useState } from "react";
import { AccountShell } from "@/components/storefront/account-shell";

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
      <h1 className="text-2xl font-semibold">Addresses</h1>
      <ul className="mt-6 space-y-3">
        {addresses.map((a) => (
          <li key={a._id} className="border border-paper-line p-3 text-sm">
            <p className="font-medium">{a.label || a.fullName}</p>
            <p className="text-ink-muted">
              {a.street}, {a.city}, {a.province} · {a.phone}
            </p>
            <button type="button" className="mt-2 text-xs text-ink-muted" onClick={() => void remove(a._id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-8 max-w-md space-y-3">
        <h2 className="font-medium">Add address</h2>
        <input required placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-paper-line px-3 py-2 text-sm" />
        <input required placeholder="Mobile" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-paper-line px-3 py-2 text-sm" />
        <input required placeholder="Street" value={street} onChange={(e) => setStreet(e.target.value)} className="w-full border border-paper-line px-3 py-2 text-sm" />
        <input placeholder="Province" value={province} onChange={(e) => setProvince(e.target.value)} className="w-full border border-paper-line px-3 py-2 text-sm" />
        <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-paper-line px-3 py-2 text-sm" />
        <button type="submit" className="btn-primary h-11 px-6">
          Save address
        </button>
        {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
      </form>
    </AccountShell>
  );
}
