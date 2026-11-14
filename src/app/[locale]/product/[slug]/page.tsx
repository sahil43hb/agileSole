import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getBySlug, listRelated } from "@/server/modules/catalog/product.service";
import { getSizeChart } from "@/server/modules/catalog/taxonomy.service";
import { listProductReviews } from "@/server/modules/catalog/review.service";
import { ProductDetail } from "@/components/storefront/product-detail";
import { ProductCard } from "@/components/storefront/product-card";
import { productGridClass } from "@/components/storefront/product-grid";
import { ReviewList } from "@/components/storefront/review-list";
import { ReviewForm } from "@/components/storefront/review-form";
import { RecentlyViewed } from "@/components/storefront/recently-viewed";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { localizedPath, siteUrl } from "@/lib/site";
import { BRAND } from "@/shared/constants";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const product = await getBySlug(slug, locale);
    if (!product) return { title: "Product" };
    const url = localizedPath(locale, `/product/${slug}`);
    return {
      title: product.title,
      description: product.description || BRAND.positioning.en,
      alternates: {
        canonical: url,
        languages: {
          en: localizedPath("en", `/product/${slug}`),
          ur: localizedPath("ur", `/product/${slug}`),
        },
      },
      openGraph: {
        type: "website",
        url,
        title: product.title,
        description: product.description || BRAND.positioning.en,
        images: product.images.slice(0, 4).map((src) => (src.startsWith("http") ? src : `${siteUrl()}${src}`)),
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  let product = null;
  try {
    product = await getBySlug(slug, locale);
  } catch {
    product = null;
  }
  if (!product) notFound();

  const chartCode = product.sizeChartCode || `${product.gender}-eu`;
  const [chart, related, reviewData] = await Promise.all([
    getSizeChart(chartCode, locale),
    listRelated(slug, locale, 4),
    listProductReviews(slug),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images,
    brand: { "@type": "Brand", name: "Agile Sole" },
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.price,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(reviewData.count
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewData.average,
            reviewCount: reviewData.count,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-10 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: `/c/${product.gender}`, label: product.gender },
          { label: product.title },
        ]}
      />
      <div className="mt-6">
        <ProductDetail product={product} chart={chart} />
      </div>
      <ReviewList
        reviews={reviewData.reviews}
        average={reviewData.average}
        count={reviewData.count}
        fit={reviewData.fit}
      />
      <ReviewForm slug={slug} />
      {related.length ? (
        <section className="mt-16">
          <h2 className="text-xl font-semibold">You may also like</h2>
          <div className={`mt-6 ${productGridClass}`}>
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
      <RecentlyViewed locale={locale} exclude={slug} />
    </div>
  );
}
