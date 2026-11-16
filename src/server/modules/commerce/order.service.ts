import { connectDb } from "@/server/db/connect";
import { Cart, Customer, Order, Product, Ticket } from "@/server/models";
import { bumpDiscountUse } from "./discount.service";
import { nextOrderNumber } from "@/server/models/counter";
import { asDoc } from "@/server/lib/lean";
import { GEO_PK, SHIPPING_DEFAULT } from "@/content/geo-pk";
import { normalizePkPhone } from "@/shared/phone";
import { consumeCheckoutOtp } from "@/server/modules/auth/customer-otp.service";
import { getCart, hydrateSku, clearCart } from "./cart.service";
import type { OrderStatus } from "@/shared/constants";
import { CUSTOMER_CANCEL_STATUSES, CUSTOMER_RETURN_STATUSES, timelineFor } from "@/shared/order-copy";
import { z } from "zod";

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  altPhone: z.string().optional(),
  country: z.string().default("PK"),
  province: z.string().min(2),
  city: z.string().min(2),
  area: z.string().optional(),
  street: z.string().min(3),
  landmark: z.string().optional(),
  postalCode: z.string().optional(),
});

export const placeInput = z.object({
  locale: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  deliveryInstructions: z.string().optional(),
  callBeforeDelivery: z.boolean().optional(),
  whatsappOptIn: z.boolean().optional(),
  acceptTerms: z.literal(true),
  otp: z.string().min(4),
  idempotencyKey: z.string().min(8),
  address: addressSchema,
});

export function geoPayload() {
  return {
    country: "PK",
    provinces: GEO_PK.map((p) => ({
      name: p.province,
      cities: [...p.cities],
    })),
    shipping: SHIPPING_DEFAULT,
  };
}

function assertCity(province: string, city: string) {
  const row = GEO_PK.find((p) => p.province === province);
  if (!row) throw new Error("Choose a province from the list");
  if (!(row.cities as readonly string[]).includes(city)) {
    throw new Error("Choose a city we deliver to");
  }
}

async function reserveSku(sku: string, qty: number) {
  const product = await Product.findOne({ "variants.sku": sku });
  if (!product) throw new Error("SKU not found");
  const variant = product.variants.find((v: { sku: string }) => v.sku === sku);
  if (!variant || variant.isActive === false) throw new Error("SKU not found");
  const available = Math.max(0, (variant.onHand || 0) - (variant.reserved || 0));
  if (available < qty) throw new Error(`Only ${available} left for ${sku}`);
  variant.reserved = (variant.reserved || 0) + qty;
  await product.save();
}

async function releaseSku(sku: string, qty: number) {
  const product = await Product.findOne({ "variants.sku": sku });
  if (!product) return;
  const variant = product.variants.find((v: { sku: string }) => v.sku === sku);
  if (!variant) return;
  variant.reserved = Math.max(0, (variant.reserved || 0) - qty);
  await product.save();
}

async function commitSku(sku: string, qty: number) {
  const product = await Product.findOne({ "variants.sku": sku });
  if (!product) return;
  const variant = product.variants.find((v: { sku: string }) => v.sku === sku);
  if (!variant) return;
  variant.reserved = Math.max(0, (variant.reserved || 0) - qty);
  variant.onHand = Math.max(0, (variant.onHand || 0) - qty);
  await product.save();
}

async function restockSku(sku: string, qty: number) {
  const product = await Product.findOne({ "variants.sku": sku });
  if (!product) return;
  const variant = product.variants.find((v: { sku: string }) => v.sku === sku);
  if (!variant) return;
  variant.onHand = (variant.onHand || 0) + qty;
  await product.save();
}

async function buildLines(guestId: string, locale: string) {
  const cart = await getCart(guestId, locale);
  if (!cart.lines.length) throw new Error("Your bag is empty");
  for (const line of cart.lines) {
    const live = await hydrateSku(line.sku, locale);
    if (!live || live.available < line.qty) {
      throw new Error(`${line.title} EU ${line.sizeEu || ""} is no longer in stock`);
    }
  }
  return cart;
}

