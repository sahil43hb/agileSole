import { BRAND } from "@/shared/constants";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function localizedPath(locale: string, path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}/${locale}${clean === "/" ? "" : clean}`;
}

export function organizationJsonLd(store?: { name?: string; city?: string; email?: string; logo?: string }) {
  const url = siteUrl();
  const name = store?.name?.trim() || BRAND.name;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    slogan: BRAND.tagline.en,
    logo: store?.logo ? (store.logo.startsWith("http") ? store.logo : `${url}${store.logo}`) : `${url}/favicon.png`,
    email: store?.email || "sahilmubeen30@gmail.com",
    telephone: "+923069158103",
    address: {
      "@type": "PostalAddress",
      addressLocality: store?.city || BRAND.city,
      addressCountry: "PK",
    },
  };
}

export function openGraphBase(
  locale: string,
  store?: { name?: string },
) {
  const ur = locale === "ur";
  const name = store?.name?.trim() || BRAND.name;
  return {
    type: "website" as const,
    locale: ur ? "ur_PK" : "en_PK",
    siteName: name,
    title: ur ? `${name} — ${BRAND.tagline.ur}` : `${name} — ${BRAND.tagline.en}`,
    description: ur ? BRAND.positioning.ur : BRAND.positioning.en,
    url: localizedPath(locale, "/"),
    images: [{ url: `${siteUrl()}/favicon.png`, alt: name }],
  };
}
