import type { Metadata } from "next";
import { LegalPage } from "@/components/storefront/legal-page";
import { BRAND } from "@/shared/constants";
import { getPublicSettings } from "@/server/modules/admin/settings.service";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { name } = await getPublicSettings();
  return {
    title: locale === "ur" ? `شرائط — ${name}` : `Terms — ${name}`,
    description: BRAND.positioning.en,
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPage locale={locale} kind="terms" />;
}