export async function placeOrder(guestId: string, raw: unknown, opts?: { skipOtp?: boolean; channel?: string; actorId?: string }) {
  await connectDb();
  const input = opts?.skipOtp
    ? placeInput.omit({ otp: true, acceptTerms: true, idempotencyKey: true }).extend({
        acceptTerms: z.boolean().optional(),
        otp: z.string().optional(),
        idempotencyKey: z.string().optional(),
      }).parse(raw)
    : placeInput.parse(raw);

  const phone = normalizePkPhone(input.address.phone);
  assertCity(input.address.province, input.address.city);

  if (!opts?.skipOtp) {
    const otp = await consumeCheckoutOtp(phone, input.otp || "");
    if (!otp.ok) throw new Error("OTP is invalid or expired. Request a new code.");
  }

  if (input.idempotencyKey) {
    const existing = asDoc(await Order.findOne({ idempotencyKey: input.idempotencyKey }).lean());
    if (existing) return toPublic(existing);
  }

  const customerBlocked = await Customer.findOne({ phone, blockedAt: { $ne: null } });
  if (customerBlocked) throw new Error("This phone cannot place orders. Contact the shop.");

  const cart = await buildLines(guestId, input.locale || "en");
  const subtotal = cart.subtotal;
  const shipping = cart.shipping;
  const discount = cart.discount || 0;
  const total = cart.total;

  for (const line of cart.lines) {
    await reserveSku(line.sku, line.qty);
  }

  let customer = await Customer.findOne({ phone });
  if (!customer) {
    customer = await Customer.create({
      phone,
      phoneVerifiedAt: new Date(),
      name: input.address.fullName,
      email: input.email || undefined,
      locale: input.locale === "ur" ? "ur" : "en",
      whatsappOptIn: Boolean(input.whatsappOptIn),
    });
  }

  const number = await nextOrderNumber();
  const order = await Order.create({
    number,
    guestId,
    customerId: String(customer._id),
    status: "pending_confirmation",
    channel: opts?.channel || "web",
    locale: input.locale || "en",
    items: cart.lines.map((l) => ({
      sku: l.sku,
      slug: l.slug,
      title: l.title,
      color: l.color,
      sizeEu: l.sizeEu,
      qty: l.qty,
      price: l.price,
      cost: l.cost || 0,
      image: l.image,
    })),
    amounts: { subtotal, shipping, discount, tax: 0, total, currency: "PKR" },
    discountCode: cart.promoCode || "",
    shippingAddress: { ...input.address, phone, country: "PK" },
    shippingMethod: {
      id: SHIPPING_DEFAULT.id,
      name: SHIPPING_DEFAULT.name,
      fee: shipping,
      eta: SHIPPING_DEFAULT.eta,
    },
    payment: { method: "cod", status: "unpaid", collectAmount: total },
    notes: input.notes,
    deliveryInstructions: input.deliveryInstructions,
    callBeforeDelivery: Boolean(input.callBeforeDelivery),
    whatsappOptIn: Boolean(input.whatsappOptIn),
    email: input.email || "",
    idempotencyKey: input.idempotencyKey,
    events: [
      {
        from: "draft",
        to: "pending_confirmation",
        actorType: opts?.channel && opts.channel !== "web" ? "staff" : "customer",
        actorId: opts?.actorId || guestId,
        note: "COD order placed",
        customerVisible: true,
        at: new Date(),
      },
    ],
  });

  await bumpDiscountUse(cart.promoCode);
  await clearCart(guestId);
  console.info(`[order] ${number} COD ${total} PKR pending confirmation`);
  const publicOrder = toPublic(order.toObject());
  try {
    const { notifyOrder } = await import("@/server/modules/notify/notify.service");
    await notifyOrder(publicOrder as Parameters<typeof notifyOrder>[0], "order_placed");
    const { notifyAdminOrderPlaced, notifyAdminLowStock } = await import("@/server/modules/admin/admin-notice.service");
    notifyAdminOrderPlaced(publicOrder as Parameters<typeof notifyAdminOrderPlaced>[0]);
    for (const line of cart.lines) {
      const live = await hydrateSku(line.sku, input.locale || "en");
      if (live && live.available <= 2) {
        notifyAdminLowStock({ sku: line.sku, title: live.title, available: live.available });
      }
    }
  } catch (err) {
    console.error(err);
  }
  return publicOrder;
}

