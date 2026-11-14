import type { Metadata } from "next";
import { LegalPage } from "@/components/storefront/legal-page";
import { BRAND } from "@/shared/constants";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ur" ? "شپنگ اور واپسی — Agile Sole" : "Shipping & returns — Agile Sole",
    description: BRAND.positioning.en,
  };
}

export default async function ShippingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPage locale={locale} kind="shipping" />;
}
