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
import { useLocale, useTranslations } from "next-intl";

type Me = {
  customer: { name: string; phone: string; email: string; addresses?: unknown[] };
  lastOrder: { _id: string; number: string; status: string; amounts: { total: number } } | null;
  orderCount: number;
};

export default function AccountHomePage() {
  const { customer } = useAuth();
  const { count } = useWishlist();
  const locale = useLocale();
  const t = useTranslations("account");
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/v1/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => j.ok && setMe(j.data));
  }, [customer]);

  const stats = [
    { href: "/account/orders", label: t("orders"), value: me?.orderCount ?? "—", icon: Package },
    { href: "/wishlist", label: t("wishlist"), value: count, icon: Heart },
    { href: "/account/addresses", label: t("addresses"), value: me?.customer.addresses?.length ?? 0, icon: MapPin },
  ];

  return (
    <AccountShell>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-dark">{t("kicker")}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t("hi", { name: customerFirstName(customer?.name) })}</h1>
      <p className="mt-1 text-sm text-ink-muted">{t("overviewHint")}</p>

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
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">{t("latestOrder")}</p>
            <p className="mt-1 font-semibold">{me.lastOrder.number}</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {statusLabel(me.lastOrder.status, locale)} · {formatPkr(me.lastOrder.amounts.total)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark">
            {t("viewTimeline")}
            <ChevronRight className="h-4 w-4" />
          </span>
        </Link>
      ) : (
        <div className="mt-6 rounded-[1.35rem] bg-white p-5 text-sm text-ink-muted ring-1 ring-black/[0.04]">
          {t("noOrders")}
        </div>
      )}
    </AccountShell>
  );
}
