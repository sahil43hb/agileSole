import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, MapPin, ShieldCheck, Users } from "lucide-react";
import { BRAND } from "@/shared/constants";
import { Link } from "@/i18n/navigation";
import { ContentCard, ContentHero, ContentShell } from "@/components/storefront/content-hero";
import { getPublicSettings } from "@/server/modules/admin/settings.service";
import { geoLabel } from "@/content/geo-pk";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages");
  const n = await getTranslations("nav");
  const c = await getTranslations("common");
  const settings = await getPublicSettings();
  const storeName = settings.name;
  const cityLabel = geoLabel(settings.city, locale);
  const tagline = locale === "ur" ? BRAND.tagline.ur : BRAND.tagline.en;
  const positioning = locale === "ur" ? BRAND.positioning.ur : BRAND.positioning.en;
  const aboutVars = { name: storeName, city: cityLabel };

  const stats = [
    { icon: ShieldCheck, title: t("codCard"), hint: t("codCardHint") },
    { icon: MapPin, title: cityLabel, hint: t("cityCardHint") },
    { icon: Users, title: t("familyCard"), hint: t("familyCardHint") },
  ];

  return (
    <ContentShell>
      <ContentHero
        crumbs={[{ href: "/", label: n("home") }, { label: t("aboutTitle", aboutVars) }]}
        kicker={cityLabel}
        title={t("aboutTitle", aboutVars)}
        body={tagline}
      />
      <div className="mx-auto mt-10 max-w-site px-4 md:px-8">
        <div className="grid overflow-hidden rounded-[1.8rem] bg-white ring-1 ring-black/[0.04] lg:grid-cols-2">
          <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[480px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/catalog/story-family.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-dark">{storeName}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{positioning}</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted md:text-base">{t("aboutBody", aboutVars)}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Link href="/lookbook" className="btn-primary h-11 rounded-full px-5">
                {t("lookbook")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link
                href="/shop"
                className="inline-flex h-11 items-center rounded-full bg-[#f3f5f2] px-5 text-sm font-medium hover:bg-[#e8ece8]"
              >
                {c("shopCollection")}
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {stats.map((s) => (
            <ContentCard key={s.title} className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-mist text-brand">
                <s.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{s.hint}</p>
              </div>
            </ContentCard>
          ))}
        </div>
      </div>
    </ContentShell>
  );
}
