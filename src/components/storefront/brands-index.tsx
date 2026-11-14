import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "./product-card";
import { productGridClass } from "./product-grid";
import { Breadcrumbs } from "./breadcrumbs";
import { SectionHeading } from "./section-heading";
import type { PublicProduct } from "@/server/modules/catalog/product.service";

const BRAND_ART: Record<string, string> = {
  "agile-sole": "/catalog/banner-house-brand.jpg",
};

type BrandRow = {
  id: string;
  slug: string;
  label: string;
  logo?: string;
  description?: { en?: string; ur?: string };
};

export function BrandsIndex({
  locale,
  brands,
  logoSrc,
  preview,
  total,
}: {
  locale: string;
  brands: BrandRow[];
  logoSrc: string;
  preview: PublicProduct[];
  total: number;
}) {
  const ur = locale === "ur";
  const featured = brands.find((b) => b.slug === "agile-sole") || brands[0];
  const rest = brands.filter((b) => b.id !== featured?.id);
  const story =
    (ur ? featured?.description?.ur : featured?.description?.en) ||
    (ur
      ? "گوجرانوالہ کا اپنا لیبل — سنیکرز اور خاندانی آرام۔"
      : "The Gujranwala house label — athletic sneakers and family comfort.");

  return (
    <div className="bg-paper pb-16">
      <section className="relative isolate min-h-[260px] overflow-hidden bg-[#0c1610] text-white md:min-h-[320px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/catalog/banner-brands.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_right]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1610]/85 via-[#0c1610]/50 to-[#0c1610]/20" />
        <div className="relative mx-auto flex min-h-[260px] max-w-[90rem] flex-col justify-end px-4 py-10 md:min-h-[320px] md:px-8 md:py-12">
          <Breadcrumbs
            tone="dark"
            items={[{ href: "/", label: ur ? "ہوم" : "Home" }, { label: ur ? "برانڈز" : "Brands" }]}
          />
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
            {ur ? "لیبلز" : "The house names"}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{ur ? "برانڈز" : "Brands"}</h1>
          <p className="mt-3 max-w-lg text-sm text-white/75 md:text-base">
            {ur
              ? "وہ لیبل جو ہم سٹاک کرتے ہیں — پہلا ہمارا اپنا گوجرانوالہ برانڈ ہے۔"
              : "The labels we stock, starting with our own Gujranwala house brand."}
          </p>
        </div>
      </section>

      {featured ? (
        <section className="mx-auto max-w-[90rem] px-4 py-12 md:px-8 md:py-16">
          <div className="grid overflow-hidden rounded-[2rem] bg-[#f4f7f5] md:grid-cols-2">
            <Link href={`/brands/${featured.slug}`} className="group relative min-h-[280px] overflow-hidden md:min-h-[420px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND_ART[featured.slug] || "/catalog/campaign-grid.jpg"}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
            </Link>
            <div className="flex flex-col justify-center px-8 py-10 md:px-12 md:py-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-dark">
                {ur ? "ہاؤس برانڈ" : "House brand"}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featured.logo || logoSrc} alt="" className="mt-5 h-14 w-auto max-w-[200px] object-contain object-left" />
              <h2 className="mt-5 text-3xl font-semibold tracking-tight">{featured.label}</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted md:text-base">{story}</p>
              <p className="mt-4 text-sm text-ink-faint">
                {total} {total === 1 ? (ur ? "جوڑی" : "pair") : ur ? "جوڑیاں" : "pairs"}
              </p>
              <Link
                href={`/brands/${featured.slug}`}
                className="btn-primary mt-8 h-12 w-fit gap-2 px-6"
              >
                {ur ? "برانڈ دیکھیں" : "Shop the brand"}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <p className="mx-auto max-w-[90rem] px-4 py-16 text-ink-muted md:px-8">
          {ur ? "ابھی کوئی برانڈ لائیو نہیں۔" : "No brands are live yet."}
        </p>
      )}

      {preview.length ? (
        <section className="mx-auto max-w-[90rem] px-4 pb-12 md:px-8 md:pb-16">
          <SectionHeading
            eyebrow={ur ? "اس لیبل سے" : "From this label"}
            title={ur ? "منتخب جوڑیاں" : "Selected pairs"}
            href={featured ? `/brands/${featured.slug}` : "/shop"}
            action={ur ? "سب" : "View all"}
          />
          <div className={`mt-8 ${productGridClass}`}>
            {preview.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      {rest.length ? (
        <section className="border-t border-paper-line/70 bg-[#f7f8f6]">
          <div className="mx-auto max-w-[90rem] px-4 py-12 md:px-8 md:py-16">
            <SectionHeading eyebrow={ur ? "مزید" : "Also in stock"} title={ur ? "دیگر لیبلز" : "Other labels"} />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/brands/${b.slug}`}
                    className="group flex h-full flex-col justify-between rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-paper-line/80 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.logo} alt="" className="h-10 w-auto max-w-[140px] object-contain" />
                    ) : (
                      <span className="text-lg font-semibold tracking-tight">{b.label}</span>
                    )}
                    <span className="mt-8 inline-flex items-center gap-1 text-sm text-brand-dark">
                      {ur ? "دیکھیں" : "Shop"}
                      <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
