import { connectDb } from "@/server/db/connect";
import { NotificationLog } from "@/server/models";
import { statusLabel } from "@/shared/order-copy";
import { formatPkr } from "@/shared/money";
import { getPublicSettings } from "@/server/modules/admin/settings.service";
import { sendEmail, shopInbox } from "@/server/lib/mailer";
import { orderCustomerEmail, shopNewOrderEmail } from "@/server/lib/email-templates";

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

function templates(name: string, city: string) {
  return {
    order_placed: {
      subject: `${name} — we have your COD order`,
      body: (o: OrderLike) =>
        `Hi ${o.shippingAddress?.fullName || "there"},\n\nOrder ${o.number} is placed. Pay ${formatPkr(o.payment?.collectAmount || o.amounts?.total || 0)} cash on delivery. We will call to confirm before packing.\n\nTrack: /track-order\n${name}, ${city}`,
      sms: (o: OrderLike) => `${name}: ${o.number} placed. COD ${formatPkr(o.payment?.collectAmount || 0)}. We will call to confirm.`,
    },
    order_confirmed: {
      subject: `${name} — order confirmed`,
      body: (o: OrderLike) => `Order ${o.number} is confirmed. We are preparing your pair.`,
      sms: (o: OrderLike) => `${name}: ${o.number} confirmed. Preparing your pair.`,
    },
    order_shipped: {
      subject: `${name} — your pair is on the way`,
      body: (o: OrderLike) => {
        const cn = o.shipment?.trackingNumber ? `\nTracking: ${o.shipment.trackingNumber}` : "";
        const url = o.shipment?.trackingUrl ? `\n${o.shipment.trackingUrl}` : "";
        return `Order ${o.number} has shipped${o.shipment?.courierName ? ` with ${o.shipment.courierName}` : ""}.${cn}${url}`;
      },
      sms: (o: OrderLike) =>
        `${name}: ${o.number} shipped${o.shipment?.trackingNumber ? ` CN ${o.shipment.trackingNumber}` : ""}.`,
    },
    order_delivered: {
      subject: `${name} — delivered`,
      body: (o: OrderLike) => `Order ${o.number} was delivered. Thank you. Size exchange is in Shipping & returns.`,
      sms: (o: OrderLike) => `${name}: ${o.number} delivered. Enjoy the pair.`,
    },
    order_cancelled: {
      subject: `${name} — order cancelled`,
      body: (o: OrderLike) => `Order ${o.number} was cancelled. If you still want the pair, order again on the site.`,
      sms: (o: OrderLike) => `${name}: ${o.number} cancelled.`,
    },
    status_update: {
      subject: `${name} — order update`,
      body: (o: OrderLike) => `Order ${o.number} is now ${statusLabel(o.status || "", o.locale)}.`,
      sms: (o: OrderLike) => `${name}: ${o.number} is ${statusLabel(o.status || "")}.`,
    },
  } as const;
}

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
  const store = await getPublicSettings();
  const tplMap = templates(store.name, store.city);
  const key = (templateKey || templateForStatus(order.status || "")) as keyof typeof tplMap;
  const tpl = tplMap[key] || tplMap.status_update;
  const subject = tpl.subject;
  const body = tpl.body(order);
  const sms = tpl.sms(order);
  const email = (order.email || "").trim();
  const phone = order.shippingAddress?.phone || "";
  const amountLabel = formatPkr(order.payment?.collectAmount || order.amounts?.total || 0);
  const htmlMail = orderCustomerEmail({
    store,
    order,
    kind: key,
    statusLabel: statusLabel(order.status || "", order.locale),
    amountLabel,
  });

  if (email) {
    const sent = await sendEmail({ to: email, subject, text: body, html: htmlMail.html });
    await NotificationLog.create({
      to: email,
      channel: "email",
      template: key,
      subject,
      body,
      orderNumber: order.number,
      status: sent.sent ? "sent" : "failed",
    });
  }

  if (key === "order_placed") {
    const shop = await shopInbox();
    if (shop && shop.toLowerCase() !== email.toLowerCase()) {
      const shopMail = shopNewOrderEmail({ store, order, amountLabel });
      await sendEmail({
        to: shop,
        subject: shopMail.subject,
        text: shopMail.text,
        html: shopMail.html,
      });
    }
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
