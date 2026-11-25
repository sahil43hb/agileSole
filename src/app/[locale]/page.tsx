import { getTranslations, setRequestLocale } from "next-intl/server";
import { homePayload } from "@/server/modules/catalog/home.service";
import { getHomeSections, listFaqs } from "@/server/modules/cms/cms.service";
import { FAQS } from "@/content/faqs";
import { HomeView } from "@/components/storefront/home-view";
import { getPublicSettings } from "@/server/modules/admin/settings.service";
import { geoLabel } from "@/content/geo-pk";

export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const settings = await getPublicSettings();
  const storeName = settings.name;
  const cityLabel = geoLabel(settings.city, locale);
  let data: Awaited<ReturnType<typeof homePayload>> | null = null;
  let enabled = new Set<string>();
  let faqs: Awaited<ReturnType<typeof listFaqs>> = [];
  try {
    data = await homePayload(locale);
    enabled = new Set((await getHomeSections()).filter((s) => s.enabled).map((s) => s.type));
    faqs = await listFaqs(locale);
  } catch {
    data = null;
    enabled = new Set([
      "hero",
      "trust",
      "categoryGrid",
      "styleGrid",
      "productCarousel",
      "family",
      "bestsellers",
      "splitStory",
      "lookbook",
      "reviews",
      "social",
      "faq",
      "newsletter",
    ]);
  }
  const show = (type: string) => enabled.has(type);
  const faqItems = (
    faqs.length
      ? faqs
      : FAQS.map((item) => ({
          q: locale === "ur" ? item.q.ur : item.q.en,
          a: locale === "ur" ? item.a.ur : item.a.en,
        }))
  ).slice(0, 4);

  return (
    <HomeView
      locale={locale}
      show={show}
      categories={data?.categories || []}
      newArrivals={data?.newArrivals || []}
      family={data?.family || []}
      bestsellers={data?.bestsellers || []}
      reviews={data?.reviews || []}
      faqs={faqItems}
      productTypes={settings.productTypes}
      t={{
        kicker: t("hero.kicker", { name: storeName, city: cityLabel }),
        title: t("hero.title"),
        body: t("hero.body"),
        cta: t("hero.cta"),
        secondary: t("hero.secondary"),
        shopBy: t("shopBy"),
        featured: t("featured"),
        storyTitle: t("story.title"),
        storyBody: t("story.body", { name: storeName, city: cityLabel }),
        trust: {
          cod: t("trust.cod"),
          ship: t("trust.ship"),
          exchange: t("trust.exchange"),
          fit: t("trust.fit"),
        },
      }}
    />
  );
}
