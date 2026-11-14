import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { CatalogListing } from "@/components/storefront/catalog-listing";
import { listCatalog } from "@/server/modules/catalog/product.service";
import { getCategoryBySlug, listCategories } from "@/server/modules/catalog/taxonomy.service";
import { filterQueryRecord, filtersFromSearch } from "@/lib/catalog-query";

export const revalidate = 60;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const last = slug[slug.length - 1];
  const category = await getCategoryBySlug(last, locale);
  if (!category) notFound();

  const filters = filtersFromSearch(sp);
  const catalog = await listCatalog({
    locale,
    category: last,
    ...filters,
  });
  const all = await listCategories(locale);
  const children = all.filter((c) => c.parentId === category.id);
  const parent = category.parentId ? all.find((c) => c.id === category.parentId) : null;
  const styleSiblings = parent
    ? all.filter((c) => c.parentId === parent.id)
    : children;
  const parentPath = parent ? `/c/${slug.slice(0, -1).join("/")}` : `/c/${slug.join("/")}`;
  const crumbs = [
    { href: "/", label: "Home" },
    ...slug.map((part, i) => {
      const match = all.find((c) => c.slug === part);
      return {
        href: i === slug.length - 1 ? undefined : `/c/${slug.slice(0, i + 1).join("/")}`,
        label: match?.label || part,
      };
    }),
  ];
  const HERO: Record<string, string> = {
    men: "/catalog/banner-men.jpg",
    women: "/catalog/banner-women.jpg",
    kids: "/catalog/banner-kids.jpg",
    comfort: "/catalog/banner-comfort.jpg",
  };
  const rootSlug = slug[0];

  return (
    <CatalogListing
      title={category.name}
      description={category.description}
      products={catalog.products}
      total={catalog.total}
      page={catalog.page}
      pages={catalog.pages}
      facets={catalog.facets}
      path={`/c/${slug.join("/")}`}
      query={filterQueryRecord(sp)}
      crumbs={crumbs}
      heroImage={HERO[last] || HERO[rootSlug]}
      subcategories={
        styleSiblings.length
          ? [
              { href: parentPath, label: "All" },
              ...styleSiblings.map((c) => ({
                href: `${parentPath}/${c.slug}`,
                label: c.label,
              })),
            ]
          : children.map((c) => ({
              href: `/c/${slug.join("/")}/${c.slug}`,
              label: c.label,
            }))
      }
    />
  );
}
