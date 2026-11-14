import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { CatalogListing } from "@/components/storefront/catalog-listing";
import { listCatalog } from "@/server/modules/catalog/product.service";
import { getBrandBySlug } from "@/server/modules/catalog/taxonomy.service";
import { filterQueryRecord, filtersFromSearch } from "@/lib/catalog-query";

export const revalidate = 60;

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const brand = await getBrandBySlug(slug, locale);
  if (!brand) notFound();
  const catalog = await listCatalog({ locale, brand: slug, ...filtersFromSearch(sp) });

  return (
    <CatalogListing
      title={brand.name}
      description={brand.description}
      products={catalog.products}
      total={catalog.total}
      page={catalog.page}
      pages={catalog.pages}
      facets={catalog.facets}
      path={`/brands/${slug}`}
      query={filterQueryRecord(sp)}
      crumbs={[{ href: "/", label: "Home" }, { href: "/brands", label: "Brands" }, { label: brand.name }]}
      heroImage={slug === "agile-sole" ? "/catalog/banner-house-brand.jpg" : "/catalog/banner-brands.jpg"}
    />
  );
}
