import { BRAND } from "@/shared/constants";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function localizedPath(locale: string, path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}/${locale}${clean === "/" ? "" : clean}`;
}

export function organizationJsonLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    url,
    slogan: BRAND.tagline.en,
    logo: `${url}/favicon.png`,
    email: "sahilmubeen30@gmail.com",
    telephone: "+923069158103",
    address: {
      "@type": "PostalAddress",
      addressLocality: BRAND.city,
      addressCountry: "PK",
    },
  };
}

export function openGraphBase(locale: string) {
  const ur = locale === "ur";
  return {
    type: "website" as const,
    locale: ur ? "ur_PK" : "en_PK",
    siteName: BRAND.name,
    title: ur ? `Agile Sole — ${BRAND.tagline.ur}` : `Agile Sole — ${BRAND.tagline.en}`,
    description: ur ? BRAND.positioning.ur : BRAND.positioning.en,
    url: localizedPath(locale, "/"),
    images: [{ url: `${siteUrl()}/favicon.png`, alt: "Agile Sole" }],
  };
}
