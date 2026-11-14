import { getLocale, getTranslations } from "next-intl/server";
import { HeaderChrome } from "./header-chrome";
import { menuPayload } from "@/server/modules/catalog/home.service";
import { getAnnouncement } from "@/server/modules/cms/cms.service";
import { getPublicSettings } from "@/server/modules/admin/settings.service";

export async function StoreHeader() {
  const locale = await getLocale();
  const t = await getTranslations("nav");
  const announceT = await getTranslations();
  let menu = { categories: [] as Awaited<ReturnType<typeof menuPayload>>["categories"], collections: [] as Awaited<ReturnType<typeof menuPayload>>["collections"] };
  let announce = announceT("announce");
  let logoSrc = "/favicon.png";
  try {
    const [nav, cms, publicSettings] = await Promise.all([
      menuPayload(locale),
      getAnnouncement(),
      getPublicSettings(),
    ]);
    menu = nav;
    announce = locale === "ur" ? cms.ur || cms.en : cms.en;
    logoSrc = publicSettings.logo || logoSrc;
  } catch {
    // keep empty menu if db is warming
  }

  return (
    <HeaderChrome
      announce={announce}
      logoSrc={logoSrc}
      labels={{
        search: t("search"),
        account: t("account"),
        wishlist: t("wishlist"),
        cart: t("cart"),
      }}
      categories={menu.categories.map((c) => ({
        slug: c.slug,
        label: c.label,
        children: c.children.map((ch) => ({ slug: ch.slug, label: ch.label })),
      }))}
      collections={menu.collections.map((c) => ({ slug: c.slug, label: c.label }))}
    />
  );
}
