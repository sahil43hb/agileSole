import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogListing } from "@/components/storefront/catalog-listing";
import { listCatalog } from "@/server/modules/catalog/product.service";
import { filterQueryRecord, filtersFromSearch } from "@/lib/catalog-query";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ur" ? "دکان" : "Shop",
    description: locale === "ur" ? "سنیکرز، سینڈل اور خاندانی جوڑیاں۔" : "Sneakers, sandals, and family pairs from Gujranwala.",
  };
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("shop");
  const n = await getTranslations("nav");
  const catalog = await listCatalog({ locale, ...filtersFromSearch(sp) });

  return (
    <CatalogListing
      title={t("title")}
      products={catalog.products}
      total={catalog.total}
      page={catalog.page}
      pages={catalog.pages}
      facets={catalog.facets}
      path="/shop"
      query={filterQueryRecord(sp)}
      crumbs={[{ href: "/", label: n("home") }, { label: t("title") }]}
      heroImage="/catalog/banner-shop.jpg"
    />
  );
}
