import { Types } from "mongoose";
import { connectDb } from "@/server/db/connect";
import { AdminNotification } from "@/server/models";
import { formatPkr } from "@/shared/money";

export type AdminNoticeType =
  | "order_placed"
  | "order_cancelled"
  | "order_return"
  | "ticket_open"
  | "review_pending"
  | "stock_low";

export type AdminNotice = {
  id: string;
  type: AdminNoticeType;
  title: string;
  body: string;
  href: string;
  severity: "info" | "urgent";
  entity?: string;
  entityId?: string;
  orderNumber?: string;
  createdAt: string;
  read: boolean;
};

type PublishInput = {
  type: AdminNoticeType;
  title: string;
  body?: string;
  href: string;
  severity?: "info" | "urgent";
  entity?: string;
  entityId?: string;
  orderNumber?: string;
};

function asNotice(row: Record<string, unknown>, staffId?: string): AdminNotice {
  const readBy = Array.isArray(row.readBy) ? (row.readBy as string[]) : [];
  return {
    id: String(row._id),
    type: row.type as AdminNoticeType,
    title: String(row.title || ""),
    body: String(row.body || ""),
    href: String(row.href || "/admin"),
    severity: row.severity === "urgent" ? "urgent" : "info",
    entity: row.entity ? String(row.entity) : undefined,
    entityId: row.entityId ? String(row.entityId) : undefined,
    orderNumber: row.orderNumber ? String(row.orderNumber) : undefined,
    createdAt: new Date(String(row.createdAt || Date.now())).toISOString(),
    read: staffId ? readBy.includes(staffId) : false,
  };
}

export async function publishAdminNotice(input: PublishInput) {
  await connectDb();
  const row = await AdminNotification.create({
    type: input.type,
    title: input.title,
    body: input.body || "",
    href: input.href,
    severity: input.severity || "info",
    entity: input.entity,
    entityId: input.entityId,
    orderNumber: input.orderNumber,
    readBy: [],
  });
  return asNotice(row.toObject() as Record<string, unknown>);
}

export function fireAdminNotice(task: () => Promise<unknown>) {
  void task().catch((err) => console.error("[admin-notice]", err));
}

export async function listAdminNotices(staffId: string, limit = 40) {
  await connectDb();
  const rows = await AdminNotification.find().sort({ createdAt: -1 }).limit(limit).lean();
  const unread = await AdminNotification.countDocuments({ readBy: { $ne: staffId } });
  return {
    items: rows.map((row) => asNotice(row as Record<string, unknown>, staffId)),
    unread,
  };
}

export async function listAdminNoticesAfter(afterId: string, staffId: string) {
  await connectDb();
  if (!Types.ObjectId.isValid(afterId)) return [] as AdminNotice[];
  const rows = await AdminNotification.find({ _id: { $gt: new Types.ObjectId(afterId) } })
    .sort({ _id: 1 })
    .limit(25)
    .lean();
  return rows.map((row) => asNotice(row as Record<string, unknown>, staffId));
}

export async function latestAdminNoticeId() {
  await connectDb();
  const row = await AdminNotification.findOne().sort({ _id: -1 }).select("_id").lean();
  return row ? String((row as { _id: { toString(): string } })._id) : "";
}

export async function markAdminNoticesRead(staffId: string, ids?: string[], all = false) {
  await connectDb();
  if (all) {
    await AdminNotification.updateMany({ readBy: { $ne: staffId } }, { $addToSet: { readBy: staffId } });
  } else if (ids?.length) {
    const valid = ids.filter((id) => Types.ObjectId.isValid(id));
    if (valid.length) {
      await AdminNotification.updateMany({ _id: { $in: valid } }, { $addToSet: { readBy: staffId } });
    }
  }
  return listAdminNotices(staffId);
}

type OrderLike = {
  _id?: unknown;
  number?: string;
  amounts?: { total?: number };
  payment?: { collectAmount?: number };
  shippingAddress?: { fullName?: string; city?: string; phone?: string };
  items?: { title?: string; qty?: number }[];
};

export function notifyAdminOrderPlaced(order: OrderLike) {
  const id = String(order._id || "");
  const total = order.payment?.collectAmount || order.amounts?.total || 0;
  const city = order.shippingAddress?.city || "";
  const name = order.shippingAddress?.fullName || "Customer";
  fireAdminNotice(() =>
    publishAdminNotice({
      type: "order_placed",
      title: `New COD order ${order.number}`,
      body: `${name}${city ? ` · ${city}` : ""} · ${formatPkr(total)}`,
      href: id ? `/admin/orders/${id}` : "/admin/orders",
      severity: "urgent",
      entity: "order",
      entityId: id,
      orderNumber: order.number,
    }),
  );
}

export function notifyAdminOrderCancelled(order: OrderLike, reason?: string) {
  const id = String(order._id || "");
  fireAdminNotice(() =>
    publishAdminNotice({
      type: "order_cancelled",
      title: `Cancel request ${order.number}`,
      body: reason || `${order.shippingAddress?.fullName || "Customer"} cancelled this order.`,
      href: id ? `/admin/orders/${id}` : "/admin/orders",
      severity: "urgent",
      entity: "order",
      entityId: id,
      orderNumber: order.number,
    }),
  );
}

export function notifyAdminOrderReturn(order: OrderLike, reason?: string) {
  const id = String(order._id || "");
  fireAdminNotice(() =>
    publishAdminNotice({
      type: "order_return",
      title: `Return / exchange ${order.number}`,
      body: reason || "Customer asked to return or exchange.",
      href: id ? `/admin/orders/${id}` : "/admin/tickets",
      severity: "urgent",
      entity: "order",
      entityId: id,
      orderNumber: order.number,
    }),
  );
}

export function notifyAdminTicket(ticket: {
  _id?: unknown;
  type?: string;
  reason?: string;
  orderNumber?: string;
}) {
  const id = String(ticket._id || "");
  const kind = ticket.type || "support";
  fireAdminNotice(() =>
    publishAdminNotice({
      type: "ticket_open",
      title: ticket.orderNumber ? `Ticket on ${ticket.orderNumber}` : "New customer ticket",
      body: (ticket.reason || kind).slice(0, 160),
      href: "/admin/tickets",
      severity: kind === "cancel" || kind === "return" ? "urgent" : "info",
      entity: "ticket",
      entityId: id,
      orderNumber: ticket.orderNumber,
    }),
  );
}

export function notifyAdminReview(review: { _id?: unknown; productSlug?: string; authorName?: string; rating?: number }) {
  fireAdminNotice(() =>
    publishAdminNotice({
      type: "review_pending",
      title: `Review to moderate · ${review.rating || 0}★`,
      body: `${review.authorName || "Customer"} on ${review.productSlug || "a product"}`,
      href: "/admin/reviews",
      entity: "review",
      entityId: String(review._id || ""),
    }),
  );
}

export function notifyAdminLowStock(input: { sku: string; title?: string; available: number }) {
  fireAdminNotice(async () => {
    await connectDb();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await AdminNotification.findOne({
      type: "stock_low",
      entityId: input.sku,
      createdAt: { $gt: since },
    }).lean();
    if (existing) return;
    await publishAdminNotice({
      type: "stock_low",
      title: `Low stock · ${input.sku}`,
      body: `${input.title || "Pair"} has ${input.available} left`,
      href: "/admin/inventory",
      severity: "urgent",
      entity: "sku",
      entityId: input.sku,
    });
  });
}
