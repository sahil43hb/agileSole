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
      <h1 className="text-2xl font-semibold">Orders</h1>
      <ul className="mt-6 divide-y divide-paper-line border-y border-paper-line">
        {orders.map((o) => (
          <li key={o._id} className="flex items-center justify-between py-3">
            <div>
              <Link href={`/account/orders/${o._id}`} className="font-medium">
                {o.number}
              </Link>
              <p className="text-sm text-ink-muted">{statusLabel(o.status, locale)}</p>
            </div>
            <p className="text-sm">{formatPkr(o.amounts?.total || 0)}</p>
          </li>
        ))}
      </ul>
      {!orders.length ? <p className="mt-6 text-sm text-ink-muted">No orders on this account yet.</p> : null}
    </AccountShell>
  );
}
