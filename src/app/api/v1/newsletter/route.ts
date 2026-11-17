import { fail, fromError, ok } from "@/server/lib/api";
import { connectDb } from "@/server/db/connect";
import { Newsletter } from "@/server/models";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    await connectDb();
    const body = z
      .object({ email: z.string().email(), locale: z.string().optional() })
      .parse(await request.json());
    const email = body.email.toLowerCase();
    await Newsletter.updateOne(
      { email },
      { $setOnInsert: { email, locale: body.locale || "en" } },
      { upsert: true },
    );
    const { sendEmail, shopInbox } = await import("@/server/lib/mailer");
    const { getPublicSettings } = await import("@/server/modules/admin/settings.service");
    const { newsletterWelcomeEmail, newsletterShopEmail } = await import("@/server/lib/email-templates");
    const store = await getPublicSettings();
    const welcome = newsletterWelcomeEmail({ store });
    await sendEmail({
      to: email,
      subject: welcome.subject,
      text: welcome.text,
      html: welcome.html,
    });
    const shop = await shopInbox();
    if (shop && shop.toLowerCase() !== email) {
      const notice = newsletterShopEmail({ store, email });
      await sendEmail({
        to: shop,
        subject: notice.subject,
        text: notice.text,
        html: notice.html,
      });
    }
    return ok({ subscribed: true });
  } catch (err) {
    if (err instanceof z.ZodError) return fail("VALIDATION", "Enter a valid email", 422);
    return fromError(err);
  }
}
