import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/storefront/product-card";
import { productGridClass } from "@/components/storefront/product-grid";
import { NewsletterForm } from "@/components/storefront/newsletter-form";
import { SectionHeading, SectionShell } from "@/components/storefront/section-heading";
import { LookbookGrid } from "@/components/storefront/lookbook-grid";
import { Star, Truck, ShieldCheck, RefreshCcw, Ruler, ArrowUpRight, ArrowRight, ChevronDown } from "lucide-react";
import type { PublicProduct } from "@/server/modules/catalog/product.service";

const CATEGORY_ART: Record<string, string> = {
  men: "/catalog/lookbook-city.jpg",
  women: "/catalog/lookbook-women.jpg",
  kids: "/catalog/hero-family.jpg",
  comfort: "/catalog/lookbook-comfort.jpg",
};

const STYLE_ART = [
  {
    href: "/shop?type=sneaker",
    en: "Sneakers",
    ur: "سنیکرز",
    note: "Street & everyday",
    noteUr: "سڑک اور روزمرہ",
    image: "/catalog/style-sneakers.jpg",
    focus: "object-center",
  },
  {
    href: "/shop?type=sandal",
    en: "Sandals",
    ur: "سینڈل",
    note: "All-day straps",
    noteUr: "پورا دن آرام",
    image: "/catalog/lookbook-comfort.jpg",
    focus: "object-[center_55%]",
  },
  {
    href: "/shop?type=slide",
    en: "Slides",
    ur: "سلائیڈ",
    note: "House comfort",
    noteUr: "گھر کا آرام",
    image: "/catalog/style-slides.jpg",
    focus: "object-center",
  },
  {
    href: "/c/kids",
    en: "Kids",
    ur: "بچے",
    note: "Play-ready pairs",
    noteUr: "کھیل کی جوڑیاں",
    image: "/catalog/hero-family.jpg",
    focus: "object-[center_28%]",
  },
] as const;

type Cat = { id: string; slug: string; label: string };
type Review = { id: string; body: string; authorName: string; rating: number };

