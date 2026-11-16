"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { formatPkr } from "@/shared/money";
import { AdminHeaderAction, AdminPageHeader, AdminTable, EmptyNote, StatusBadge } from "@/components/admin/ui";

const TYPES = [
  { id: "profit", label: "Profit" },
  { id: "sales", label: "Sales" },
  { id: "orders", label: "Orders" },
  { id: "geo", label: "Cities" },
  { id: "cod", label: "COD" },
  { id: "products", label: "Products" },
  { id: "inventory", label: "Low stock" },
  { id: "customers", label: "Customers" },
];

const LABELS: Record<string, string> = {
  date: "Date",
  orders: "Orders",
  revenue: "Revenue",
  status: "Status",
  count: "Count",
  city: "City",
  province: "Province",
  sku: "SKU",
  title: "Product",
  units: "Units",
  productTitle: "Product",
  available: "Available",
  onHand: "On hand",
  reserved: "Reserved",
  color: "Color",
  sizeEu: "EU",
  customers: "Customers",
  blocked: "Blocked",
  ticketsOpen: "Open tickets",
  discounts: "Active codes",
  products: "Active products",
  outstanding: "Outstanding COD",
  collected: "Collected COD",
  amount: "Amount",
  netSales: "Net sales",
  cogs: "Cost",
  profit: "Profit",
  margin: "Margin",
  missing: "No cost",
};

type ProfitSummary = {
  orders: number;
  units: number;
  grossSales: number;
  discounts: number;
  netSales: number;
  cogs: number;
  shipping: number;
  grossProfit: number;
  margin: number;
  missingCost: number;
};

type ProfitRow = {
  sku: string;
  title: string;
  units: number;
  netSales: number;
  cogs: number;
  profit: number;
  margin: number;
  missing: number;
};

function cell(key: string, value: unknown) {
  if (value == null) return "—";
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if ("amount" in o && "count" in o) return `${o.count} · ${formatPkr(Number(o.amount || 0))}`;
    return JSON.stringify(value);
  }
  if ((key === "revenue" || key === "amount" || key === "netSales" || key === "cogs" || key === "profit") && typeof value === "number") {
    return formatPkr(value);
  }
  if (key === "margin" && typeof value === "number") return `${value}%`;
  if (key === "status") return <StatusBadge value={String(value)} />;
  return String(value);
}

