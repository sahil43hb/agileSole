import { setRequestLocale } from "next-intl/server";
import { BRAND } from "@/shared/constants";
import { ContactForm } from "@/components/storefront/contact-form";
import { getPublicSettings } from "@/server/modules/admin/settings.service";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { email, whatsapp } = await getPublicSettings();
  const digits = (whatsapp || process.env.NEXT_PUBLIC_WHATSAPP || "923069158103").replace(/\D/g, "");
  const mail = email || "sahilmubeen30@gmail.com";
  const tel = digits.startsWith("92") ? `+${digits}` : `+92${digits.replace(/^0/, "")}`;

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-3xl font-semibold">{locale === "ur" ? "رابطہ" : "Contact"}</h1>
      <p className="mt-4 text-ink-muted">
        {BRAND.name}, {BRAND.city}, Pakistan.
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        <li>
          Email:{" "}
          <a className="font-medium text-brand-dark" href={`mailto:${mail}`}>
            {mail}
          </a>
        </li>
        <li>
          Phone / WhatsApp:{" "}
          <a className="font-medium text-brand-dark" href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer">
            {tel}
          </a>
        </li>
      </ul>
      <ContactForm />
    </div>
  );
}
