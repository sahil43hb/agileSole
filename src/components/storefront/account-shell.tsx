"use client";

import type { ReactNode } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "./auth-provider";

const NAV = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/reviews", label: "Reviews" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/track-order", label: "Track" },
];

export function AccountShell({ children }: { children: ReactNode }) {
  const { customer, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return <p className="px-4 py-16 text-sm text-ink-muted">Loading account…</p>;
  }

  if (!customer) {
    router.replace("/account/login");
    return <p className="px-4 py-16 text-sm text-ink-muted">Redirecting to login…</p>;
  }

  return (
    <div className="mx-auto grid max-w-site gap-10 px-4 py-10 md:grid-cols-[200px_1fr]">
      <aside>
        <p className="text-sm font-medium">{customer.name || customer.phone || customer.email}</p>
        <nav className="mt-4 space-y-1 text-sm">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block py-1 ${active ? "text-ink" : "text-ink-muted hover:text-ink"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="mt-6 text-sm text-ink-muted"
          onClick={async () => {
            await signOut();
            router.push("/account/login");
          }}
        >
          Sign out
        </button>
      </aside>
      <div>{children}</div>
    </div>
  );
}
