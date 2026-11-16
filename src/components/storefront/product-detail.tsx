"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, Heart, RefreshCw, Share2, Star, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatPkr } from "@/shared/money";
import type { PublicProduct } from "@/server/modules/catalog/product.service";
import { useWishlist } from "./wishlist-provider";
import { useCart } from "./cart-provider";
import { trackView } from "./recently-viewed";
import { ProductGallery } from "./product-gallery";

type Chart = { title: string; rows: { eu?: string; pk?: string; uk?: string; us?: string; cm?: string }[] };

export function ProductDetail({
  product,
  chart,
  reviews,
}: {
  product: PublicProduct;
  chart: Chart | null;
  reviews?: { average: number; count: number };
}) {
  const { has, toggle } = useWishlist();
  const { add } = useCart();
  const [color, setColor] = useState(product.colors[0]?.name || "");
  const [size, setSize] = useState("");
  const [guide, setGuide] = useState(false);
  const [sizePulse, setSizePulse] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    trackView(product.slug);
  }, [product.slug]);

  const gallery = product.images.length ? product.images : [];
  const selected = product.variants.find((v) => v.color === color && v.sizeEu === size);
  const price = selected?.price ?? product.price;
  const compareAt = selected?.compareAt ?? product.compareAt;
  const activeImage = selected?.image && gallery.includes(selected.image) ? selected.image : selected?.image;
  const colorSizes = useMemo(
    () => product.variants.filter((v) => !color || v.color === color),
    [product.variants, color],
  );
  const inStock = selected ? selected.onHand > 0 : colorSizes.some((v) => v.onHand > 0);
  const low = selected && selected.onHand > 0 && selected.onHand <= 2;
  const filled = reviews?.count ? Math.round(reviews.average) : 0;

  function requireSize() {
    if (!size) {
      setSizePulse(true);
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  async function addToBag() {
    if (!requireSize()) return;
    if (!selected) return;
    const err = await add(selected.sku, 1);
    setNote(err || "Added to bag");
  }

  return (
    <div>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,26rem)] lg:gap-14">
        <ProductGallery images={gallery} title={product.title} activeSrc={activeImage} />

        <div className="lg:sticky lg:top-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
            {product.gender} · {product.type}
          </p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{product.title}</h1>
            <button
              type="button"
              aria-label="Wishlist"
              onClick={() => toggle(product.slug)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f3f5f2] transition hover:bg-[#e8ece8]"
            >
              <Heart className={`h-5 w-5 ${has(product.slug) ? "fill-brand text-brand" : ""}`} />
            </button>
          </div>

          {reviews?.count ? (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
              <span className="flex gap-0.5 text-brand">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < filled ? "fill-brand" : "text-paper-line"}`} />
                ))}
              </span>
              {reviews.average.toFixed(1)} · {reviews.count} review{reviews.count === 1 ? "" : "s"}
            </a>
          ) : null}

          <p className="mt-4 flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight">{formatPkr(price)}</span>
            {compareAt ? <span className="text-base text-ink-faint line-through">{formatPkr(compareAt)}</span> : null}
            {product.percentOff ? (
              <span className="rounded-full bg-brand-mist px-2 py-0.5 text-xs font-semibold text-brand-dark">-{product.percentOff}%</span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-ink-muted">Prices in PKR. Tax shown at checkout when it applies.</p>
          {product.description ? <p className="mt-4 text-sm leading-relaxed text-ink-muted">{product.description}</p> : null}
          {product.fitNote ? (
            <p className="mt-3 rounded-2xl bg-[#f6f7f5] px-4 py-2.5 text-sm">
              <span className="font-medium">Fit.</span> {product.fitNote}
            </p>
          ) : null}

          {product.colors.length ? (
            <div className="mt-6">
              <p className="text-xs font-medium text-ink-muted">
                Color <span className="text-ink">{color}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setColor(c.name);
                      const still = product.variants.some((v) => v.color === c.name && v.sizeEu === size && v.onHand > 0);
                      if (!still) setSize("");
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${
                      color === c.name ? "bg-ink text-paper ring-ink" : "bg-white text-ink ring-black/[0.08] hover:bg-[#f6f7f5]"
                    }`}
                  >
                    {c.hex ? (
                      <span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c.hex }} />
                    ) : null}
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div id="size-picker" className={`mt-6 rounded-[1.2rem] ${sizePulse ? "ring-2 ring-brand ring-offset-4" : ""}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-ink-muted">EU size</p>
              {chart ? (
                <button type="button" className="text-sm font-medium text-brand-dark hover:underline" onClick={() => setGuide(true)}>
                  Size guide
                </button>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const variant = product.variants.find((v) => v.sizeEu === s && (!color || v.color === color));
                const available = (variant?.onHand || 0) > 0;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!available}
                    onClick={() => {
                      setSize(s);
                      setSizePulse(false);
                    }}
                    data-testid={`size-${s}`}
                    className={`min-w-12 rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition ${
                      size === s ? "bg-ink text-paper ring-ink" : "bg-white text-ink ring-black/[0.08] hover:bg-[#f6f7f5]"
                    } disabled:opacity-30`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-3 text-sm text-ink-muted">
            {selected
              ? selected.onHand > 0
                ? low
                  ? `Only ${selected.onHand} left`
                  : `${selected.onHand} in stock`
                : "Out of stock in this size"
              : inStock
                ? "Select a size"
                : "Currently out of stock"}
          </p>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              data-testid="add-to-cart"
              className="btn-primary h-12 flex-1 rounded-full px-7"
              onClick={() => void addToBag()}
            >
              Add to cart
            </button>
            <button
              type="button"
              aria-label="Share"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f5f2] transition hover:bg-[#e8ece8]"
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) navigator.share({ title: product.title, url }).catch(() => {});
                else navigator.clipboard.writeText(url);
              }}
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
          {note ? <p className="mt-3 text-sm text-brand-dark">{note}</p> : null}

          <ul className="mt-6 space-y-2.5 rounded-[1.35rem] bg-[#f6f7f5] p-4 text-sm text-ink-muted">
            <li className="flex items-center gap-2.5">
              <Banknote className="h-4 w-4 text-brand" />
              Cash on delivery — pay when you receive
            </li>
            <li className="flex items-center gap-2.5">
              <Truck className="h-4 w-4 text-brand" />
              City delivery typically 2–5 days across Pakistan
            </li>
            <li className="flex items-center gap-2.5">
              <RefreshCw className="h-4 w-4 text-brand" />
              Easy size exchange.{" "}
              <Link href="/shipping-returns" className="font-medium text-brand-dark hover:underline">
                Returns
              </Link>
            </li>
          </ul>

          <dl className="mt-6 grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2 text-sm">
            {product.material ? (
              <>
                <dt className="text-ink-muted">Material</dt>
                <dd>{product.material}</dd>
              </>
            ) : null}
            <dt className="text-ink-muted">Type</dt>
            <dd className="capitalize">{product.type}</dd>
          </dl>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-black/[0.06] bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">{formatPkr(price)}</p>
          <button type="button" className="btn-primary h-11 rounded-full px-5" onClick={() => void addToBag()}>
            Add to cart
          </button>
        </div>
      </div>

      {guide && chart ? (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/40 md:items-center md:justify-center" onClick={() => setGuide(false)}>
          <div
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-[1.6rem] bg-white p-6 shadow-xl md:max-w-xl md:rounded-[1.6rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold tracking-tight">{chart.title}</h2>
            <p className="mt-2 text-sm text-ink-muted">
              EU is the size we sell. PK is Pakistan (same as UK in most local shops). US is American. CM is foot length — stand on paper, mark heel and longest toe, then match centimetres.
            </p>
            <table className="mt-4 w-full text-start text-sm">
              <thead>
                <tr className="border-b border-black/[0.06] text-ink-muted">
                  <th className="py-2 font-medium">EU</th>
                  <th className="font-medium">PK</th>
                  <th className="font-medium">UK</th>
                  <th className="font-medium">US</th>
                  <th className="font-medium">cm</th>
                </tr>
              </thead>
              <tbody>
                {chart.rows.map((row, i) => (
                  <tr key={`${row.eu}-${i}`} className="border-b border-black/[0.06]">
                    <td className="py-2.5">{row.eu}</td>
                    <td>{row.pk || row.uk}</td>
                    <td>{row.uk}</td>
                    <td>{row.us}</td>
                    <td>{row.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="mt-5 text-sm font-medium text-ink-muted hover:text-ink" onClick={() => setGuide(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
