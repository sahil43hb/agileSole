"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Heart, MapPin, Package } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AccountShell } from "@/components/storefront/account-shell";
import { customerFirstName } from "@/components/storefront/account-menu";
import { formatPkr } from "@/shared/money";
import { statusLabel } from "@/shared/order-copy";
import { useAuth } from "@/components/storefront/auth-provider";
import { useWishlist } from "@/components/storefront/wishlist-provider";
import { useLocale } from "next-intl";

type Me = {
  customer: { name: string; phone: string; email: string; addresses?: unknown[] };
  lastOrder: { _id: string; number: string; status: string; amounts: { total: number } } | null;
  orderCount: number;
};

export default function AccountHomePage() {
  const { customer } = useAuth();
  const { count } = useWishlist();
  const locale = useLocale();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/v1/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => j.ok && setMe(j.data));
  }, [customer]);

  const stats = [
    { href: "/account/orders", label: "Orders", value: me?.orderCount ?? "—", icon: Package },
    { href: "/wishlist", label: "Wishlist", value: count, icon: Heart },
    { href: "/account/addresses", label: "Addresses", value: me?.customer.addresses?.length ?? 0, icon: MapPin },
  ];

  return (
    <AccountShell>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-dark">Account</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Hi, {customerFirstName(customer?.name)}</h1>
      <p className="mt-1 text-sm text-ink-muted">Orders, addresses, and tracking in one place.</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-[1.35rem] bg-white p-5 shadow-[0_8px_28px_rgba(17,17,17,0.04)] ring-1 ring-black/[0.04] transition hover:ring-black/10"
          >
            <s.icon className="h-4 w-4 text-brand" />
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">{s.label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{s.value}</p>
          </Link>
        ))}
      </div>

      {me?.lastOrder ? (
        <Link
          href={`/account/orders/${me.lastOrder._id}`}
          className="mt-6 flex items-center justify-between gap-4 rounded-[1.35rem] bg-white p-5 shadow-[0_8px_28px_rgba(17,17,17,0.04)] ring-1 ring-black/[0.04] transition hover:ring-black/10"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">Latest order</p>
            <p className="mt-1 font-semibold">{me.lastOrder.number}</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {statusLabel(me.lastOrder.status, locale)} · {formatPkr(me.lastOrder.amounts.total)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark">
            View timeline
            <ChevronRight className="h-4 w-4" />
          </span>
        </Link>
      ) : (
        <div className="mt-6 rounded-[1.35rem] bg-white p-5 text-sm text-ink-muted ring-1 ring-black/[0.04]">
          No orders yet. Guest checkout still lets you track with order number + phone.
        </div>
      )}
    </AccountShell>
  );
}
