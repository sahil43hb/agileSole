import { sendEmail, isSmtpConfigured } from "../src/server/lib/mailer";

async function main() {
  if (!isSmtpConfigured()) {
    console.error("SMTP is not configured");
    process.exit(1);
  }
  const to = process.env.SMTP_USER || "";
  const { smtpTestEmail } = await import("../src/server/lib/email-templates");
  const mail = smtpTestEmail({ store: { name: "Agile Sole", city: "Gujranwala" } });
  const result = await sendEmail({
    to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
  console.log(result);
  if (!result.sent) process.exit(1);
}

void main();
