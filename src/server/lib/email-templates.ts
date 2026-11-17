export type EmailStore = {
  name: string;
  city?: string;
  email?: string;
  whatsapp?: string;
};

const BRAND = "#1FA64A";
const BRAND_DARK = "#15803D";
const INK = "#111111";
const MUTED = "#5C5C5C";
const FAINT = "#8A8A8A";
const LINE = "#E6EBE7";
const MIST = "#E8F7EE";
const PAPER = "#F4F7F4";
const HEADER = "#0F1F14";

export function siteBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://agilesole.pk").replace(/\/$/, "");
}

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function waLink(whatsapp?: string) {
  const digits = (whatsapp || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

function cta(href: string, label: string) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 8px">
      <tr>
        <td bgcolor="${BRAND}" style="border-radius:999px">
          <a href="${esc(href)}" style="display:inline-block;padding:14px 26px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.01em;color:#ffffff;text-decoration:none">${esc(label)}</a>
        </td>
      </tr>
    </table>`;
}

function metaRow(label: string, value: string) {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${FAINT};width:38%">${esc(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:15px;font-weight:600;color:${INK};text-align:right">${esc(value)}</td>
    </tr>`;
}

export function wrapEmail(opts: {
  store: EmailStore;
  preheader?: string;
  kicker?: string;
  inner: string;
}) {
  const store = opts.store.name || "Agile Sole";
  const city = opts.store.city || "Gujranwala";
  const wa = waLink(opts.store.whatsapp);
  const site = siteBaseUrl();
  const preheader = opts.preheader || "";
  const inbox = opts.store.email || "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${esc(store)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};color:${INK}">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${PAPER}" style="background:${PAPER};padding:32px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px">
          <tr>
            <td style="padding:0 8px 18px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${BRAND_DARK}">${esc(store)}</p>
              <p style="margin:4px 0 0;font-size:12px;color:${FAINT}">${esc(city)} · family footwear</p>
            </td>
          </tr>
          <tr>
            <td style="border-radius:24px;overflow:hidden;border:1px solid ${LINE};background:#ffffff">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td bgcolor="${HEADER}" style="background:${HEADER};padding:22px 28px">
                    <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND}">${esc(opts.kicker || "Every step a perfect beat")}</p>
                    <p style="margin:8px 0 0;font-family:Georgia,Times New Roman,serif;font-size:22px;line-height:1.25;color:#ffffff">${esc(store)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="height:4px;background:${BRAND};font-size:0;line-height:0">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:32px 28px 28px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${INK}">
                    ${opts.inner}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 8px 0;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${FAINT}">
              ${wa ? `<a href="${wa}" style="color:${BRAND_DARK};text-decoration:none;font-weight:600">WhatsApp the shop</a> · ` : ""}
              <a href="${esc(site)}" style="color:${BRAND_DARK};text-decoration:none;font-weight:600">Visit store</a>
              ${inbox ? `<br/>${esc(inbox)}` : ""}
              <br/>${esc(store)}, ${esc(city)}, Pakistan
              <p style="margin:14px 0 0;font-size:11px;color:#A3A3A3">You’re receiving this because of an action on ${esc(store)}. If this wasn’t you, you can ignore the email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function otpEmail(opts: { store: EmailStore; code: string; purpose: "login" | "checkout" }) {
  const purpose = opts.purpose === "checkout" ? "checkout" : "sign-in";
  const inner = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND_DARK}">Verification</p>
    <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;letter-spacing:-0.03em">Your ${purpose} code</h1>
    <p style="margin:0 0 22px;color:${MUTED}">Enter this code to continue. It expires in 10 minutes.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px">
      <tr>
        <td align="center" bgcolor="${MIST}" style="background:${MIST};border-radius:18px;padding:22px 16px;border:1px solid #D5EEDF">
          <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:34px;letter-spacing:0.28em;font-weight:700;color:${INK}">${esc(opts.code)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:${FAINT}">Never share this code. ${esc(opts.store.name)} will never ask for it on a call.</p>
  `;
  const text = `Your ${opts.store.name} ${purpose} code is ${opts.code}.\n\nIt expires in 10 minutes. If you did not ask for this, ignore the email.`;
  return {
    subject: `${opts.store.name} — your ${purpose} code`,
    text,
    html: wrapEmail({
      store: opts.store,
      kicker: "Secure code",
      preheader: `Your ${purpose} code is ${opts.code}. Expires in 10 minutes.`,
      inner,
    }),
  };
}

export function newsletterWelcomeEmail(opts: { store: EmailStore }) {
  const site = siteBaseUrl();
  const inner = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND_DARK}">You’re in</p>
    <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;letter-spacing:-0.03em">On the drop list</h1>
    <p style="margin:0 0 8px;color:${MUTED}">We’ll email new pairs from ${esc(opts.store.city || "Gujranwala")} — the same Facebook drops, now in your inbox.</p>
    ${cta(`${site}/en`, "Shop new arrivals")}
  `;
  const text = `You’re on the ${opts.store.name} list. We’ll email new pairs from ${opts.store.city || "Gujranwala"}.\n\nIf you did not subscribe, ignore this message.`;
  return {
    subject: `${opts.store.name} — you’re on the drop list`,
    text,
    html: wrapEmail({ store: opts.store, kicker: "Newsletter", preheader: "You’re on the drop list.", inner }),
  };
}

export function newsletterShopEmail(opts: { store: EmailStore; email: string }) {
  const inner = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND_DARK}">Shop notice</p>
    <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25">New subscriber</h1>
    <p style="margin:0;color:${MUTED}"><strong style="color:${INK}">${esc(opts.email)}</strong> joined the drop list.</p>
  `;
  return {
    subject: `${opts.store.name} — newsletter signup`,
    text: `${opts.email} joined the drop list.`,
    html: wrapEmail({ store: opts.store, kicker: "Inbox", preheader: `${opts.email} joined the drop list.`, inner }),
  };
}

export function contactShopEmail(opts: { store: EmailStore; name: string; contact: string; message: string }) {
  const inner = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND_DARK}">Contact form</p>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25">${esc(opts.name)}</h1>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px">${metaRow("From", opts.contact)}</table>
    <p style="margin:0;padding:16px 18px;background:${PAPER};border-radius:16px;white-space:pre-wrap;color:${INK}">${esc(opts.message)}</p>
  `;
  return {
    subject: `Contact form — ${opts.name}`,
    text: `${opts.name} wrote via the site.\n\nFrom: ${opts.contact}\n\n${opts.message}`,
    html: wrapEmail({ store: opts.store, kicker: "Inbox", preheader: `${opts.name} wrote via the site.`, inner }),
  };
}

