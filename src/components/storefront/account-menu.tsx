"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Package, UserRound } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "./auth-provider";

export function customerInitials(name?: string, phone?: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length) return ((parts[0][0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  const digits = (phone || "").replace(/\D/g, "");
  return (digits.slice(-2) || "AS").toUpperCase();
}

export function customerFirstName(name?: string) {
  return (name || "").trim().split(/\s+/)[0] || "Account";
}

export function CustomerAvatar({
  name,
  phone,
  size = "md",
}: {
  name?: string;
  phone?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "h-12 w-12 text-sm" : size === "sm" ? "h-8 w-8 text-[10px]" : "h-9 w-9 text-xs";
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-brand font-semibold text-white ${dim}`}>
      {customerInitials(name, phone)}
    </span>
  );
}

export function AccountMenu() {
  const { customer, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!customer) {
    return (
      <Link
        href="/account/login"
        aria-label="Account"
        className="relative grid h-9 w-9 place-items-center rounded-full text-ink/80 transition hover:bg-white hover:text-ink"
      >
        <UserRound className="h-[17px] w-[17px]" strokeWidth={1.75} />
      </Link>
    );
  }

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-full bg-white py-0.5 pe-2 ps-0.5 ring-1 ring-black/[0.08] transition hover:ring-black/15"
      >
        <CustomerAvatar name={customer.name} phone={customer.phone} size="sm" />
        <span className="hidden max-w-[7.5rem] truncate text-sm font-medium sm:inline">{customerFirstName(customer.name)}</span>
        <ChevronDown className={`hidden h-3.5 w-3.5 text-ink-muted sm:block ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute end-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-2xl bg-white py-1.5 shadow-[0_18px_50px_rgba(17,17,17,0.14)] ring-1 ring-black/[0.06]">
          <p className="px-3 pb-1.5 pt-1 text-xs text-ink-muted">Signed in</p>
          <p className="truncate px-3 pb-2 text-sm font-medium">{customer.name || customer.phone}</p>
          <Link href="/account" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#f4f7f5]" onClick={() => setOpen(false)}>
            <UserRound className="h-4 w-4 text-ink-muted" />
            Your account
          </Link>
          <Link href="/account/orders" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#f4f7f5]" onClick={() => setOpen(false)}>
            <Package className="h-4 w-4 text-ink-muted" />
            Orders
          </Link>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm text-ink-muted hover:bg-[#f4f7f5]"
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.push("/account/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
