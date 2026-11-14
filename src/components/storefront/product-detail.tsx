"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Share2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatPkr } from "@/shared/money";
import type { PublicProduct } from "@/server/modules/catalog/product.service";
import { useWishlist } from "./wishlist-provider";
import { useCart } from "./cart-provider";
import { trackView } from "./recently-viewed";

type Chart = { title: string; rows: { eu?: string; pk?: string; uk?: string; us?: string; cm?: string }[] };

export function ProductDetail({
  product,
  chart,
}: {
  product: PublicProduct;
  chart: Chart | null;
}) {
  const { has, toggle } = useWishlist();
  const { add } = useCart();
  const [color, setColor] = useState(product.colors[0]?.name || "");
  const [size, setSize] = useState("");
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
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
  const activeImage = selected?.image && gallery.includes(selected.image)
    ? selected.image
    : gallery[index] || selected?.image;
  const colorSizes = useMemo(
    () => product.variants.filter((v) => !color || v.color === color),
    [product.variants, color],
  );
  const inStock = selected ? selected.onHand > 0 : colorSizes.some((v) => v.onHand > 0);
  const low = selected && selected.onHand > 0 && selected.onHand <= 2;

  function requireSize() {
    if (!size) {
      setSizePulse(true);
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  return (
    <div>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <button type="button" className="aspect-square w-full bg-brand-mist" onClick={() => activeImage && setZoom(true)}>
            {activeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeImage} alt={product.title} className="h-full w-full object-cover" />
            ) : null}
          </button>
          {gallery.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-16 w-16 shrink-0 bg-brand-mist ${i === index ? "ring-2 ring-ink" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">
            {product.gender} · {product.type}
          </p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <h1 className="text-3xl font-semibold">{product.title}</h1>
            <button type="button" aria-label="Wishlist" onClick={() => toggle(product.slug)}>
              <Heart className={`h-6 w-6 ${has(product.slug) ? "fill-brand text-brand" : ""}`} />
            </button>
          </div>
          <p className="mt-4 text-xl">
            {formatPkr(price)}
            {compareAt ? (
              <span className="ms-2 text-base text-ink-faint line-through">{formatPkr(compareAt)}</span>
            ) : null}
            {product.percentOff ? <span className="ms-2 text-sm text-brand-dark">-{product.percentOff}%</span> : null}
          </p>
          <p className="mt-1 text-xs text-ink-faint">Prices in PKR. Tax shown at checkout when it applies.</p>
          {product.description ? <p className="mt-4 text-ink-muted">{product.description}</p> : null}
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
                      const still = product.variants.some((v) => v.color === c.name && v.sizeEu === size && v.onHand > 0);
                      if (!still) setSize("");
                    }}
                    className={`border px-3 py-2 text-sm ${color === c.name ? "border-ink bg-ink text-paper" : "border-paper-line"}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div id="size-picker" className={`mt-6 ${sizePulse ? "ring-2 ring-brand ring-offset-2" : ""}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">EU size</p>
              <button type="button" className="text-sm text-brand-dark" onClick={() => setGuide(true)}>
                Size guide
              </button>
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
                ? low
                  ? `Only ${selected.onHand} left · ${selected.sku}`
                  : `${selected.onHand} in stock · ${selected.sku}`
                : "Out of stock in this size"
              : inStock
                ? "Select a size"
                : "Currently out of stock"}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="add-to-cart"
              className="btn-primary h-12 px-7"
              onClick={async () => {
                if (!requireSize()) return;
                if (!selected) return;
                const err = await add(selected.sku, 1);
                setNote(err || "Added to bag");
              }}
            >
              Add to cart
            </button>
            <button
              type="button"
              className="btn-secondary h-12 w-12 px-0"
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) navigator.share({ title: product.title, url }).catch(() => {});
                else navigator.clipboard.writeText(url);
              }}
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
          {note ? <p className="mt-3 text-sm text-ink-muted">{note}</p> : null}

          <ul className="mt-8 space-y-2 text-sm text-ink-muted">
            <li>Cash on delivery — pay when you receive.</li>
            <li>City delivery typically 2–5 days across Pakistan.</li>
            <li>
              Easy size exchange.{" "}
              <Link href="/shipping-returns" className="text-brand-dark">
                Returns
              </Link>
            </li>
          </ul>

          <dl className="mt-8 grid grid-cols-2 gap-2 text-sm">
            {product.material ? (
              <>
                <dt className="text-ink-faint">Material</dt>
                <dd>{product.material}</dd>
              </>
            ) : null}
            <dt className="text-ink-faint">Type</dt>
            <dd className="capitalize">{product.type}</dd>
            {selected ? (
              <>
                <dt className="text-ink-faint">SKU</dt>
                <dd>{selected.sku}</dd>
              </>
            ) : null}
          </dl>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-paper-line bg-paper px-4 py-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{formatPkr(price)}</p>
          <button
            type="button"
            className="btn-primary h-11 px-5"
            onClick={async () => {
              if (!requireSize()) return;
              if (!selected) return;
              const err = await add(selected.sku, 1);
              setNote(err || "Added to bag");
            }}
          >
            Add to cart
          </button>
        </div>
      </div>

      {zoom && activeImage ? (
        <button type="button" className="fixed inset-0 z-50 bg-ink/80 p-6" onClick={() => setZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activeImage} alt="" className="mx-auto max-h-full object-contain" />
        </button>
      ) : null}

      {guide && chart ? (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/40 md:items-center md:justify-center" onClick={() => setGuide(false)}>
          <div className="max-h-[80vh] w-full overflow-y-auto bg-paper p-6 md:max-w-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold">{chart.title}</h2>
            <p className="mt-2 text-sm text-ink-muted">
              EU is the size we sell. PK is Pakistan (same as UK in most local shops). US is American. CM is foot length — stand on paper, mark heel and longest toe, then match centimetres.
            </p>
            <table className="mt-4 w-full text-start text-sm">
              <thead>
                <tr className="border-b border-paper-line text-ink-faint">
                  <th className="py-2">EU</th>
                  <th>PK</th>
                  <th>UK</th>
                  <th>US</th>
                  <th>cm</th>
                </tr>
              </thead>
              <tbody>
                {chart.rows.map((row, i) => (
                  <tr key={`${row.eu}-${i}`} className="border-b border-paper-line">
                    <td className="py-2">{row.eu}</td>
                    <td>{row.pk || row.uk}</td>
                    <td>{row.uk}</td>
                    <td>{row.us}</td>
                    <td>{row.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="mt-4 text-sm" onClick={() => setGuide(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
