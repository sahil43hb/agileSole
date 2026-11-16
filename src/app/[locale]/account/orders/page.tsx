"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { AccountShell } from "@/components/storefront/account-shell";
import { formatPkr } from "@/shared/money";
import { statusLabel } from "@/shared/order-copy";
import { useLocale } from "next-intl";

type Order = {
  _id: string;
  number: string;
  status: string;
  createdAt: string;
  amounts: { total: number };
};

export default function AccountOrdersPage() {
  const locale = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch(`/api/v1/me/orders?locale=${locale}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => j.ok && setOrders(j.data.orders));
  }, [locale]);

  return (
    <AccountShell>
      <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
      <p className="mt-1 text-sm text-ink-muted">Every COD order on this mobile.</p>
      <ul className="mt-6 space-y-3">
        {orders.map((o) => (
          <li key={o._id}>
            <Link
              href={`/account/orders/${o._id}`}
              className="flex items-center justify-between gap-3 rounded-[1.25rem] bg-white px-5 py-4 ring-1 ring-black/[0.04] transition hover:ring-black/10"
            >
              <div>
                <p className="font-semibold">{o.number}</p>
                <p className="text-sm text-ink-muted">{statusLabel(o.status, locale)}</p>
              </div>
              <p className="text-sm font-medium">{formatPkr(o.amounts?.total || 0)}</p>
            </Link>
          </li>
        ))}
      </ul>
      {!orders.length ? (
        <p className="mt-6 rounded-[1.25rem] bg-white p-5 text-sm text-ink-muted ring-1 ring-black/[0.04]">
          No orders on this account yet.
        </p>
      ) : null}
    </AccountShell>
  );
}
