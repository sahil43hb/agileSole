import { connectDb } from "@/server/db/connect";
import { Customer, Discount, Order, Product, Ticket } from "@/server/models";
import { listInventory } from "@/server/modules/catalog/taxonomy.service";

function startDaysAgo(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
}

export async function salesReport(days = 7) {
  await connectDb();
  const start = startDaysAgo(days);
  const rows = await Order.find({ createdAt: { $gte: start } }).lean();
  const byDay: Record<string, { orders: number; revenue: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    byDay[d.toISOString().slice(0, 10)] = { orders: 0, revenue: 0 };
  }
  for (const o of rows) {
    const key = new Date(o.createdAt as Date).toISOString().slice(0, 10);
    if (!byDay[key]) byDay[key] = { orders: 0, revenue: 0 };
    byDay[key].orders += 1;
    byDay[key].revenue += Number(o.amounts?.total || 0);
  }
  return Object.entries(byDay).map(([date, v]) => ({ date, ...v }));
}

export async function ordersByStatus() {
  await connectDb();
  const rows = await Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$amounts.total" } } }]);
  return rows.map((r) => ({ status: r._id, count: r.count, revenue: r.revenue || 0 }));
}

export async function geoSales() {
  await connectDb();
  const rows = await Order.aggregate([
    { $group: { _id: { city: "$shippingAddress.city", province: "$shippingAddress.province" }, count: { $sum: 1 }, revenue: { $sum: "$amounts.total" } } },
    { $sort: { revenue: -1 } },
    { $limit: 30 },
  ]);
  return rows.map((r) => ({ city: r._id.city, province: r._id.province, count: r.count, revenue: r.revenue || 0 }));
}

export async function codReport() {
  await connectDb();
  const unpaid = await Order.aggregate([
    { $match: { "payment.method": "cod", "payment.status": { $ne: "paid" }, status: { $nin: ["cancelled"] } } },
    { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$payment.collectAmount" } } },
  ]);
  const paid = await Order.aggregate([
    { $match: { "payment.status": "paid" } },
    { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$payment.collectAmount" } } },
  ]);
  return {
    outstanding: unpaid[0] || { count: 0, amount: 0 },
    collected: paid[0] || { count: 0, amount: 0 },
  };
}

export async function productPerformance() {
  await connectDb();
  const rows = await Order.aggregate([
    { $unwind: "$items" },
    { $group: { _id: "$items.sku", title: { $first: "$items.title" }, units: { $sum: "$items.qty" }, revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } } } },
    { $sort: { units: -1 } },
    { $limit: 40 },
  ]);
  return rows.map((r) => ({ sku: r._id, title: r.title, units: r.units, revenue: r.revenue }));
}

export async function inventoryReport() {
  const rows = await listInventory();
  return rows.filter((r) => r.available <= 2);
}

export async function customerReport() {
  await connectDb();
  return {
    customers: await Customer.countDocuments(),
    blocked: await Customer.countDocuments({ blockedAt: { $ne: null } }),
    ticketsOpen: await Ticket.countDocuments({ status: "open" }),
    discounts: await Discount.countDocuments({ isActive: true }),
    products: await Product.countDocuments({ status: "active" }),
  };
}

const VOID_STATUSES = ["cancelled", "returned"];
const COLLECTED_STATUSES = ["delivered"];

type ProfitBasis = "sold" | "collected";

function matchesBasis(status: string, basis: ProfitBasis) {
  if (VOID_STATUSES.includes(status)) return false;
  if (basis === "collected") return COLLECTED_STATUSES.includes(status);
  return true;
}

async function costLookup() {
  const products = await Product.find({}, { "variants.sku": 1, "variants.cost": 1 }).lean();
  const map = new Map<string, number>();
  for (const p of products) {
    for (const v of (p.variants || []) as { sku?: string; cost?: number }[]) {
      if (v.sku) map.set(v.sku, Number(v.cost || 0));
    }
  }
  return map;
}

