"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { AccountShell } from "@/components/storefront/account-shell";
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

  return (
    <AccountShell>
      <h1 className="text-2xl font-semibold">Your account</h1>
      <p className="mt-1 text-sm text-ink-muted">Orders, addresses, and tracking in one place.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="bg-paper-warm p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">Orders</p>
          <p className="mt-2 text-2xl">{me?.orderCount ?? "—"}</p>
        </div>
        <div className="bg-paper-warm p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">Wishlist</p>
          <p className="mt-2 text-2xl">{count}</p>
        </div>
        <div className="bg-paper-warm p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">Addresses</p>
          <p className="mt-2 text-2xl">{me?.customer.addresses?.length ?? 0}</p>
        </div>
      </div>
      {me?.lastOrder ? (
        <div className="mt-8 border border-paper-line p-4">
          <p className="text-sm text-ink-muted">Latest order</p>
          <p className="mt-1 font-medium">
            {me.lastOrder.number} · {statusLabel(me.lastOrder.status, locale)} · {formatPkr(me.lastOrder.amounts.total)}
          </p>
          <Link href={`/account/orders/${me.lastOrder._id}`} className="mt-2 inline-block text-sm text-brand-dark">
            View timeline
          </Link>
        </div>
      ) : (
        <p className="mt-8 text-sm text-ink-muted">No orders yet. Guest checkout still lets you track with order number + phone.</p>
      )}
    </AccountShell>
  );
}
