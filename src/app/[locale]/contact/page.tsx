import { setRequestLocale } from "next-intl/server";
import { BRAND } from "@/shared/constants";
import { ContactForm } from "@/components/storefront/contact-form";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-3xl font-semibold">{locale === "ur" ? "رابطہ" : "Contact"}</h1>
      <p className="mt-4 text-ink-muted">
        {BRAND.name}, {BRAND.city}, Pakistan. Use the WhatsApp button for size questions — that is still the fastest path from the Facebook shop.
      </p>
      <ContactForm />
    </div>
  );
}
