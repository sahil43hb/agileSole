import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { StoreHeader } from "@/components/storefront/header";
import { StoreFooter } from "@/components/storefront/footer";
import { MobileNav } from "@/components/storefront/mobile-nav";
import { LocaleDocument } from "@/components/storefront/locale-document";
import { WishlistProvider } from "@/components/storefront/wishlist-provider";
import { CartProvider } from "@/components/storefront/cart-provider";
import { MiniCart } from "@/components/storefront/mini-cart";
import { AuthProvider } from "@/components/storefront/auth-provider";
import { CookieNotice } from "@/components/storefront/cookie-notice";
import { Analytics } from "@/components/storefront/analytics";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { BRAND } from "@/shared/constants";
import { localizedPath, openGraphBase, organizationJsonLd, siteUrl } from "@/lib/site";
import { getPublicSettings } from "@/server/modules/admin/settings.service";
import { brandIconHref } from "@/lib/brand-icon";
import { BrandIconSync } from "@/components/brand/brand-icon-sync";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const ur = locale === "ur";
  const title = ur ? `Agile Sole — ${BRAND.tagline.ur}` : `Agile Sole — ${BRAND.tagline.en}`;
  const description = ur ? BRAND.positioning.ur : BRAND.positioning.en;
  const { logo } = await getPublicSettings();
  const icon = brandIconHref(logo);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: "%s · Agile Sole" },
    description,
    openGraph: openGraphBase(locale),
    twitter: { card: "summary_large_image", title, description, images: [`${siteUrl()}/favicon.png`] },
    icons: {
      icon: [{ url: icon }],
      apple: [{ url: icon }],
      shortcut: [icon],
    },
    alternates: {
      canonical: localizedPath(locale, "/"),
      languages: {
        en: localizedPath("en", "/"),
        ur: localizedPath("ur", "/"),
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "ur" ? "rtl" : "ltr";
  const { logo, whatsapp: storeWhatsapp } = await getPublicSettings();
  const whatsapp = storeWhatsapp || process.env.NEXT_PUBLIC_WHATSAPP || "";

  return (
    <div dir={dir} lang={locale} className={locale === "ur" ? "font-urdu min-h-dvh" : "min-h-dvh"}>
      <BrandIconSync src={logo} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      <LocaleDocument locale={locale} />
      <NextIntlClientProvider messages={messages}>
        <WishlistProvider>
          <AuthProvider>
          <CartProvider>
            <StoreHeader />
            <main className="pb-20 md:pb-0">{children}</main>
            <StoreFooter />
            <MobileNav />
            <MiniCart />
            <CookieNotice />
            <Analytics />
            <WhatsAppButton phone={whatsapp} />
          </CartProvider>
          </AuthProvider>
        </WishlistProvider>
      </NextIntlClientProvider>
    </div>
  );
}