export default function ReportsPage() {
  const [type, setType] = useState("profit");
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [profit, setProfit] = useState<{ summary: ProfitSummary; rows: ProfitRow[]; days: Record<string, unknown>[] } | null>(null);
  const [basis, setBasis] = useState("sold");
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs =
      type === "profit"
        ? `/api/v1/admin/reports?type=profit&basis=${basis}&days=${days}`
        : `/api/v1/admin/reports?type=${type}`;
    fetch(qs)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          if (type === "profit") {
            setProfit({
              summary: j.data.summary,
              rows: j.data.rows || [],
              days: j.data.days || [],
            });
            setRows([]);
          } else {
            setProfit(null);
            setRows((j.data.rows || []) as Array<Record<string, unknown>>);
          }
        }
        setLoading(false);
      });
  }, [type, basis, days]);

  const keys = rows[0] ? Object.keys(rows[0]).filter((k) => k !== "_id") : [];
  const csvHref =
    type === "profit"
      ? `/api/v1/admin/reports?type=profit&basis=${basis}&days=${days}&format=csv`
      : `/api/v1/admin/reports?type=${type}&format=csv`;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Reports"
        description="Profit uses selling price minus supplier cost. Cancelled and returned orders are excluded."
        actions={<AdminHeaderAction icon={Download} label="Download CSV" href={csvHref} variant="secondary" />}
      />
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--admin-line)] bg-white p-3 shadow-sm">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm ${type === t.id ? "bg-ink text-white" : "border border-[var(--admin-line)] bg-white text-ink-muted"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {type === "profit" ? (
        <ProfitView
          loading={loading}
          data={profit}
          basis={basis}
          days={days}
          onBasis={setBasis}
          onDays={setDays}
        />
      ) : loading ? (
        <EmptyNote>Loading report…</EmptyNote>
      ) : !rows.length ? (
        <EmptyNote>No rows in this report.</EmptyNote>
      ) : (
        <AdminTable>
        <table>
          <thead>
            <tr>
              {keys.map((k) => (
                <th key={k}>{LABELS[k] || k.replaceAll("_", " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {keys.map((k) => (
                  <td key={k}>{cell(k, row[k])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </AdminTable>
      )}
    </div>
  );
}

function ProfitView({
  loading,
  data,
  basis,
  days,
  onBasis,
  onDays,
}: {
  loading: boolean;
  data: { summary: ProfitSummary; rows: ProfitRow[]; days: Record<string, unknown>[] } | null;
  basis: string;
  days: string;
  onBasis: (v: string) => void;
  onDays: (v: string) => void;
}) {
  if (loading || !data) return <EmptyNote>Loading profit…</EmptyNote>;
  const s = data.summary;
  const cards = [
    { label: "Net sales", value: formatPkr(s.netSales), hint: `${s.orders} orders · ${s.units} pairs` },
    { label: "Cost of goods", value: formatPkr(s.cogs), hint: "Supplier cost on sold pairs" },
    { label: "Gross profit", value: formatPkr(s.grossProfit), hint: `${s.margin}% margin` },
    { label: "Discounts", value: formatPkr(s.discounts), hint: s.shipping ? `Shipping ${formatPkr(s.shipping)} not in profit` : "Promo codes" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onBasis("sold")}
          className={`rounded-full px-3.5 py-1.5 text-sm ${basis === "sold" ? "bg-brand-mist text-brand-dark" : "border border-[var(--admin-line)] bg-white text-ink-muted"}`}
        >
          Sold (not cancelled)
        </button>
        <button
          type="button"
          onClick={() => onBasis("collected")}
          className={`rounded-full px-3.5 py-1.5 text-sm ${basis === "collected" ? "bg-brand-mist text-brand-dark" : "border border-[var(--admin-line)] bg-white text-ink-muted"}`}
        >
          Collected (delivered)
        </button>
        {["7", "30", "90"].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onDays(d)}
            className={`rounded-full px-3.5 py-1.5 text-sm ${days === d ? "bg-ink text-white" : "border border-[var(--admin-line)] bg-white text-ink-muted"}`}
          >
            {d} days
          </button>
        ))}
      </div>
      {s.missingCost ? (
        <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          {s.missingCost} sold units have no cost. Add cost on the product to complete this report.
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{c.value}</p>
            <p className="mt-1 text-xs text-ink-muted">{c.hint}</p>
          </div>
        ))}
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold">By product</h2>
        {data.rows.length ? (
          <AdminTable>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Units</th>
                <th>Net sales</th>
                <th>Cost</th>
                <th>Profit</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.sku}>
                  <td>{r.title}</td>
                  <td className="text-ink-muted">{r.sku}</td>
                  <td>{r.units}</td>
                  <td>{formatPkr(r.netSales)}</td>
                  <td>{formatPkr(r.cogs)}</td>
                  <td className={r.profit < 0 ? "text-red-700" : ""}>{formatPkr(r.profit)}</td>
                  <td>{r.margin}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          </AdminTable>
        ) : (
          <EmptyNote>No sold pairs in this window. Add cost on products, then place orders.</EmptyNote>
        )}
      </div>
      {data.days.length ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold">By day</h2>
          <AdminTable>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Orders</th>
                <th>Net sales</th>
                <th>Cost</th>
                <th>Profit</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {data.days.map((r) => (
                <tr key={String(r.date)}>
                  <td>{String(r.date)}</td>
                  <td>{String(r.orders)}</td>
                  <td>{formatPkr(Number(r.netSales || 0))}</td>
                  <td>{formatPkr(Number(r.cogs || 0))}</td>
                  <td>{formatPkr(Number(r.profit || 0))}</td>
                  <td>{Number(r.margin || 0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          </AdminTable>
        </div>
      ) : null}
    </div>
  );
}
