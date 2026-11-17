import nodemailer from "nodemailer";
import { fallbackHtml } from "./email-templates";

function smtpPass() {
  return (process.env.SMTP_PASS || "").replace(/\s+/g, "");
}

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_USER && smtpPass());
}

function fromAddress() {
  const user = process.env.SMTP_USER || "";
  const name = process.env.SMTP_FROM_NAME || "Agile Sole";
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  return `"${name}" <${user}>`;
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null | undefined;

function getTransport() {
  if (!isSmtpConfigured()) return null;
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT || 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: smtpPass(),
    },
  });
  return transporter;
}

function asHtml(text: string) {
  return fallbackHtml(text);
}

export async function sendEmail(input: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}) {
  const to = (Array.isArray(input.to) ? input.to : [input.to])
    .map((v) => v.trim())
    .filter((v) => v.includes("@"));
  if (!to.length) return { sent: false as const, reason: "not-email" };

  const transport = getTransport();
  if (!transport) {
    console.info(`[email:skip] ${to.join(", ")} · ${input.subject}\n${input.text}`);
    return { sent: false as const, reason: "not-configured" };
  }

  try {
    await transport.sendMail({
      from: fromAddress(),
      to,
      subject: input.subject,
      text: input.text,
      html: input.html || asHtml(input.text),
      replyTo: input.replyTo,
    });
    return { sent: true as const };
  } catch (err) {
    console.error("[email:fail]", err);
    return { sent: false as const, reason: "failed" };
  }
}

export async function shopInbox() {
  const fromSettings = process.env.SMTP_SHOP_TO || "";
  if (fromSettings.includes("@")) return fromSettings;
  try {
    const { getPublicSettings } = await import("@/server/modules/admin/settings.service");
    const store = await getPublicSettings();
    if (store.email?.includes("@")) return store.email;
  } catch {
    // fall through
  }
  return process.env.SMTP_USER || "";
}
