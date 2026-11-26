"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PublicProduct } from "@/server/modules/catalog/product.service";
import { formatPkr } from "@/shared/money";
import { useWishlist } from "./wishlist-provider";
import { QuickAddButton } from "./quick-add";

export function ProductCard({
  product,
  compact = true,
  purchased = false,
  quickAdd = false,
}: {
  product: PublicProduct;
  compact?: boolean;
  purchased?: boolean;
  quickAdd?: boolean;
}) {
  const t = useTranslations("pdp");
  const c = useTranslations("common");
  const w = useTranslations("wishlist");
  const image = product.images[0];
  const hover = product.images[1] || image;
  const { has, toggle } = useWishlist();
  const saved = has(product.slug);

  return (
    <div className="group relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div
          className={`relative overflow-hidden bg-brand-mist ${compact ? "rounded-2xl" : "rounded-[1.4rem]"} ${product.inStock ? "" : "opacity-60"}`}
        >
          {image ? (
            <div className="relative aspect-[5/6]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt=""
                className={`h-full w-full object-cover transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.06] ${
                  hover !== image
                    ? "[@media(hover:hover)]:group-hover:opacity-0 [@media(hover:hover)]:group-hover:blur-[1px]"
                    : ""
                }`}
              />
              {hover && hover !== image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hover}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-0 scale-[1.08] transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-100 [@media(hover:hover)]:group-hover:opacity-100"
                />
              ) : null}
            </div>
          ) : (
            <div className="flex aspect-[5/6] h-full items-end justify-between p-3 text-xs text-ink-muted">
              <span>{product.gender}</span>
              <span>{product.colors.map((c) => c.name).join(" · ")}</span>
            </div>
          )}
          <div className="absolute start-3 top-3 flex flex-col gap-1">
            {product.percentOff ? (
              <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-paper">
                -{product.percentOff}%
              </span>
            ) : null}
            {!product.inStock ? (
              <span className="rounded-full bg-paper px-2.5 py-1 text-[10px] font-medium">{c("soldOut")}</span>
            ) : null}
            {purchased ? (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink shadow-sm">
                {w("bought")}
              </span>
            ) : null}
          </div>
        </div>
        <div className={`px-0.5 ${compact ? "mt-2" : "mt-3.5"}`}>
          {product.brandLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.brandLogo} alt="" className="mb-1.5 h-5 w-auto max-w-[88px] object-contain object-left" />
          ) : product.brandName ? (
            <p className="mb-0.5 text-[11px] uppercase tracking-[0.12em] text-ink-muted">{product.brandName}</p>
          ) : null}
          <p className={`font-medium tracking-tight transition group-hover:text-brand-dark ${compact ? "text-[13px]" : "text-sm"}`}>{product.title}</p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
            <span>{formatPkr(product.price)}</span>
            {product.compareAt ? (
              <span className="text-ink-faint line-through">{formatPkr(product.compareAt)}</span>
            ) : null}
          </p>
          {product.colors.length ? (
            <div className="mt-2.5 flex gap-1.5">
              {product.colors.slice(0, 5).map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="h-3.5 w-3.5 rounded-full border border-black/10 ring-1 ring-white"
                  style={{ background: c.hex || "#ccc" }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </Link>
      <button
        type="button"
        aria-label={t("wishlist")}
        onClick={() => toggle(product.slug)}
        className={`absolute end-2.5 top-2.5 flex items-center justify-center rounded-full bg-white/95 text-ink shadow-sm backdrop-blur transition hover:scale-105 ${compact ? "h-8 w-8" : "h-9 w-9"}`}
      >
        <Heart className={`h-4 w-4 ${saved ? "fill-brand text-brand" : ""}`} />
      </button>
      {quickAdd ? (
        <div className="px-0.5">
          <QuickAddButton product={product} label={purchased ? c("buyAgain") : c("addToBag")} />
        </div>
      ) : null}
    </div>
  );
}
