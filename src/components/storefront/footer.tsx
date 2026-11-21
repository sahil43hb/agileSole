import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Wordmark } from "@/components/brand/logo";
import { NewsletterForm } from "./newsletter-form";
import { FooterSocialLinks } from "./social-links";
import { getPublicSettings } from "@/server/modules/admin/settings.service";
import { geoLabel } from "@/content/geo-pk";

export async function StoreFooter() {
  const t = await getTranslations("footer");
  const n = await getTranslations("nav");
  const locale = await getLocale();
  const year = new Date().getFullYear();
  let logoSrc = "/favicon.png";
  let whatsapp = process.env.NEXT_PUBLIC_WHATSAPP || "";
  let storeName = "Agile Sole";
  let city = "Gujranwala";
  try {
    const settings = await getPublicSettings();
    logoSrc = settings.logo || logoSrc;
    whatsapp = settings.whatsapp || whatsapp;
    storeName = settings.name || storeName;
    city = settings.city || city;
  } catch {
    // fallback mark
  }
  const cityLabel = geoLabel(city, locale);

  return (
    <footer className="border-t border-paper-line bg-[#f3f1ec]">
      <div className="mx-auto grid max-w-[90rem] gap-8 px-4 pt-8 pb-3 md:grid-cols-4 md:px-8 md:pt-10 md:pb-4">
        <div className="flex min-w-0 flex-col">
          <Wordmark src={logoSrc} alt={storeName} />
          <p className="mt-3 max-w-xs text-sm text-ink-muted">{t("tagline")}</p>
          <p className="mt-4 text-sm font-medium">{t("newDrops")}</p>
          <NewsletterForm />
          <div className="mt-auto pt-4">
            <FooterSocialLinks whatsapp={whatsapp} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:contents">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">{t("shop")}</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              <li><Link href="/c/men">{n("men")}</Link></li>
              <li><Link href="/c/women">{n("women")}</Link></li>
              <li><Link href="/c/kids">{n("kids")}</Link></li>
              <li><Link href="/c/comfort">{n("comfort")}</Link></li>
              <li><Link href="/lookbook">{n("lookbook")}</Link></li>
              <li><Link href="/brands">{n("brands")}</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">{t("help")}</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              <li><Link href="/size-guide">{t("sizeGuide")}</Link></li>
              <li><Link href="/track-order">{n("track")}</Link></li>
              <li><Link href="/contact">{t("contact")}</Link></li>
              <li><Link href="/faq">{t("faq")}</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">{t("legal")}</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              <li><Link href="/about">{t("about")}</Link></li>
              <li><Link href="/shipping-returns">{t("shipping")}</Link></li>
              <li><Link href="/privacy">{t("privacy")}</Link></li>
              <li><Link href="/terms">{t("terms")}</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-paper-line">
        <div className="mx-auto grid max-w-[90rem] gap-3 px-4 py-4 pb-20 text-xs text-ink-muted md:grid-cols-[1.2fr_auto_auto] md:items-center md:px-8 md:py-4 md:pb-4 md:pe-24">
          <p>
            {t("rights", { year, name: storeName })}
            <span className="text-ink-faint"> · {t("location", { city: cityLabel })}</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="hover:text-ink">
              {t("privacy")}
            </Link>
            <Link href="/terms" className="hover:text-ink">
              {t("terms")}
            </Link>
            <Link href="/shipping-returns" className="hover:text-ink">
              {t("shipping")}
            </Link>
            <span className="text-ink-faint">{t("cod")}</span>
          </div>
          <FooterSocialLinks whatsapp={whatsapp} />
        </div>
      </div>
    </footer>
  );
}
