"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { ProductCard } from "@/components/storefront/product-card";
import { productGridClass } from "@/components/storefront/product-grid";
import { useWishlist } from "@/components/storefront/wishlist-provider";
import { Link } from "@/i18n/navigation";
import type { PublicProduct } from "@/server/modules/catalog/product.service";

export default function WishlistPage() {
  const locale = useLocale();
  const { slugs } = useWishlist();
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

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-10 md:px-8">
      <h1 className="text-3xl font-semibold">Wishlist</h1>
      {products === null ? <p className="mt-6 text-ink-muted">Loading…</p> : null}
      {products && products.length === 0 ? (
        <div className="mt-6 max-w-md">
          <p className="text-ink-muted">No saved pairs yet. Tap the heart on a product.</p>
          <Link href="/shop" className="mt-4 inline-block text-sm text-brand-dark">
            Browse the shop
          </Link>
        </div>
      ) : null}
      {products && products.length ? (
        <div className={`mt-8 ${productGridClass}`}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
