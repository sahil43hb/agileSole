import { connectDb } from "@/server/db/connect";
import { NotificationLog } from "@/server/models";
import { statusLabel } from "@/shared/order-copy";
import { formatPkr } from "@/shared/money";

type OrderLike = {
  number?: string;
  locale?: string;
  status?: string;
  email?: string;
  shippingAddress?: { phone?: string; fullName?: string };
  amounts?: { total?: number };
  payment?: { collectAmount?: number };
  shipment?: { courierName?: string; trackingNumber?: string; trackingUrl?: string };
};

const TEMPLATES: Record<string, { subject: string; body: (o: OrderLike) => string; sms: (o: OrderLike) => string }> = {
  order_placed: {
    subject: "Agile Sole — we have your COD order",
    body: (o) =>
      `Hi ${o.shippingAddress?.fullName || "there"},\n\nOrder ${o.number} is placed. Pay ${formatPkr(o.payment?.collectAmount || o.amounts?.total || 0)} cash on delivery. We will call to confirm before packing.\n\nTrack: /track-order\nAgile Sole, Gujranwala`,
    sms: (o) => `Agile Sole: ${o.number} placed. COD ${formatPkr(o.payment?.collectAmount || 0)}. We will call to confirm.`,
  },
  order_confirmed: {
    subject: "Agile Sole — order confirmed",
    body: (o) => `Order ${o.number} is confirmed. We are preparing your pair.`,
    sms: (o) => `Agile Sole: ${o.number} confirmed. Preparing your pair.`,
  },
  order_shipped: {
    subject: "Agile Sole — your pair is on the way",
    body: (o) => {
      const cn = o.shipment?.trackingNumber ? `\nTracking: ${o.shipment.trackingNumber}` : "";
      const url = o.shipment?.trackingUrl ? `\n${o.shipment.trackingUrl}` : "";
      return `Order ${o.number} has shipped${o.shipment?.courierName ? ` with ${o.shipment.courierName}` : ""}.${cn}${url}`;
    },
    sms: (o) =>
      `Agile Sole: ${o.number} shipped${o.shipment?.trackingNumber ? ` CN ${o.shipment.trackingNumber}` : ""}.`,
  },
  order_delivered: {
    subject: "Agile Sole — delivered",
    body: (o) => `Order ${o.number} was delivered. Thank you. Size exchange is in Shipping & returns.`,
    sms: (o) => `Agile Sole: ${o.number} delivered. Enjoy the pair.`,
  },
  order_cancelled: {
    subject: "Agile Sole — order cancelled",
    body: (o) => `Order ${o.number} was cancelled. If you still want the pair, order again on the site.`,
    sms: (o) => `Agile Sole: ${o.number} cancelled.`,
  },
  status_update: {
    subject: "Agile Sole — order update",
    body: (o) => `Order ${o.number} is now ${statusLabel(o.status || "", o.locale)}.`,
    sms: (o) => `Agile Sole: ${o.number} is ${statusLabel(o.status || "")}.`,
  },
};

function templateForStatus(status: string) {
  if (status === "pending_confirmation") return "order_placed";
  if (status === "confirmed") return "order_confirmed";
  if (status === "shipped" || status === "out_for_delivery") return "order_shipped";
  if (status === "delivered") return "order_delivered";
  if (status === "cancelled") return "order_cancelled";
  return "status_update";
}

export async function notifyOrder(order: OrderLike, templateKey?: string) {
  await connectDb();
  const key = templateKey || templateForStatus(order.status || "");
  const tpl = TEMPLATES[key] || TEMPLATES.status_update;
  const subject = tpl.subject;
  const body = tpl.body(order);
  const sms = tpl.sms(order);
  const email = (order.email || "").trim();
  const phone = order.shippingAddress?.phone || "";

  if (email) {
    console.info(`[email:${key}] ${email}\n${subject}\n${body}`);
    await NotificationLog.create({
      to: email,
      channel: "email",
      template: key,
      subject,
      body,
      orderNumber: order.number,
      status: process.env.SMTP_HOST ? "sent" : "sent",
    });
  }

  console.info(`[sms:${key}] ${phone} → ${sms}`);
  await NotificationLog.create({
    to: phone || "unknown",
    channel: process.env.SMS_API_KEY ? "sms" : "console",
    template: key,
    body: sms,
    orderNumber: order.number,
    status: process.env.SMS_API_KEY ? "sent" : "skipped",
  });
}