export async function placeManualOrder(staffId: string, raw: unknown) {
  await connectDb();
  const input = z
    .object({
      fullName: z.string().min(2),
      phone: z.string().min(10),
      province: z.string().min(2),
      city: z.string().min(2),
      street: z.string().min(3),
      sku: z.string().min(1),
      qty: z.number().int().min(1),
      notes: z.string().optional(),
      channel: z.enum(["admin_manual", "facebook"]).default("admin_manual"),
    })
    .parse(raw);
  const phone = normalizePkPhone(input.phone);
  const guestId = `manual-${staffId}`;
  await Cart.deleteMany({ guestId });
  const { setCartItem } = await import("./cart.service");
  await setCartItem(guestId, input.sku, input.qty, "en");
  return placeOrder(
    guestId,
    {
      locale: "en",
      acceptTerms: true,
      address: {
        fullName: input.fullName,
        phone,
        country: "PK",
        province: input.province,
        city: input.city,
        street: input.street,
      },
      notes: input.notes,
    },
    { skipOtp: true, channel: input.channel, actorId: staffId },
  );
}

function toPublic(doc: Record<string, unknown> | object) {
  const row = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
  return row;
}

export async function getOrderByNumber(number: string, guestId?: string) {
  await connectDb();
  const filter: Record<string, unknown> = { number };
  if (guestId) filter.guestId = guestId;
  const row = asDoc(await Order.findOne(filter).lean());
  return row ? toPublic(row) : null;
}

const STATUS_GROUPS: Record<string, string[]> = {
  needs_action: ["pending_confirmation", "unreachable", "on_hold", "delivery_failed"],
  fulfillment: ["confirmed", "packed", "pickup_ready", "shipped", "out_for_delivery"],
  closed: ["delivered", "returned", "cancelled"],
};

export async function listOrders(status?: string, q?: string, extra?: { channel?: string; from?: string }) {
  await connectDb();
  const filter: Record<string, unknown> = {};
  const statuses = (status || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((s) => STATUS_GROUPS[s] || [s]);
  if (statuses.length === 1) filter.status = statuses[0];
  else if (statuses.length > 1) filter.status = { $in: [...new Set(statuses)] };
  const channels = (extra?.channel || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (channels.length === 1) filter.channel = channels[0];
  else if (channels.length > 1) filter.channel = { $in: channels };
  if (extra?.from) filter.createdAt = { $gte: new Date(extra.from) };
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { number: rx },
      { "shippingAddress.phone": rx },
      { "shippingAddress.fullName": rx },
      { "shipment.trackingNumber": rx },
      { email: rx },
    ];
  }
  const rows = await Order.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  return rows.map((r) => {
    const row = toPublic(r as object) as Record<string, unknown>;
    const total = Number((row.amounts as { total?: number } | undefined)?.total || 0);
    const flags: string[] = [];
    if (total >= 15000) flags.push("high_value");
    row.riskFlags = flags;
    return row;
  });
}

export async function getOrderById(id: string) {
  await connectDb();
  const row = asDoc(await Order.findById(id).lean());
  return row ? toPublic(row) : null;
}

const ALLOWED: Record<string, OrderStatus[]> = {
  pending_confirmation: ["confirmed", "cancelled", "unreachable", "on_hold"],
  unreachable: ["confirmed", "cancelled", "on_hold"],
  on_hold: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled", "on_hold"],
  packed: ["shipped", "pickup_ready", "cancelled"],
  pickup_ready: ["delivered", "cancelled"],
  shipped: ["out_for_delivery", "delivery_failed", "delivered", "returned"],
  out_for_delivery: ["delivered", "delivery_failed"],
  delivery_failed: ["out_for_delivery", "returned", "cancelled"],
  delivered: ["returned"],
};

