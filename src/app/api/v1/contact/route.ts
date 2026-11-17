import { z } from "zod";
import { fromError, ok } from "@/server/lib/api";
import { connectDb } from "@/server/db/connect";
import { Ticket } from "@/server/models";

export async function POST(request: Request) {
  try {
    await connectDb();
    const body = z
      .object({
        name: z.string().min(2),
        contact: z.string().min(5),
        message: z.string().min(8),
      })
      .parse(await request.json());
    const ticket = await Ticket.create({
      type: "support",
      reason: `${body.name} · ${body.contact}\n${body.message}`,
      status: "open",
    });
    const { notifyAdminTicket } = await import("@/server/modules/admin/admin-notice.service");
    notifyAdminTicket(ticket.toObject());
    const { sendEmail, shopInbox } = await import("@/server/lib/mailer");
    const { getPublicSettings } = await import("@/server/modules/admin/settings.service");
    const { contactShopEmail } = await import("@/server/lib/email-templates");
    const shop = await shopInbox();
    if (shop) {
      const store = await getPublicSettings();
      const mail = contactShopEmail({ store, name: body.name, contact: body.contact, message: body.message });
      await sendEmail({
        to: shop,
        replyTo: body.contact.includes("@") ? body.contact : undefined,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
    }
    return ok({ ticketId: String(ticket._id) }, 201);
  } catch (err) {
    return fromError(err);
  }
}
