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

export async function reportPayload(type: string) {
  if (type === "sales") return { rows: await salesReport(14) };
  if (type === "orders") return { rows: await ordersByStatus() };
  if (type === "geo") return { rows: await geoSales() };
  if (type === "cod") return { rows: [await codReport()] };
  if (type === "products") return { rows: await productPerformance() };
  if (type === "inventory") return { rows: await inventoryReport() };
  if (type === "customers") return { rows: [await customerReport()] };
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
