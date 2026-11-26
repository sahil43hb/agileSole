"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, Heart, RefreshCw, Share2, Star, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPkr } from "@/shared/money";
import type { PublicProduct } from "@/server/modules/catalog/product.service";
import { sizeSystemShort } from "@/shared/size-system";
import { useStoreIdentity } from "@/components/store-identity";
import { productTypeLabel } from "@/shared/product-types";
import { useWishlist } from "./wishlist-provider";
import { useCart } from "./cart-provider";
import { trackView } from "./recently-viewed";
import { ProductGallery } from "./product-gallery";
import { BusyLabel } from "@/components/ui/spinner";

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
  const t = useTranslations("pdp");
  const c = useTranslations("common");
  const n = useTranslations("nav");
  const locale = useLocale();
  const { productTypes } = useStoreIdentity();
  const genderLabel =
    product.gender === "men" || product.gender === "women" || product.gender === "kids"
      ? n(product.gender)
      : product.gender;
  const { has, toggle } = useWishlist();
  const { add } = useCart();
  const [color, setColor] = useState(product.colors[0]?.name || "");
  const [size, setSize] = useState("");
  const [guide, setGuide] = useState(false);
  const [sizePulse, setSizePulse] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    trackView(product.slug);
  }, [product.slug]);

  const gallery = product.images.length ? product.images : [];
  const selected = product.variants.find((v) => v.color === color && (v.size || v.sizeEu) === size);
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
    setBusy(true);
    const err = await add(selected.sku, 1);
    setBusy(false);
    setNote(err || t("added"));
  }

  return (
    <div>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,26rem)] lg:gap-14">
        <ProductGallery images={gallery} title={product.title} activeSrc={activeImage} />

        <div className="lg:sticky lg:top-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
            {genderLabel} · {productTypeLabel(product.type, productTypes, locale)}
          </p>
          {product.brandLogo || product.brandName ? (
            <Link
              href={product.brandSlug ? `/brands/${product.brandSlug}` : "/brands"}
              className="mt-3 inline-flex items-center gap-2.5"
            >
              {product.brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.brandLogo} alt="" className="h-8 w-auto max-w-[120px] object-contain object-left" />
              ) : null}
              {product.brandName ? (
                <span className="text-sm font-medium text-ink-muted">{product.brandName}</span>
              ) : null}
            </Link>
          ) : null}
          <div className="mt-2 flex items-start justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{product.title}</h1>
            <button
              type="button"
              aria-label={t("wishlist")}
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
              {reviews.count === 1
                ? t("reviews", { average: reviews.average.toFixed(1), count: reviews.count })
                : t("reviewsPlural", { average: reviews.average.toFixed(1), count: reviews.count })}
            </a>
          ) : null}

          <p className="mt-4 flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight">{formatPkr(price)}</span>
            {compareAt ? <span className="text-base text-ink-faint line-through">{formatPkr(compareAt)}</span> : null}
            {product.percentOff ? (
              <span className="rounded-full bg-brand-mist px-2 py-0.5 text-xs font-semibold text-brand-dark">-{product.percentOff}%</span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-ink-muted">{t("taxNote")}</p>
          {product.description ? <p className="mt-4 text-sm leading-relaxed text-ink-muted">{product.description}</p> : null}
          {product.fitNote ? (
            <p className="mt-3 rounded-2xl bg-[#f6f7f5] px-4 py-2.5 text-sm">
              <span className="font-medium">{t("fit")}</span> {product.fitNote}
            </p>
          ) : null}

          {product.colors.length ? (
            <div className="mt-6">
              <p className="text-xs font-medium text-ink-muted">
                {t("color")} <span className="text-ink">{color}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setColor(c.name);
                      const still = product.variants.some((v) => v.color === c.name && (v.size || v.sizeEu) === size && v.onHand > 0);
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
              <p className="text-xs font-medium text-ink-muted">{t("sizeSystem", { system: sizeSystemShort(product.sizeSystem) })}</p>
              {chart ? (
                <button type="button" className="text-sm font-medium text-brand-dark hover:underline" onClick={() => setGuide(true)}>
                  {t("sizeGuide")}
                </button>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const variant = product.variants.find((v) => (v.size || v.sizeEu) === s && (!color || v.color === color));
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
                  ? t("onlyLeft", { count: selected.onHand })
                  : t("inStock", { count: selected.onHand })
                : t("outSize")
              : inStock
                ? t("selectSize")
                : t("currentlyOut")}
          </p>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              data-testid="add-to-cart"
              disabled={busy}
              className="btn-primary inline-flex h-12 flex-1 items-center justify-center rounded-full px-7 disabled:opacity-60"
              onClick={() => void addToBag()}
            >
              <BusyLabel loading={busy} label={c("adding")}>
                {t("add")}
              </BusyLabel>
            </button>
            <button
              type="button"
              aria-label={t("share")}
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
              {t("codLine")}
            </li>
            <li className="flex items-center gap-2.5">
              <Truck className="h-4 w-4 text-brand" />
              {t("shipLine")}
            </li>
            <li className="flex items-center gap-2.5">
              <RefreshCw className="h-4 w-4 text-brand" />
              {t("exchangeLine")}{" "}
              <Link href="/shipping-returns" className="font-medium text-brand-dark hover:underline">
                {t("returns")}
              </Link>
            </li>
          </ul>

          <dl className="mt-6 grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2 text-sm">
            {product.material ? (
              <>
                <dt className="text-ink-muted">{t("material")}</dt>
                <dd>{product.material}</dd>
              </>
            ) : null}
            <dt className="text-ink-muted">{t("type")}</dt>
            <dd className="capitalize">{product.type}</dd>
          </dl>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-black/[0.06] bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">{formatPkr(price)}</p>
          <button type="button" disabled={busy} className="btn-primary inline-flex h-11 items-center justify-center rounded-full px-5 disabled:opacity-60" onClick={() => void addToBag()}>
            <BusyLabel loading={busy} label={c("adding")}>
              {t("add")}
            </BusyLabel>
          </button>
        </div>
      </div>

      {guide && chart ? (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/40 md:items-center md:justify-center md:p-5" onClick={() => setGuide(false)}>
          <div
            className="flex max-h-[92dvh] w-full min-h-0 flex-col overflow-hidden rounded-t-[1.6rem] bg-white shadow-xl md:max-h-[min(90dvh,760px)] md:max-w-xl md:rounded-[1.6rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
            <h2 className="text-xl font-semibold tracking-tight">{chart.title}</h2>
            <p className="mt-2 text-sm text-ink-muted">{t("sizeGuideBody")}</p>
            <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-start text-sm">
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
            </div>
            <button type="button" className="mt-5 text-sm font-medium text-ink-muted hover:text-ink" onClick={() => setGuide(false)}>
              {c("close")}
            </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