export function HomeView({
  locale,
  t,
  show,
  categories,
  newArrivals,
  family,
  bestsellers,
  reviews,
  faqs,
}: {
  locale: string;
  t: {
    kicker: string;
    title: string;
    body: string;
    cta: string;
    secondary: string;
    shopBy: string;
    featured: string;
    storyTitle: string;
    storyBody: string;
    trust: { cod: string; ship: string; exchange: string; fit: string };
  };
  show: (type: string) => boolean;
  categories: Cat[];
  newArrivals: PublicProduct[];
  family: PublicProduct[];
  bestsellers: PublicProduct[];
  reviews: Review[];
  faqs: { q: string; a: string }[];
}) {
  const ur = locale === "ur";
  const trust = [
    { icon: ShieldCheck, label: t.trust.cod, hint: ur ? "ادائیگی ڈلیوری پر" : "Pay when it arrives" },
    { icon: Truck, label: t.trust.ship, hint: ur ? "2–5 دن" : "Typically 2–5 days" },
    { icon: RefreshCcw, label: t.trust.exchange, hint: ur ? "سائز تبدیل" : "Unworn size swaps" },
    { icon: Ruler, label: t.trust.fit, hint: ur ? "EU سائز گائیڈ" : "EU size guide" },
  ];

  return (
    <div className="bg-paper">
      {show("hero") ? (
        <section className="relative overflow-hidden bg-[#f4f1eb]">
          <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-mint/50 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/3 h-56 w-56 rounded-full bg-white/70 blur-3xl" />
          <div className="relative mx-auto grid max-w-[90rem] items-center gap-8 px-4 py-10 md:px-8 md:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,38rem)] lg:gap-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-dark">{t.kicker}</p>
              <h1 className="mt-4 max-w-[12ch] text-[2.5rem] font-semibold leading-[1.04] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                {t.title}
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted md:text-lg">{t.body}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/shop" className="btn-primary h-12 rounded-full px-7">
                  {t.cta}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <Link href="/size-guide" className="btn-secondary h-12 rounded-full px-6">
                  {t.secondary}
                </Link>
              </div>
              {show("trust") ? (
                <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-black/[0.08] pt-7">
                  {trust.map((item) => (
                    <li key={item.label} className="flex items-start gap-2.5">
                      <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" strokeWidth={1.75} />
                      <div>
                        <p className="text-sm font-medium tracking-tight">{item.label}</p>
                        <p className="text-xs text-ink-faint">{item.hint}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="mx-auto w-full max-w-[26rem] lg:mx-0 lg:max-w-none">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="relative col-span-2 aspect-[4/3] overflow-hidden rounded-2xl bg-[#e8eef2]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/catalog/hero-pair.jpg" alt="" className="h-full w-full object-cover object-center" />
                </div>
                <div className="relative hidden aspect-[16/10] overflow-hidden rounded-xl bg-paper-warm sm:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/catalog/hero-display.jpg"
                    alt=""
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <div className="relative hidden aspect-[16/10] overflow-hidden rounded-xl bg-paper-warm sm:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/catalog/hero-family.jpg" alt="" className="h-full w-full object-cover object-[center_30%]" />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {show("trust") && !show("hero") ? (
        <section className="border-y border-paper-line bg-paper">
          <div className="mx-auto grid max-w-[90rem] grid-cols-2 gap-x-6 gap-y-7 px-4 py-7 md:grid-cols-4 md:px-8">
            {trust.map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-dark" strokeWidth={1.75} />
                <div>
                  <p className="text-sm font-medium tracking-tight">{item.label}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">{item.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {show("categoryGrid") && categories.length ? (
        <SectionShell>
          <SectionHeading eyebrow={ur ? "دریافت" : "Discover"} title={t.shopBy} href="/shop" action={ur ? "سب دیکھیں" : "Shop all"} />
          <div className="mt-8 grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {categories.map((c) => (
              <Link key={c.id} href={`/c/${c.slug}`} className="group relative isolate overflow-hidden rounded-2xl bg-paper-warm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={CATEGORY_ART[c.slug] || "/catalog/campaign-grid.jpg"}
                  alt=""
                  className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3 text-sm font-semibold text-white md:p-4 md:text-base">
                  {c.label}
                  <ArrowUpRight className="h-4 w-4 opacity-80 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </SectionShell>
      ) : null}

      {show("styleGrid") ? (
        <SectionShell className="bg-[#f6f7f5]">
          <SectionHeading
            eyebrow={ur ? "انداز" : "The mix"}
            title={ur ? "انداز سے خریدیں" : "Shop by style"}
            href="/shop"
            action={ur ? "سب" : "Shop all"}
          />
          <div className="mt-8 grid w-full grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {STYLE_ART.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group relative isolate overflow-hidden rounded-[1.4rem] bg-paper shadow-[0_10px_30px_rgba(17,17,17,0.06)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt=""
                  className={`aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105 ${s.focus}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-white md:p-4">
                  <span>
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                      {ur ? s.noteUr : s.note}
                    </span>
                    <span className="mt-1 block text-base font-semibold tracking-tight md:text-lg">
                      {ur ? s.ur : s.en}
                    </span>
                  </span>
                  <ArrowUpRight className="mb-0.5 h-4 w-4 shrink-0 opacity-80 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </SectionShell>
      ) : null}

      {show("productCarousel") && newArrivals.length ? (
        <SectionShell className="bg-[#f6f7f5]">
          <SectionHeading
            eyebrow={ur ? "تازہ جوڑیاں" : "Just dropped"}
            title={t.featured}
            href="/collections/new-arrivals"
            action={ur ? "سب" : "View all"}
          />
          <div className={`mt-8 ${productGridClass}`}>
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </SectionShell>
      ) : null}

      {show("family") && family.length ? (
        <SectionShell>
          <SectionHeading
            eyebrow={ur ? "گھر کے لیے" : "For the house"}
            title={ur ? "خاندانی آرام" : "Family Comfort"}
            href="/collections/family-comfort"
            action={ur ? "سب" : "View all"}
          />
          <div className={`mt-8 ${productGridClass}`}>
            {family.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </SectionShell>
      ) : null}

      {show("bestsellers") && bestsellers.length ? (
        <SectionShell className="pt-0 md:pt-0">
          <SectionHeading title={ur ? "سب سے زیادہ بکے" : "Best sellers"} href="/collections/bestsellers" action={ur ? "سب" : "View all"} />
          <div className={`mt-8 ${productGridClass}`}>
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </SectionShell>
      ) : null}

      {show("splitStory") ? (
        <SectionShell>
          <div className="grid overflow-hidden rounded-[2rem] bg-ink text-paper md:grid-cols-2">
            <div className="relative min-h-[280px] md:min-h-[420px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/catalog/story-family.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_20%]" />
            </div>
            <div className="flex flex-col justify-center px-7 py-12 md:px-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-light">Gujranwala</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">{t.storyTitle}</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-paper/75">{t.storyBody}</p>
              <Link href="/about" className="mt-8 inline-flex w-fit items-center gap-2 text-sm font-medium text-brand-mint hover:underline">
                {ur ? "کہانی پڑھیں" : "Read the story"}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </SectionShell>
      ) : null}

      {show("lookbook") ? (
        <SectionShell className="pt-0 md:pt-0">
          <SectionHeading eyebrow={ur ? "منظر" : "Editorial"} title="Lookbook" href="/lookbook" action={ur ? "کھولیں" : "Open"} />
          <LookbookGrid locale={locale} />
        </SectionShell>
      ) : null}

      {show("reviews") && reviews.length ? (
        <SectionShell className="bg-[#f6f7f5]">
          <SectionHeading eyebrow={ur ? "جائزے" : "Social proof"} title={ur ? "گاہک کیا کہتے ہیں" : "From the family"} />
          <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-6">
            {reviews.map((r) => (
              <blockquote key={r.id} className="rounded-[1.6rem] border border-white bg-paper p-6 shadow-[0_12px_40px_rgba(17,17,17,0.04)]">
                <div className="flex gap-0.5 text-brand">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-brand" : "text-paper-line"}`} />
                  ))}
                </div>
                <p className="mt-4 text-[15px] leading-relaxed">“{r.body}”</p>
                <footer className="mt-5 flex items-center gap-3 text-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-mist text-xs font-semibold text-brand-dark">
                    {r.authorName.slice(0, 1)}
                  </span>
                  <span className="font-medium">{r.authorName}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </SectionShell>
      ) : null}

      {show("social") ? (
        <SectionShell>
          <div className="overflow-hidden rounded-[2rem] bg-brand-mist px-7 py-12 md:flex md:items-center md:justify-between md:px-12">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-dark">Facebook first</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{ur ? "تال کے ساتھ چلیں" : "Follow the beat"}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                {ur
                  ? "وہی گوجرانوالہ جوڑیاں جو آپ فیس بک سے جانتے ہیں — اب سائز، اسٹاک اور گائیڈ کے ساتھ۔"
                  : "The same Gujranwala pairs you know from Facebook, now with sizes, stock, and a size guide on the site."}
              </p>
            </div>
            <Link href="/shop" className="btn-primary mt-6 h-12 rounded-full px-7 md:mt-0">
              {ur ? "خریداری شروع کریں" : "Shop the drop"}
            </Link>
          </div>
        </SectionShell>
      ) : null}

      {show("faq") ? (
        <SectionShell className="pt-0 md:pt-0">
          <SectionHeading title="FAQ" href="/faq" action={ur ? "سب سوالات" : "All questions"} />
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {faqs.slice(0, 4).map((item) => (
              <details key={item.q} className="group rounded-2xl border border-paper-line bg-paper px-5 py-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-ink-faint transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </SectionShell>
      ) : null}

      {show("newsletter") ? (
        <SectionShell>
          <div className="rounded-[2rem] bg-ink px-7 py-12 text-paper md:flex md:items-center md:justify-between md:gap-10 md:px-12">
            <div className="max-w-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-light">
                {ur ? "ڈراپ" : "Next drop"}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{ur ? "ڈراپ کی اطلاع" : "Get the next drop"}</h2>
              <p className="mt-3 text-sm text-paper/65">
                {ur ? "نئی جوڑیوں کی اطلاع براہ راست انباکس میں۔" : "New pairs, sizes, and family drops — straight to your inbox."}
              </p>
            </div>
            <div className="mt-6 min-w-0 flex-1 md:mt-0 md:max-w-lg">
              <NewsletterForm dark />
            </div>
          </div>
        </SectionShell>
      ) : null}
    </div>
  );
}
