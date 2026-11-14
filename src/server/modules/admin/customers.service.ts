import { z } from "zod";
import { connectDb } from "@/server/db/connect";
import { Customer, Order } from "@/server/models";

export async function listCustomers() {
  await connectDb();
  const rows = await Customer.find().sort({ createdAt: -1 }).limit(200).lean();
  const ids = rows.map((r) => String(r._id));
  const phones = rows.map((r) => r.phone).filter(Boolean);
  const orders = await Order.find({
    $or: [{ customerId: { $in: ids } }, { "shippingAddress.phone": { $in: phones } }],
  })
    .select("customerId shippingAddress.phone amounts.total")
    .lean();
  return rows.map((c) => {
    const id = String(c._id);
    const mine = orders.filter(
      (o) => o.customerId === id || (c.phone && (o as { shippingAddress?: { phone?: string } }).shippingAddress?.phone === c.phone),
    );
    const ltv = mine.reduce((s, o) => s + Number((o as { amounts?: { total?: number } }).amounts?.total || 0), 0);
    return {
      id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      locale: c.locale,
      rtoCount: c.rtoCount || 0,
      blockedAt: c.blockedAt,
      orders: mine.length,
      ltv,
    };
  });
}

export async function updateCustomer(id: string, raw: unknown) {
  await connectDb();
  const input = z
    .object({
      name: z.string().min(1),
      phone: z.string().min(10),
      email: z.string().email().optional().or(z.literal("")),
      locale: z.enum(["en", "ur"]).optional(),
      rtoCount: z.number().int().min(0).optional(),
    })
    .parse(raw);

  const customer = await Customer.findById(id);
  if (!customer) throw new Error("Customer not found");

  const phone = input.phone.trim();
  const email = (input.email || "").trim().toLowerCase();

  const phoneTaken = await Customer.findOne({ phone, _id: { $ne: id } });
  if (phoneTaken) throw new Error("That phone is already on another customer");
  if (email) {
    const emailTaken = await Customer.findOne({ email, _id: { $ne: id } });
    if (emailTaken) throw new Error("That email is already on another customer");
  }

  customer.name = input.name.trim();
  customer.phone = phone;
  customer.email = email || undefined;
  if (input.locale) customer.locale = input.locale;
  if (typeof input.rtoCount === "number") customer.rtoCount = input.rtoCount;
  await customer.save();

  return {
    id: String(customer._id),
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    locale: customer.locale,
    rtoCount: customer.rtoCount || 0,
  };
}

export async function setCustomerBlocked(id: string, blocked: boolean) {
  await connectDb();
  const customer = await Customer.findById(id);
  if (!customer) throw new Error("Customer not found");
  customer.blockedAt = blocked ? new Date() : undefined;
  await customer.save();
  return {
    id: String(customer._id),
    blockedAt: customer.blockedAt,
    phone: customer.phone,
  };
}