export async function profitReport(days = 30, basis: ProfitBasis = "sold") {
  await connectDb();
  const start = days > 0 ? startDaysAgo(days) : new Date(0);
  const orders = await Order.find({ createdAt: { $gte: start } }).lean();
  const costs = await costLookup();

  let ordersCount = 0;
  let units = 0;
  let grossSales = 0;
  let discounts = 0;
  let shipping = 0;
  let cogs = 0;
  let missingCost = 0;

  const bySku: Record<
    string,
    { sku: string; title: string; units: number; netSales: number; cogs: number; profit: number; missing: number }
  > = {};
  const byDay: Record<string, { date: string; orders: number; netSales: number; cogs: number; profit: number }> = {};

  if (days > 0) {
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = { date: key, orders: 0, netSales: 0, cogs: 0, profit: 0 };
    }
  }

  for (const order of orders) {
    const status = String(order.status || "");
    if (!matchesBasis(status, basis)) continue;
    ordersCount += 1;
    const items = (order.items || []) as { sku?: string; title?: string; qty?: number; price?: number; cost?: number }[];
    const lineGross = items.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0);
    const orderDiscount = Number(order.amounts?.discount || 0);
    shipping += Number(order.amounts?.shipping || 0);
    discounts += orderDiscount;
    const dayKey = new Date(order.createdAt as Date).toISOString().slice(0, 10);
    if (!byDay[dayKey]) byDay[dayKey] = { date: dayKey, orders: 0, netSales: 0, cogs: 0, profit: 0 };
    byDay[dayKey].orders += 1;

    for (const item of items) {
      const qty = Number(item.qty || 0);
      const price = Number(item.price || 0);
      const gross = price * qty;
      const share = lineGross > 0 ? gross / lineGross : 0;
      const net = Math.max(0, gross - orderDiscount * share);
      let cost = Number(item.cost || 0);
      if (!cost && item.sku) cost = costs.get(item.sku) || 0;
      if (!cost) missingCost += qty;
      const lineCogs = cost * qty;
      const profit = net - lineCogs;
      units += qty;
      grossSales += gross;
      cogs += lineCogs;
      const sku = item.sku || "unknown";
      if (!bySku[sku]) {
        bySku[sku] = { sku, title: item.title || sku, units: 0, netSales: 0, cogs: 0, profit: 0, missing: 0 };
      }
      bySku[sku].units += qty;
      bySku[sku].netSales += net;
      bySku[sku].cogs += lineCogs;
      bySku[sku].profit += profit;
      if (!cost) bySku[sku].missing += qty;
      byDay[dayKey].netSales += net;
      byDay[dayKey].cogs += lineCogs;
      byDay[dayKey].profit += profit;
    }
  }

  const netSales = Math.max(0, grossSales - discounts);
  const grossProfit = netSales - cogs;
  const margin = netSales > 0 ? Math.round((grossProfit / netSales) * 1000) / 10 : 0;

  const products = Object.values(bySku)
    .map((r) => ({
      ...r,
      netSales: Math.round(r.netSales),
      cogs: Math.round(r.cogs),
      profit: Math.round(r.profit),
      margin: r.netSales > 0 ? Math.round((r.profit / r.netSales) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 50);

  const daysRows = Object.values(byDay)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      ...r,
      netSales: Math.round(r.netSales),
      cogs: Math.round(r.cogs),
      profit: Math.round(r.profit),
      margin: r.netSales > 0 ? Math.round((r.profit / r.netSales) * 1000) / 10 : 0,
    }));

  return {
    summary: {
      basis,
      orders: ordersCount,
      units,
      grossSales: Math.round(grossSales),
      discounts: Math.round(discounts),
      netSales: Math.round(netSales),
      cogs: Math.round(cogs),
      shipping: Math.round(shipping),
      grossProfit: Math.round(grossProfit),
      margin,
      missingCost,
    },
    rows: products,
    days: daysRows,
  };
}

export async function reportPayload(type: string, extra?: { basis?: string; days?: number }) {
  if (type === "sales") return { rows: await salesReport(14) };
  if (type === "orders") return { rows: await ordersByStatus() };
  if (type === "geo") return { rows: await geoSales() };
  if (type === "cod") return { rows: [await codReport()] };
  if (type === "products") return { rows: await productPerformance() };
  if (type === "inventory") return { rows: await inventoryReport() };
  if (type === "customers") return { rows: [await customerReport()] };
  if (type === "profit") {
    const basis = extra?.basis === "collected" ? "collected" : "sold";
    const days = extra?.days && extra.days > 0 ? extra.days : 30;
    return profitReport(days, basis);
  }
  return { rows: await salesReport(7) };
}

export function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "empty\n";
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(",")];
  for (const row of rows) {
    lines.push(keys.map((k) => JSON.stringify(row[k] ?? "")).join(","));
  }
  return lines.join("\n");
}
