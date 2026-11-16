import { getTranslations, setRequestLocale } from "next-intl/server";
import { listSizeCharts } from "@/server/modules/catalog/taxonomy.service";
import { ContentHero, ContentShell } from "@/components/storefront/content-hero";
import { SizeGuideView } from "@/components/storefront/size-guide-view";

export const revalidate = 60;

export default async function SizeGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages");
  const n = await getTranslations("nav");
  const charts = await listSizeCharts(locale);

  return (
    <ContentShell>
      <ContentHero
        crumbs={[{ href: "/", label: n("home") }, { label: n("sizeGuide") }]}
        kicker={t("howWeSize")}
        title={n("sizeGuide")}
        body={t("sizeGuideBody")}
      />
      <SizeGuideView charts={charts} />
    </ContentShell>
  );
}
