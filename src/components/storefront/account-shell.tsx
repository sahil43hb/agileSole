"use client";

import type { ReactNode } from "react";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, Star, Truck, UserRound } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "./auth-provider";
import { CustomerAvatar, customerFirstName } from "./account-menu";

const NAV = [
  { href: "/account", label: "Overview", exact: true, icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/reviews", label: "Reviews", icon: Star },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/track-order", label: "Track", icon: Truck },
];

export function AccountShell({ children }: { children: ReactNode }) {
  const { customer, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return (
      <div className="bg-[#f6f7f5]">
        <p className="mx-auto max-w-site px-4 py-16 text-sm text-ink-muted">Loading account…</p>
      </div>
    );
  }

  if (!customer) {
    router.replace("/account/login");
    return (
      <div className="bg-[#f6f7f5]">
        <p className="mx-auto max-w-site px-4 py-16 text-sm text-ink-muted">Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f6f7f5]">
      <div className="mx-auto grid max-w-site gap-8 px-4 py-8 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-10 md:py-12">
        <aside className="h-fit rounded-[1.5rem] bg-white p-5 shadow-[0_10px_36px_rgba(17,17,17,0.04)] ring-1 ring-black/[0.04] md:sticky md:top-24 md:p-6">
          <div className="flex items-center gap-3">
            <CustomerAvatar name={customer.name} phone={customer.phone} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{customer.name || customerFirstName(customer.name)}</p>
              <p className="truncate text-xs text-ink-muted">{customer.phone || customer.email}</p>
            </div>
          </div>
          <nav className="mt-5 space-y-0.5">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-full px-3 py-2 text-sm transition ${
                    active ? "bg-ink text-paper" : "text-ink-muted hover:bg-[#f3f5f2] hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            className="mt-4 flex w-full items-center gap-2.5 rounded-full px-3 py-2 text-start text-sm text-ink-muted hover:bg-[#f3f5f2] hover:text-ink"
            onClick={async () => {
              await signOut();
              router.push("/account/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