export async function transitionOrder(
  id: string,
  to: OrderStatus,
  actorId: string,
  note?: string,
  actorType: "staff" | "customer" = "staff",
) {
  await connectDb();
  const order = await Order.findById(id);
  if (!order) throw new Error("Order not found");
  const allowed = ALLOWED[order.status] || [];
  if (!allowed.includes(to)) {
    throw new Error(`Cannot move ${order.status} to ${to}`);
  }
  const from = order.status;
  if (to === "shipped" && !order.shipment?.trackingNumber) {
    throw new Error("Add a consignment / tracking number before shipping");
  }
  if (to === "packed" && !order.stockCommitted) {
    for (const item of order.items) {
      if (item.sku && item.qty) await commitSku(item.sku, item.qty);
    }
    order.stockCommitted = true;
  }
  if (to === "cancelled" && !order.stockCommitted) {
    for (const item of order.items) {
      if (item.sku && item.qty) await releaseSku(item.sku, item.qty);
    }
  }
  if ((to === "cancelled" || to === "returned") && order.stockCommitted && !order.stockRestocked) {
    for (const item of order.items) {
      if (item.sku && item.qty) await restockSku(item.sku, item.qty);
    }
    order.stockRestocked = true;
  }
  if (to === "delivery_failed") {
    order.deliveryAttempts = (order.deliveryAttempts || 0) + 1;
    if (order.customerId) {
      await Customer.updateOne({ _id: order.customerId }, { $inc: { rtoCount: 1 } });
    }
  }
  if (to === "delivered") {
    order.payment.status = order.payment.status || "unpaid";
  }
  order.status = to;
  order.events.push({
    from,
    to,
    actorType,
    actorId,
    note: note || `Moved to ${to}`,
    customerVisible: true,
    at: new Date(),
  });
  await order.save();
  const publicOrder = toPublic(order.toObject());
  try {
    const { notifyOrder } = await import("@/server/modules/notify/notify.service");
    await notifyOrder(publicOrder as Parameters<typeof notifyOrder>[0]);
    if (to === "cancelled" && actorType === "customer") {
      const { notifyAdminOrderCancelled } = await import("@/server/modules/admin/admin-notice.service");
      notifyAdminOrderCancelled(publicOrder as Parameters<typeof notifyAdminOrderCancelled>[0], note);
    }
    const { writeAudit } = await import("@/server/modules/admin/audit.service");
    await writeAudit({
      actorId,
      action: `order.${to}`,
      entity: "order",
      entityId: String(order._id),
      note: note || `${from} → ${to}`,
    });
  } catch (err) {
    console.error(err);
  }
  return publicOrder;
}

export function toCustomerOrder(doc: Record<string, unknown> | object, locale = "en") {
  const row = toPublic(doc) as Record<string, unknown>;
  const events = Array.isArray(row.events)
    ? (row.events as Array<Record<string, unknown>>).filter((e) => e.customerVisible !== false)
    : [];
  return {
    ...row,
    events,
    timeline: timelineFor(String(row.status || "")),
    locale,
  };
}

export async function trackGuestOrder(number: string, phoneRaw: string, locale = "en") {
  await connectDb();
  const phone = normalizePkPhone(phoneRaw);
  const row = asDoc(await Order.findOne({ number: number.trim().toUpperCase() }).lean());
  if (!row) return null;
  const orderPhone = String((row as { shippingAddress?: { phone?: string } }).shippingAddress?.phone || "");
  if (orderPhone !== phone) return null;
  return toCustomerOrder(row, locale);
}

function ownsOrder(order: { customerId?: string; shippingAddress?: { phone?: string } }, customer: { id: string; phone?: string }) {
  if (order.customerId && order.customerId === customer.id) return true;
  if (customer.phone && order.shippingAddress?.phone === customer.phone) return true;
  return false;
}

