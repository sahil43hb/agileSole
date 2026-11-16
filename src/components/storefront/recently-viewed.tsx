"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "./product-card";
import { productGridClass } from "./product-grid";
import type { PublicProduct } from "@/server/modules/catalog/product.service";

const KEY = "as_recent";

export function trackView(slug: string) {
  try {
    const prev = JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
    const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, 8);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function RecentlyViewed({ locale, exclude }: { locale: string; exclude?: string }) {
  const t = useTranslations("pdp");
  const [products, setProducts] = useState<PublicProduct[]>([]);

  useEffect(() => {
    const slugs = (() => {
      try {
        return (JSON.parse(localStorage.getItem(KEY) || "[]") as string[]).filter((s) => s !== exclude);
      } catch {
        return [];
      }
    })();
    if (!slugs.length) return;
    fetch(`/api/v1/catalog/products/by-slugs?locale=${locale}&slugs=${encodeURIComponent(slugs.join(","))}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setProducts(json.data.products);
      })
      .catch(() => {});
  }, [locale, exclude]);

  if (!products.length) return null;
  return (
    <section className="mt-16">
      <h2 className="text-xl font-semibold">{t("recently")}</h2>
      <div className={`mt-6 ${productGridClass}`}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