export function smtpTestEmail(opts: { store: EmailStore }) {
  const inner = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND_DARK}">SMTP</p>
    <h1 style="margin:0 0 12px;font-size:24px">Mail is live</h1>
    <p style="margin:0;color:${MUTED}">This is a test from ${esc(opts.store.name)}. Order, OTP, contact, and newsletter emails use this layout.</p>
  `;
  return {
    subject: `${opts.store.name} — SMTP is live`,
    text: `This is a test from ${opts.store.name}. Order, OTP, contact, and newsletter emails will use this Gmail SMTP.`,
    html: wrapEmail({ store: opts.store, kicker: "Systems", preheader: "SMTP is live.", inner }),
  };
}

type OrderEmailKind = "order_placed" | "order_confirmed" | "order_shipped" | "order_delivered" | "order_cancelled" | "status_update";

type OrderLike = {
  number?: string;
  locale?: string;
  status?: string;
  shippingAddress?: { phone?: string; fullName?: string };
  amounts?: { total?: number };
  payment?: { collectAmount?: number };
  shipment?: { courierName?: string; trackingNumber?: string; trackingUrl?: string };
};

const ORDER_COPY: Record<
  OrderEmailKind,
  { kicker: string; title: string; intro: (o: OrderLike, store: EmailStore) => string; cta?: string }
> = {
  order_placed: {
    kicker: "Order received",
    title: "We have your COD order",
    intro: (o, store) =>
      `Hi ${o.shippingAddress?.fullName || "there"} — ${store.name} has order ${o.number}. We’ll call to confirm before packing. Pay cash on delivery.`,
    cta: "Track this order",
  },
  order_confirmed: {
    kicker: "Confirmed",
    title: "Your pair is being prepared",
    intro: (o) => `Order ${o.number} is confirmed. We’re packing it in Gujranwala.`,
    cta: "Track this order",
  },
  order_shipped: {
    kicker: "On the way",
    title: "Your pair has shipped",
    intro: (o) =>
      `Order ${o.number} is on the road${o.shipment?.courierName ? ` with ${o.shipment.courierName}` : ""}.`,
    cta: "Track shipment",
  },
  order_delivered: {
    kicker: "Delivered",
    title: "Hope the pair feels right",
    intro: (o) => `Order ${o.number} was delivered. Size exchange is in Shipping & returns if you need it.`,
    cta: "Visit the store",
  },
  order_cancelled: {
    kicker: "Cancelled",
    title: "This order was cancelled",
    intro: (o, store) => `Order ${o.number} was cancelled. If you still want the pair, order again on ${store.name}.`,
    cta: "Shop again",
  },
  status_update: {
    kicker: "Update",
    title: "Your order moved forward",
    intro: (o) => `Order ${o.number} has a new status.`,
    cta: "Track this order",
  },
};

export function orderCustomerEmail(opts: {
  store: EmailStore;
  order: OrderLike;
  kind: OrderEmailKind;
  statusLabel: string;
  amountLabel: string;
}) {
  const copy = ORDER_COPY[opts.kind] || ORDER_COPY.status_update;
  const site = siteBaseUrl();
  const track = `${site}/en/track-order`;
  const shipHref = opts.order.shipment?.trackingUrl || track;
  const href = opts.kind === "order_delivered" || opts.kind === "order_cancelled" ? `${site}/en` : shipHref;

  const rows =
    metaRow("Order", opts.order.number || "—") +
    metaRow("Status", opts.statusLabel) +
    (opts.kind === "order_placed" || opts.kind === "order_confirmed" ? metaRow("Pay on delivery", opts.amountLabel) : "") +
    (opts.order.shipment?.courierName ? metaRow("Courier", opts.order.shipment.courierName) : "") +
    (opts.order.shipment?.trackingNumber ? metaRow("Tracking", opts.order.shipment.trackingNumber) : "");

  const inner = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND_DARK}">${esc(copy.kicker)}</p>
    <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;letter-spacing:-0.03em">${esc(copy.title)}</h1>
    <p style="margin:0 0 20px;color:${MUTED}">${esc(copy.intro(opts.order, opts.store))}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
    ${copy.cta ? cta(href, copy.cta) : ""}
  `;

  const textBits = [copy.intro(opts.order, opts.store), `Order ${opts.order.number}`, opts.statusLabel, opts.amountLabel].filter(Boolean);
  if (opts.order.shipment?.trackingNumber) textBits.push(`Tracking: ${opts.order.shipment.trackingNumber}`);
  textBits.push(`Track: ${track}`);

  return {
    html: wrapEmail({
      store: opts.store,
      kicker: copy.kicker,
      preheader: copy.intro(opts.order, opts.store),
      inner,
    }),
    text: textBits.join("\n\n"),
  };
}

