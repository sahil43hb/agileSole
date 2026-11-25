"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { formatPkr } from "@/shared/money";
import type { PublicProduct } from "@/server/modules/catalog/product.service";
import { useStoreIdentity } from "@/components/store-identity";
import { productTypeLabel } from "@/shared/product-types";
import { useLocale } from "next-intl";

export function ProductBuyBox({ product }: { product: PublicProduct }) {
  const locale = useLocale();
  const { productTypes } = useStoreIdentity();
  const [color, setColor] = useState(product.colors[0]?.name || "");
  const [size, setSize] = useState("");

  const colorSizes = useMemo(() => {
    return product.variants.filter((v) => !color || v.color === color);
  }, [product.variants, color]);

  const selected = product.variants.find((v) => v.color === color && (v.size || v.sizeEu) === size);
  const price = selected?.price ?? product.price;
  const compareAt = selected?.compareAt ?? product.compareAt;
  const image = selected?.image || product.images[0];
  const inStock = selected ? selected.onHand > 0 : colorSizes.some((v) => v.onHand > 0);

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="aspect-square bg-brand-mist">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.title} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">
          {product.gender} · {productTypeLabel(product.type, productTypes, locale)}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{product.title}</h1>
        <p className="mt-4 text-xl">
          {formatPkr(price)}
          {compareAt ? (
            <span className="ms-2 text-base text-ink-faint line-through">{formatPkr(compareAt)}</span>
          ) : null}
        </p>
        {product.description ? <p className="mt-4 text-ink-muted">{product.description}</p> : null}
        {product.material ? <p className="mt-2 text-sm">Material: {product.material}</p> : null}
        {product.fitNote ? <p className="mt-2 text-sm">Fit: {product.fitNote}</p> : null}

        {product.colors.length ? (
          <div className="mt-6">
            <p className="text-sm font-medium">Color</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setColor(c.name);
                    setSize("");
                  }}
                  className={`border px-3 py-2 text-sm ${color === c.name ? "border-ink bg-ink text-paper" : "border-paper-line"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          <p className="text-sm font-medium">{(product.sizeSystem || "eu").toUpperCase()} size</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const variant = product.variants.find((v) => (v.size || v.sizeEu) === s && (!color || v.color === color));
              const available = (variant?.onHand || 0) > 0;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!available}
                  onClick={() => setSize(s)}
                  className={`min-w-12 border px-3 py-2 text-sm ${
                    size === s ? "border-ink bg-ink text-paper" : "border-paper-line"
                  } disabled:opacity-30`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-sm text-ink-muted">
          {selected
            ? selected.onHand > 0
              ? `${selected.onHand} in stock · ${selected.sku}`
              : "Out of stock in this size"
            : inStock
              ? "Select a size"
              : "Currently out of stock"}
        </p>

        <Link href="/size-guide" className="mt-4 inline-block text-sm text-brand-dark">
          Size guide
        </Link>

        <p className="mt-8 text-sm text-ink-faint">
          Add to cart and checkout land in a later phase. Stock is already tracked per size.
        </p>
      </div>
    </div>
  );
}
