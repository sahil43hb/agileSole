"use client";

import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export type MenuCategory = {
  slug: string;
  label: string;
  children: { slug: string; label: string }[];
};

const FEATURE: Record<string, { image: string; caption: string }> = {
  men: { image: "/catalog/track-navy.jpg", caption: "City miles" },
  women: { image: "/catalog/dual-strap-sandals.jpg", caption: "House comfort" },
  kids: { image: "/catalog/family-courtyard.jpg", caption: "Kids beat" },
  comfort: { image: "/catalog/pink-sole.jpg", caption: "Everyday ease" },
};

const COLLECTION_ART: Record<string, string> = {
  bestsellers: "/catalog/grey-pair.jpg",
  "family-comfort": "/catalog/family-comfort-collage.jpg",
  "facebook-drop": "/catalog/pulse-mint-display.jpg",
  "new-arrivals": "/catalog/banner-new-in.jpg",
};

function ShopLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group/link flex items-center justify-between rounded-lg px-2 py-2 text-[15px] text-ink transition hover:bg-[#f3f7f4] hover:text-brand-dark"
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ink-faint opacity-0 transition group-hover/link:opacity-100" />
    </Link>
  );
}

function NavItem({
  href,
  active,
  accent,
  children,
}: {
  href: string;
  active?: boolean;
  accent?: boolean;
  children: string;
}) {
  return (
    <Link href={href} className="group/item relative flex items-center px-0.5">
      <span
        className={`rounded-full px-3.5 py-1.5 text-[13.5px] font-medium tracking-[-0.015em] transition ${
          active
            ? "bg-ink text-paper"
            : accent
              ? "bg-brand-mist text-brand-dark hover:bg-brand-mint"
              : "text-ink/70 hover:bg-[#eef1ee] hover:text-ink"
        }`}
      >
        {children}
      </span>
    </Link>
  );
}

export function MegaMenu({
  categories,
  collections,
}: {
  categories: MenuCategory[];
  collections: { slug: string; label: string }[];
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <div className="hidden min-w-0 flex-1 justify-center self-stretch md:flex">
      <nav className="flex items-stretch gap-0.5 whitespace-nowrap xl:gap-1">
        <NavItem href="/" active={pathname === "/"}>
          {t("home")}
        </NavItem>
        {categories.map((cat) => {
          const feature = FEATURE[cat.slug] || FEATURE.men;
          const active = pathname === `/c/${cat.slug}` || pathname.startsWith(`/c/${cat.slug}/`);
          return (
            <div key={cat.slug} className="group/nav flex items-stretch">
              <NavItem href={`/c/${cat.slug}`} active={active}>
                {cat.label}
              </NavItem>
              <div className="invisible absolute inset-x-0 top-full z-50 opacity-0 transition duration-150 group-hover/nav:visible group-hover/nav:opacity-100">
                <div className="mx-auto w-[min(58rem,calc(100vw-1.5rem))] overflow-hidden rounded-b-3xl border border-t-0 border-paper-line/70 bg-white shadow-[0_28px_60px_rgba(17,17,17,0.12)]">
                  <div className="grid grid-cols-[12.5rem_minmax(0,1fr)_13.5rem] px-5 py-5 md:px-6">
                    <div className="flex flex-col justify-between pe-5">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-faint">
                          Shop {cat.label}
                        </p>
                        <ul className="mt-3">
                          <li>
                            <ShopLink href={`/c/${cat.slug}`}>{`All ${cat.label}`}</ShopLink>
                          </li>
                          {cat.children.map((child) => (
                            <li key={child.slug}>
                              <ShopLink href={`/c/${cat.slug}/${child.slug}`}>{child.label}</ShopLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <ul className="mt-8 border-t border-paper-line/70 pt-4 text-sm text-ink-muted">
                        <li>
                          <ShopLink href="/collections/new-arrivals">New arrivals</ShopLink>
                        </li>
                        <li>
                          <ShopLink href="/shop?onSale=1">Sale</ShopLink>
                        </li>
                        <li>
                          <ShopLink href="/size-guide">Size guide</ShopLink>
                        </li>
                      </ul>
                    </div>

                    <div className="border-x border-paper-line/60 px-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-faint">Collections</p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {collections.map((col) => (
                          <Link
                            key={col.slug}
                            href={`/collections/${col.slug}`}
                            className="group/card relative isolate overflow-hidden rounded-2xl bg-[#f4f6f4]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={COLLECTION_ART[col.slug] || "/catalog/campaign-grid.jpg"}
                              alt=""
                              className="h-32 w-full object-cover transition duration-500 group-hover/card:scale-105"
                            />
                            <span className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />
                            <span className="absolute inset-x-0 bottom-0 px-3.5 py-3 text-[13px] font-medium leading-tight text-white">
                              {col.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <Link href="/lookbook" className="group/look relative ms-5 isolate overflow-hidden rounded-2xl bg-[#111]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={feature.image}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover/look:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/15 to-transparent" />
                      <span className="absolute inset-x-0 bottom-0 p-5 text-white">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">Lookbook</span>
                        <span className="mt-1.5 block text-lg font-medium leading-snug">{feature.caption}</span>
                        <span className="mt-3 inline-flex text-[13px] text-[#c8ecd4]">Explore →</span>
                      </span>
                    </Link>
                  </div>
                  <div className="border-t border-paper-line/60 bg-[#f6f8f6]">
                    <div className="flex items-center justify-between px-5 py-3 md:px-6">
                      <p className="text-sm text-ink-muted">Every Step a Perfect Beat</p>
                      <Link href="/lookbook" className="text-sm font-medium text-brand-dark hover:underline">
                        View lookbook
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <NavItem href="/collections/new-arrivals" active={pathname.startsWith("/collections/new-arrivals")}>
          New in
        </NavItem>
        <NavItem href="/shop?onSale=1" accent>
          Sale
        </NavItem>
        <NavItem href="/brands" active={pathname.startsWith("/brands")}>
          Brands
        </NavItem>
      </nav>
    </div>
  );
}
