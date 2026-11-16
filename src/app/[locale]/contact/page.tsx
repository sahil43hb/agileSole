import { getTranslations, setRequestLocale } from "next-intl/server";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/storefront/contact-form";
import { ContentCard, ContentHero, ContentShell } from "@/components/storefront/content-hero";
import { getPublicSettings } from "@/server/modules/admin/settings.service";
import { geoLabel } from "@/content/geo-pk";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const n = await getTranslations("nav");
  const { email, whatsapp, name: storeName, city } = await getPublicSettings();
  const digits = (whatsapp || process.env.NEXT_PUBLIC_WHATSAPP || "923069158103").replace(/\D/g, "");
  const mail = email || "sahilmubeen30@gmail.com";
  const tel = digits.startsWith("92") ? `+${digits}` : `+92${digits.replace(/^0/, "")}`;

  const channels = [
    {
      href: `https://wa.me/${digits}`,
      icon: MessageCircle,
      label: t("waCta"),
      value: tel,
      external: true,
    },
    {
      href: `mailto:${mail}`,
      icon: Mail,
      label: t("mailCta"),
      value: mail,
      external: false,
    },
  ];

  return (
    <ContentShell>
      <ContentHero
        crumbs={[{ href: "/", label: n("home") }, { label: t("title") }]}
        kicker={geoLabel(city, locale)}
        title={t("title")}
        body={t("hint")}
      />
      <div className="mx-auto mt-10 grid max-w-site items-start gap-6 px-4 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:px-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div className="space-y-3">
          {channels.map((ch) => (
            <a
              key={ch.href}
              href={ch.href}
              target={ch.external ? "_blank" : undefined}
              rel={ch.external ? "noreferrer" : undefined}
              className="flex items-center gap-4 rounded-[1.35rem] bg-white p-4 ring-1 ring-black/[0.04] transition hover:ring-black/10"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-mist text-brand">
                <ch.icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">{ch.label}</span>
                <span className="mt-0.5 block text-sm font-semibold" dir="ltr">
                  {ch.value}
                </span>
              </span>
            </a>
          ))}
          <div className="flex items-center gap-4 rounded-[1.35rem] bg-white p-4 ring-1 ring-black/[0.04]">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-mist text-brand">
              <MapPin className="h-4 w-4" />
            </span>
            <p className="text-sm">
              <span className="font-semibold">{storeName}</span>
              <span className="mt-0.5 block text-ink-muted">
                {geoLabel(city, locale)}, {t("pakistan")}
              </span>
            </p>
          </div>
        </div>
        <ContentCard>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-dark">{t("write")}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{t("body")}</h2>
          <div className="mt-6">
            <ContactForm />
          </div>
        </ContentCard>
      </div>
    </ContentShell>
  );
}
