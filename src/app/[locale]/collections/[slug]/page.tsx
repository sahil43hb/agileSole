import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { CatalogListing } from "@/components/storefront/catalog-listing";
import { listCatalog } from "@/server/modules/catalog/product.service";
import { getCollectionBySlug } from "@/server/modules/catalog/taxonomy.service";
import { filterQueryRecord, filtersFromSearch } from "@/lib/catalog-query";

export const revalidate = 60;

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const collection = await getCollectionBySlug(slug, locale);
  if (!collection) notFound();
  const catalog = await listCatalog({ locale, collection: slug, ...filtersFromSearch(sp) });

  const HERO: Record<string, string> = {
    bestsellers: "/catalog/grey-pair.jpg",
    "family-comfort": "/catalog/family-comfort-collage.jpg",
    "facebook-drop": "/catalog/pulse-mint-display.jpg",
    "new-arrivals": "/catalog/banner-new-in.jpg",
  };

  return (
    <CatalogListing
      title={collection.title}
      products={catalog.products}
      total={catalog.total}
      page={catalog.page}
      pages={catalog.pages}
      facets={catalog.facets}
      path={`/collections/${slug}`}
      query={filterQueryRecord(sp)}
      crumbs={[{ href: "/", label: "Home" }, { href: "/shop", label: "Shop" }, { label: collection.title }]}
      heroImage={HERO[slug] || "/catalog/campaign-grid.jpg"}
    />
  );
}
