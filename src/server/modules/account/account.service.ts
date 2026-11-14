import { z } from "zod";
import { connectDb } from "@/server/db/connect";
import { Customer, Order, Review, Ticket } from "@/server/models";
import { asDoc } from "@/server/lib/lean";
import { normalizePkPhone } from "@/shared/phone";
import { addCartItem } from "@/server/modules/commerce/cart.service";
import { toCustomerOrder, trackGuestOrder, customerCancel, customerReturn } from "@/server/modules/commerce/order.service";

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  locale: z.enum(["en", "ur"]).optional(),
  preferredGender: z.enum(["men", "women", "kids", ""]).optional(),
  whatsappOptIn: z.boolean().optional(),
  marketingOptIn: z.boolean().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

const addressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2),
  phone: z.string().min(10),
  province: z.string().min(2),
  city: z.string().min(2),
  area: z.string().optional(),
  street: z.string().min(3),
  landmark: z.string().optional(),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

function publicCustomer(doc: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
}

export async function getCustomerById(id: string) {
  await connectDb();
  const row = asDoc(
    await Customer.findById(id).lean<{
      _id: { toString(): string };
      name?: string;
      phone?: string;
      email?: string;
      locale?: string;
      preferredGender?: string;
      whatsappOptIn?: boolean;
      marketingOptIn?: boolean;
      sessionEpoch?: number;
      addresses?: unknown[];
      dataRequestAt?: Date;
    } | null>(),
  );
  if (!row) return null;
  return {
    id: String((row._id as { toString(): string }).toString()),
    name: row.name || "",
    phone: row.phone || "",
    email: row.email || "",
    locale: row.locale || "en",
    preferredGender: row.preferredGender || "",
    whatsappOptIn: Boolean(row.whatsappOptIn),
    marketingOptIn: Boolean(row.marketingOptIn),
    sessionEpoch: row.sessionEpoch || 0,
    addresses: row.addresses || [],
    dataRequestAt: row.dataRequestAt,
  };
}

export async function updateProfile(customerId: string, raw: unknown) {
  await connectDb();
  const input = profileSchema.parse(raw);
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error("Account not found");
  if (input.name !== undefined) customer.name = input.name;
  if (input.locale) customer.locale = input.locale;
  if (input.preferredGender !== undefined) customer.preferredGender = input.preferredGender;
  if (input.whatsappOptIn !== undefined) customer.whatsappOptIn = input.whatsappOptIn;
  if (input.marketingOptIn !== undefined) customer.marketingOptIn = input.marketingOptIn;
  if (input.email !== undefined) customer.email = input.email || undefined;
  await customer.save();
  return getCustomerById(customerId);
}

export async function bumpSessionEpoch(customerId: string) {
  await connectDb();
  const customer = await Customer.findById(customerId);
  if (!customer) return;
  customer.sessionEpoch = (customer.sessionEpoch || 0) + 1;
  await customer.save();
}

export async function addAddress(customerId: string, raw: unknown) {
  await connectDb();
  const input = addressSchema.parse(raw);
  const phone = normalizePkPhone(input.phone);
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error("Account not found");
  if (input.isDefault) {
    for (const a of customer.addresses) a.isDefault = false;
  }
  customer.addresses.push({ ...input, phone });
  await customer.save();
  return getCustomerById(customerId);
}

export async function removeAddress(customerId: string, addressId: string) {
  await connectDb();
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error("Account not found");
  const next = customer.addresses.filter((a: { _id?: { toString(): string } }) => a._id?.toString() !== addressId);
  customer.addresses.splice(0, customer.addresses.length, ...next);
  await customer.save();
  return getCustomerById(customerId);
}

export async function listMyOrders(customerId: string, locale = "en") {
  await connectDb();
  const customer = await Customer.findById(customerId);
  if (!customer) return [];
  const filter: Record<string, unknown> = { $or: [{ customerId }] };
  if (customer.phone) filter.$or = [{ customerId }, { "shippingAddress.phone": customer.phone }];
  const rows = await Order.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  return rows.map((r) => toCustomerOrder(r as object, locale));
}

export async function getMyOrder(customerId: string, orderId: string, locale = "en") {
  const orders = await listMyOrders(customerId, locale);
  return orders.find((o) => String((o as { _id?: string })._id) === orderId || (o as { number?: string }).number === orderId) || null;
}

export async function requestCancel(customerId: string, orderId: string, reason: string) {
  return customerCancel(customerId, orderId, reason);
}

export async function requestReturn(customerId: string, orderId: string, reason: string) {
  return customerReturn(customerId, orderId, reason);
}

export async function reorder(customerId: string, orderId: string, guestId: string, locale = "en") {
  const order = await getMyOrder(customerId, orderId, locale);
  if (!order) throw new Error("Order not found");
  const items = ((order as { items?: { sku: string; qty: number }[] }).items || []) as { sku: string; qty: number }[];
  for (const item of items) {
    try {
      await addCartItem(guestId, item.sku, item.qty, locale);
    } catch {
      // skip unavailable
    }
  }
  return { ok: true as const, added: items.length };
}

export async function requestDataExport(customerId: string) {
  await connectDb();
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error("Account not found");
  customer.dataRequestAt = new Date();
  await customer.save();
  await Ticket.create({
    customerId,
    type: "data",
    reason: "Customer requested download/delete of personal data",
    status: "open",
  });
  return { ok: true as const };
}

export async function openTicket(customerId: string, raw: unknown) {
  await connectDb();
  const input = z
    .object({
      orderId: z.string().optional(),
      orderNumber: z.string().optional(),
      type: z.enum(["support", "exchange"]).default("support"),
      reason: z.string().min(3),
    })
    .parse(raw);
  const ticket = await Ticket.create({
    customerId,
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    type: input.type,
    reason: input.reason,
    status: "open",
  });
  return publicCustomer(ticket.toObject());
}

export async function listMyReviews(customerId: string) {
  await connectDb();
  const rows = await Review.find({ customerId }).sort({ createdAt: -1 }).limit(50).lean();
  return rows.map((r) => JSON.parse(JSON.stringify(r)));
}

export async function listTickets(status?: string) {
  await connectDb();
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  const rows = await Ticket.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  return rows.map((r) => JSON.parse(JSON.stringify(r)));
}

export async function getTicket(id: string) {
  await connectDb();
  const row = await Ticket.findById(id).lean();
  if (!row) throw new Error("Ticket not found");
  let customer: { id: string; name?: string; phone?: string; email?: string } | null = null;
  if (row.customerId) {
    const c = await Customer.findById(row.customerId).lean();
    if (c) {
      customer = {
        id: String(c._id),
        name: c.name,
        phone: c.phone,
        email: c.email,
      };
    }
  }
  return { ...JSON.parse(JSON.stringify(row)), customer };
}

export async function setTicketStatus(id: string, status: "open" | "accepted" | "closed") {
  await connectDb();
  const row = await Ticket.findByIdAndUpdate(id, { status }, { new: true });
  if (!row) throw new Error("Ticket not found");
  return JSON.parse(JSON.stringify(row));
}

export { trackGuestOrder };