export async function customerCancel(customerId: string, orderId: string, reason: string) {
  await connectDb();
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error("Account not found");
  const order = (await Order.findById(orderId)) || (await Order.findOne({ number: orderId }));
  if (!order) throw new Error("Order not found");
  if (!ownsOrder(order, { id: customerId, phone: customer.phone })) throw new Error("Order not found");
  const allowed = (CUSTOMER_CANCEL_STATUSES as readonly string[]).includes(order.status);
  const cancelTicket = await Ticket.create({
    customerId,
    orderId: String(order._id),
    orderNumber: order.number,
    type: "cancel",
    reason: reason || "Customer requested cancel",
    status: allowed ? "accepted" : "open",
  });
  order.customerCancelRequestedAt = new Date();
  await order.save();
  if (!allowed) {
    const { notifyAdminTicket } = await import("@/server/modules/admin/admin-notice.service");
    notifyAdminTicket(cancelTicket.toObject());
    throw new Error("This order can no longer be cancelled online. We logged a request for staff.");
  }
  return transitionOrder(String(order._id), "cancelled", customerId, reason || "Cancelled by customer", "customer");
}

export async function customerReturn(customerId: string, orderId: string, reason: string) {
  await connectDb();
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error("Account not found");
  const order = (await Order.findById(orderId)) || (await Order.findOne({ number: orderId }));
  if (!order) throw new Error("Order not found");
  if (!ownsOrder(order, { id: customerId, phone: customer.phone })) throw new Error("Order not found");
  if (!(CUSTOMER_RETURN_STATUSES as readonly string[]).includes(order.status)) {
    throw new Error("Returns open after delivery");
  }
  order.customerReturnRequestedAt = new Date();
  order.events.push({
    from: order.status,
    to: order.status,
    actorType: "customer",
    actorId: customerId,
    note: reason || "Return requested",
    customerVisible: true,
    at: new Date(),
  });
  await order.save();
  await Ticket.create({
    customerId,
    orderId: String(order._id),
    orderNumber: order.number,
    type: "return",
    reason: reason || "Return / exchange",
    status: "open",
  });
  const { notifyAdminOrderReturn } = await import("@/server/modules/admin/admin-notice.service");
  notifyAdminOrderReturn(order.toObject(), reason);
  return toCustomerOrder(order.toObject());
}

export async function updateShipment(
  id: string,
  input: { courierName?: string; trackingNumber?: string; trackingUrl?: string },
) {
  await connectDb();
  const order = await Order.findById(id);
  if (!order) throw new Error("Order not found");
  order.shipment = {
    courierName: input.courierName || order.shipment?.courierName,
    trackingNumber: input.trackingNumber || order.shipment?.trackingNumber,
    trackingUrl: input.trackingUrl || order.shipment?.trackingUrl,
  };
  await order.save();
  return toPublic(order.toObject());
}

export async function orderCounts() {
  await connectDb();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [pendingConfirmation, confirmed, todayOrders, packed, shipped, failed, returned] = await Promise.all([
    Order.countDocuments({ status: "pending_confirmation" }),
    Order.countDocuments({ status: "confirmed" }),
    Order.countDocuments({ createdAt: { $gte: start } }),
    Order.countDocuments({ status: "packed" }),
    Order.countDocuments({ status: { $in: ["shipped", "out_for_delivery"] } }),
    Order.countDocuments({ status: "delivery_failed" }),
    Order.countDocuments({ status: "returned" }),
  ]);
  return { pendingConfirmation, confirmed, todayOrders, packed, shipped, failed, returned };
}

export async function markCodCollected(id: string, actorId: string) {
  await connectDb();
  const order = await Order.findById(id);
  if (!order) throw new Error("Order not found");
  order.payment.status = "paid";
  order.payment.collectedAt = new Date();
  order.events.push({
    from: order.status,
    to: order.status,
    actorType: "staff",
    actorId,
    note: "COD collected",
    customerVisible: true,
    at: new Date(),
  });
  await order.save();
  return toPublic(order.toObject());
}
