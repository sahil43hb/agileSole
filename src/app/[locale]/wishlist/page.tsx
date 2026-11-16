"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ProductCard } from "@/components/storefront/product-card";
import { productGridClass } from "@/components/storefront/product-grid";
import { useWishlist } from "@/components/storefront/wishlist-provider";
import { Link } from "@/i18n/navigation";
import type { PublicProduct } from "@/server/modules/catalog/product.service";

type Tab = "saved" | "bought";

export default function WishlistPage() {
  const locale = useLocale();
  const t = useTranslations("wishlist");
  const c = useTranslations("common");
  const { slugs, bought, isBought } = useWishlist();
  const [tab, setTab] = useState<Tab>("saved");
  const [products, setProducts] = useState<PublicProduct[] | null>(null);

  useEffect(() => {
    if (!slugs.length) {
      setProducts([]);
      return;
    }
    fetch(`/api/v1/catalog/products/by-slugs?locale=${locale}&slugs=${encodeURIComponent(slugs.join(","))}`)
      .then((r) => r.json())
      .then((json) => setProducts(json.ok ? json.data.products : []))
      .catch(() => setProducts([]));
  }, [slugs, locale]);

  const savedProducts = useMemo(() => (products || []).filter((p) => !isBought(p.slug)), [products, isBought]);
  const boughtProducts = useMemo(() => (products || []).filter((p) => isBought(p.slug)), [products, isBought]);
  const visible = tab === "saved" ? savedProducts : boughtProducts;

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-10 md:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-1 text-sm text-ink-muted">{t("hint")}</p>

      <div className="mt-6 inline-flex rounded-full bg-[#f2f4f2] p-1">
        <TabButton active={tab === "saved"} onClick={() => setTab("saved")}>
          {t("saved")} {products !== null ? savedProducts.length : ""}
        </TabButton>
        <TabButton active={tab === "bought"} onClick={() => setTab("bought")}>
          {t("bought")} {products !== null ? boughtProducts.length : ""}
        </TabButton>
      </div>

      {products === null ? <p className="mt-8 text-ink-muted">{c("loading")}</p> : null}

      {products && visible.length === 0 ? (
        <div className="mt-10 max-w-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f2f4f2]">
            <Heart className="h-5 w-5 text-ink-muted" />
          </div>
          <p className="mt-4 text-ink-muted">
            {tab === "saved" ? (bought.length ? t("emptySavedBought") : t("emptySaved")) : t("emptyBought")}
          </p>
          <Link href="/shop" className="mt-4 inline-block text-sm font-medium text-brand-dark">
            {t("browse")}
          </Link>
        </div>
      ) : null}

      {products && visible.length ? (
        <div className={`mt-8 ${productGridClass}`}>
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} purchased={tab === "bought"} quickAdd />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-full px-4 text-sm font-medium ${active ? "bg-white text-ink shadow-sm" : "text-ink-muted"}`}
    >
      {children}
    </button>
  );
}
