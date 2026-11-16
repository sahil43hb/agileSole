import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { BrandsIndex } from "@/components/storefront/brands-index";
import { listBrands } from "@/server/modules/catalog/taxonomy.service";
import { listCatalog } from "@/server/modules/catalog/product.service";
import { getPublicSettings } from "@/server/modules/admin/settings.service";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { name, city } = await getPublicSettings();
  return {
    title: locale === "ur" ? "برانڈز" : "Brands",
    description:
      locale === "ur"
        ? `${name} اور وہ لیبل جو ہم ${city} سے سٹاک کرتے ہیں۔`
        : `${name} and the labels we stock from ${city}.`,
  };
}

export default async function BrandsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [allBrands, settings] = await Promise.all([listBrands(locale), getPublicSettings()]);
  const brands = allBrands.filter((b) => b.isActive !== false);
  const featured = brands.find((b) => b.slug === "agile-sole") || brands[0];
  const catalog = featured
    ? await listCatalog({ locale, brand: featured.slug, limit: 4 })
    : { products: [] as Awaited<ReturnType<typeof listCatalog>>["products"], total: 0 };

  return (
    <BrandsIndex
      locale={locale}
      brands={brands}
      logoSrc={settings.logo || "/favicon.png"}
      preview={catalog.products}
      total={catalog.total}
    />
  );
}
