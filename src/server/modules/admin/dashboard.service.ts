import { connectDb } from "@/server/db/connect";
import { Brand, Category, Customer, Product, Staff, Ticket } from "@/server/models";
import { orderCounts } from "@/server/modules/commerce/order.service";
import { listInventory } from "@/server/modules/catalog/taxonomy.service";
import { salesReport, codReport, profitReport } from "@/server/modules/admin/reports.service";

export async function dashboardSnapshot() {
  await connectDb();
  const [products, activeProducts, categories, brands, customers, staff, counts, ticketsOpen, sales, cod, inventory, profit] =
    await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: "active" }),
      Category.countDocuments({ isActive: true }),
      Brand.countDocuments({ isActive: true }),
      Customer.countDocuments(),
      Staff.countDocuments({ isActive: true }),
      orderCounts(),
      Ticket.countDocuments({ status: "open" }),
      salesReport(7),
      codReport(),
      listInventory(),
      profitReport(7, "sold"),
    ]);

  const lowStock = inventory.filter((r) => r.available <= 2).length;

  return {
    products,
    activeProducts,
    categories,
    brands,
    customers,
    staff,
    pendingConfirmation: counts.pendingConfirmation,
    confirmed: counts.confirmed,
    todayOrders: counts.todayOrders,
    packed: counts.packed,
    shipped: counts.shipped,
    failed: counts.failed,
    returned: counts.returned,
    ticketsOpen,
    lowStock,
    sales,
    outstandingCod: Number((cod.outstanding as { amount?: number }).amount || 0),
    collectedCod: Number((cod.collected as { amount?: number }).amount || 0),
    profit7d: profit.summary.grossProfit,
    profitMargin7d: profit.summary.margin,
    note: "Pack confirmed orders, add a CN before shipping, collect COD on delivery.",
  };
}
