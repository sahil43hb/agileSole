import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ProductCard } from "./product-card";
import { productListingGridClass } from "./product-grid";
import { CatalogFilters } from "./catalog-filters";
import { Breadcrumbs } from "./breadcrumbs";
import { Link } from "@/i18n/navigation";
import type { PublicProduct } from "@/server/modules/catalog/product.service";

export async function CatalogListing({
  title,
  description,
  products,
  total,
  page,
  pages,
  facets,
  path,
  query,
  crumbs,
  heroImage,
  heroLogo,
  subcategories,
}: {
  title: string;
  description?: string;
  products: PublicProduct[];
  total: number;
  page: number;
  pages: number;
  facets: { sizes: string[]; colors: string[] };
  path: string;
  query?: Record<string, string | undefined>;
  crumbs?: { href?: string; label: string }[];
  heroImage?: string;
  heroLogo?: string;
  subcategories?: { href: string; label: string }[];
}) {
  function hrefFor(nextPage: number, extra?: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const source = extra || query || {};
    for (const [k, v] of Object.entries(source)) {
      if (v && k !== "page") params.set(k, v);
    }
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  }

  const t = await getTranslations("shop");
  const n = await getTranslations("nav");
  const c = await getTranslations("common");
  const CHIP_LABEL: Record<string, string> = {
    size: t("size"),
    color: t("color"),
    gender: t("who"),
    inStock: t("inStock"),
    onSale: t("onSale"),
    type: t("type"),
    q: c("search"),
  };
  const chips = Object.entries(query || {}).filter(([k, v]) => v && k !== "page" && k !== "sort");

  return (
    <div className="bg-paper pb-16">
      {heroImage ? (
        <section className="relative isolate min-h-[280px] overflow-hidden bg-[#0c1610] text-white md:min-h-[380px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_right]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c1610]/75 via-[#0c1610]/35 to-transparent" />
          <div className="relative mx-auto flex min-h-[280px] max-w-[90rem] flex-col justify-end px-4 py-10 md:min-h-[380px] md:px-8 md:py-14">
            {crumbs?.length ? <Breadcrumbs items={crumbs} tone="dark" /> : null}
            {heroLogo ? (
              <div className="mt-4 inline-flex max-w-[220px] items-center rounded-2xl bg-white/95 px-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroLogo} alt="" className="h-12 w-auto max-w-[180px] object-contain object-left" />
              </div>
            ) : null}
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
            {description ? <p className="mt-3 max-w-xl text-sm text-white/75 md:text-base">{description}</p> : null}
          </div>
        </section>
      ) : (
        <div className="mx-auto max-w-[90rem] px-4 pt-10 md:px-8">
          {crumbs?.length ? <Breadcrumbs items={crumbs} /> : null}
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-ink-muted md:text-base">{description}</p> : null}
        </div>
      )}

      <div className="mx-auto max-w-[90rem] px-4 pt-8 md:px-8">
        {chips.length ? (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {chips.map(([k, v]) => (
              <Link
                key={k}
                href={hrefFor(1, { ...query, [k]: undefined })}
                scroll={false}
                className="inline-flex items-center gap-2 rounded-full bg-[#eef6f0] px-3 py-1.5 text-xs font-medium capitalize"
              >
                {CHIP_LABEL[k] || k}
                {v && v !== "1" ? `: ${v}` : ""}
                <span className="text-ink-faint">×</span>
              </Link>
            ))}
            <Link href={path} scroll={false} className="px-2 text-xs text-brand-dark hover:underline">
              {t("clearAll")}
            </Link>
          </div>
        ) : null}

        <Suspense fallback={null}>
          <CatalogFilters
            sizes={facets.sizes}
            colors={facets.colors}
            total={total}
            audience={path.match(/\/c\/(men|women|kids)(?:\/|$)/)?.[1] as "men" | "women" | "kids" | undefined}
            styles={subcategories}
            stylePath={path}
          >
            {products.length === 0 ? (
              <div className="rounded-3xl bg-[#f6f8f6] px-8 py-16 text-center">
                <p className="text-lg font-medium">{t("empty")}</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">{t("emptyHint")}</p>
                <div className="mt-6 flex justify-center gap-3 text-sm">
                  <Link href="/c/men" className="rounded-full bg-ink px-4 py-2 text-paper">
                    {n("men")}
                  </Link>
                  <Link href="/c/women" className="rounded-full bg-white px-4 py-2 ring-1 ring-paper-line">
                    {n("women")}
                  </Link>
                  <Link href="/shop" className="rounded-full bg-white px-4 py-2 ring-1 ring-paper-line">
                    {t("shopAll")}
                  </Link>
                </div>
              </div>
            ) : (
              <div className={productListingGridClass}>
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
            {pages > 1 ? (
              <div className="mt-12 flex items-center justify-center gap-2 text-sm">
                {page > 1 ? (
                  <Link
                    href={hrefFor(page - 1)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-paper-line hover:bg-[#f6f7f5]"
                    aria-label={t("prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                ) : null}
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={hrefFor(n)}
                    className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 ${
                      n === page ? "bg-ink text-paper" : "ring-1 ring-paper-line hover:bg-[#f6f7f5]"
                    }`}
                  >
                    {n}
                  </Link>
                ))}
                {page < pages ? (
                  <Link
                    href={hrefFor(page + 1)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-paper-line hover:bg-[#f6f7f5]"
                    aria-label={t("next")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            ) : null}
          </CatalogFilters>
        </Suspense>
      </div>
    </div>
  );
}
