"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { formatPkr } from "@/shared/money";
import { AdminPageHeader, EmptyNote, StatusBadge } from "@/components/admin/ui";

const TYPES = [
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
};

function cell(key: string, value: unknown) {
  if (value == null) return "—";
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if ("amount" in o && "count" in o) return `${o.count} · ${formatPkr(Number(o.amount || 0))}`;
    return JSON.stringify(value);
  }
  if ((key === "revenue" || key === "amount") && typeof value === "number") return formatPkr(value);
  if (key === "status") return <StatusBadge value={String(value)} />;
  return String(value);
}

export default function ReportsPage() {
  const [type, setType] = useState("sales");
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/admin/reports?type=${type}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setRows((j.data.rows || []) as Array<Record<string, unknown>>);
        setLoading(false);
      });
  }, [type]);

  const keys = rows[0] ? Object.keys(rows[0]).filter((k) => k !== "_id") : [];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Reports"
        description="Sales, COD, stock, and customers — download any view as CSV."
        actions={
          <a
            href={`/api/v1/admin/reports?type=${type}&format=csv`}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[var(--admin-line)] bg-white px-4 text-sm"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </a>
        }
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
      {loading ? (
        <EmptyNote>Loading report…</EmptyNote>
      ) : !rows.length ? (
        <EmptyNote>No rows in this report.</EmptyNote>
      ) : (
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
      )}
    </div>
  );
}