export function shopNewOrderEmail(opts: {
  store: EmailStore;
  order: OrderLike;
  amountLabel: string;
}) {
  const site = siteBaseUrl();
  const inner = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND_DARK}">New COD</p>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25">${esc(opts.order.number || "New order")}</h1>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${metaRow("Customer", opts.order.shippingAddress?.fullName || "Customer")}
      ${metaRow("Phone", opts.order.shippingAddress?.phone || "—")}
      ${metaRow("Collect", opts.amountLabel)}
    </table>
    ${cta(`${site}/admin/orders`, "Open in admin")}
  `;
  const text = `${opts.order.shippingAddress?.fullName || "Customer"} placed ${opts.order.number}.\nCollect ${opts.amountLabel}.\nPhone: ${opts.order.shippingAddress?.phone || ""}\n\nOpen admin → Orders.`;
  return {
    subject: `${opts.store.name} — new COD ${opts.order.number}`,
    text,
    html: wrapEmail({
      store: opts.store,
      kicker: "Shop inbox",
      preheader: `New COD ${opts.order.number}`,
      inner,
    }),
  };
}

export function fallbackHtml(text: string, store: EmailStore = { name: "Agile Sole", city: "Gujranwala" }) {
  const blocks = text
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;line-height:1.6;color:${INK}">${esc(block).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");
  return wrapEmail({ store, inner: blocks || `<p style="margin:0">${esc(text)}</p>` });
}
