import { dashboardSnapshot } from "@/server/modules/admin/dashboard.service";
import Link from "next/link";
import { formatPkr } from "@/shared/money";
import {
  Clock,
  PackageCheck,
  Box,
  Truck,
  AlertTriangle,
  LifeBuoy,
  Warehouse,
  Users,
  ShoppingBag,
  Wallet,
  Banknote,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  let snapshot: Awaited<ReturnType<typeof dashboardSnapshot>> | null = null;
  try {
    snapshot = await dashboardSnapshot();
  } catch {
    snapshot = null;
  }

  const cards = [
    { label: "Pending confirmation", value: snapshot?.pendingConfirmation ?? 0, href: "/admin/orders", icon: Clock, tone: "text-amber-700 bg-amber-50" },
    { label: "To pack", value: snapshot?.confirmed ?? 0, href: "/admin/orders", icon: PackageCheck, tone: "text-brand-dark bg-brand-mist" },
    { label: "Packed", value: snapshot?.packed ?? 0, href: "/admin/orders", icon: Box, tone: "text-sky-700 bg-sky-50" },
    { label: "In transit", value: snapshot?.shipped ?? 0, href: "/admin/orders", icon: Truck, tone: "text-indigo-700 bg-indigo-50" },
    { label: "Failed delivery", value: snapshot?.failed ?? 0, href: "/admin/orders", icon: AlertTriangle, tone: "text-red-700 bg-red-50" },
    { label: "Open tickets", value: snapshot?.ticketsOpen ?? 0, href: "/admin/tickets", icon: LifeBuoy, tone: "text-orange-700 bg-orange-50" },
    { label: "Low stock SKUs", value: snapshot?.lowStock ?? 0, href: "/admin/inventory", icon: Warehouse, tone: "text-ink bg-[#f4f7f5]" },
    { label: "Customers", value: snapshot?.customers ?? 0, href: "/admin/customers", icon: Users, tone: "text-brand-dark bg-brand-mist" },
    { label: "Today orders", value: snapshot?.todayOrders ?? 0, href: "/admin/orders", icon: ShoppingBag, tone: "text-brand-dark bg-brand-mist" },
  ];

  const maxRevenue = Math.max(1, ...(snapshot?.sales?.map((d) => d.revenue) || [1]));

  return (
    <div className="space-y-8">
      <div>
        <h1>Overview</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          {snapshot?.note || "Database unavailable"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-ink-faint">
            <Wallet className="h-4 w-4" />
            <p className="text-[11px] font-medium uppercase tracking-[0.14em]">COD outstanding</p>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{formatPkr(snapshot?.outstandingCod || 0)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-ink-faint">
            <Banknote className="h-4 w-4" />
            <p className="text-[11px] font-medium uppercase tracking-[0.14em]">COD collected</p>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{formatPkr(snapshot?.collectedCod || 0)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">{card.label}</p>
                <span className={`rounded-xl p-2 ${card.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight">{card.value}</p>
            </Link>
          );
        })}
      </div>

      {snapshot?.sales?.length ? (
        <div className="rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight">Last 7 days</h2>
          <div className="mt-5 space-y-3">
            {snapshot.sales.map((d) => (
              <div key={d.date} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-sm">
                <p className="text-ink-muted">{d.date}</p>
                <div className="h-2 overflow-hidden rounded-full bg-[#eef2ef]">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.max(6, (d.revenue / maxRevenue) * 100)}%` }}
                  />
                </div>
                <p className="text-end font-medium">
                  {d.orders} · {formatPkr(d.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
