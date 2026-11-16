"use client";

import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PublicProduct } from "@/server/modules/catalog/product.service";
import { formatPkr } from "@/shared/money";
import { useCart } from "./cart-provider";

export function QuickAddButton({
  product,
  label,
}: {
  product: PublicProduct;
  label?: string;
}) {
  const c = useTranslations("common");
  const { add } = useCart();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const available = useMemo(() => product.variants.filter((v) => v.onHand > 0), [product.variants]);
  const soldOut = !product.inStock || available.length === 0;

  async function start() {
    setError("");
    if (soldOut) return;
    if (available.length === 1) {
      setBusy(true);
      const err = await add(available[0].sku, 1);
      setBusy(false);
      if (err) setError(err);
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        disabled={soldOut || busy}
        onClick={() => void start()}
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-ink text-[13px] font-medium text-paper transition hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        {soldOut ? c("soldOut") : busy ? c("adding") : label || c("addToBag")}
      </button>
      {error && !open ? <p className="mt-1.5 text-xs text-ink-muted">{error}</p> : null}
      {open ? (
        <QuickAddSheet
          product={product}
          onClose={() => {
            setOpen(false);
            setError("");
          }}
        />
      ) : null}
    </>
  );
}

function QuickAddSheet({ product, onClose }: { product: PublicProduct; onClose: () => void }) {
  const t = useTranslations("pdp");
  const c = useTranslations("common");
  const { add } = useCart();
  const [color, setColor] = useState(product.colors[0]?.name || "");
  const [size, setSize] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pulse, setPulse] = useState(false);

  const selected = product.variants.find((v) => (!color || v.color === color) && v.sizeEu === size);
  const sizes = useMemo(() => {
    const forColor = product.variants.filter((v) => !color || v.color === color);
    return [...new Set(forColor.map((v) => v.sizeEu).filter(Boolean) as string[])].sort(
      (a, b) => Number(a) - Number(b),
    );
  }, [product.variants, color]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function submit() {
    if (!size || !selected) {
      setPulse(true);
      setError(c("selectSize"));
      return;
    }
    if (selected.onHand <= 0) {
      setError(t("outSize"));
      return;
    }
    setBusy(true);
    const err = await add(selected.sku, 1);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  const image = selected?.image || product.images[0];
  const price = selected?.price ?? product.price;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Add ${product.title} to bag`}
        className="w-full max-w-md rounded-t-[1.5rem] bg-white p-5 shadow-[0_-16px_60px_rgba(17,17,17,0.18)] sm:rounded-[1.5rem] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-mist">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-tight">{product.title}</p>
            <p className="mt-0.5 text-sm">{formatPkr(price)}</p>
            <Link href={`/product/${product.slug}`} className="mt-1 inline-block text-xs font-medium text-brand-dark" onClick={onClose}>
              {c("viewDetails")}
            </Link>
          </div>
          <button
            type="button"
            aria-label={c("close")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3f5f2]"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {product.colors.length > 1 ? (
          <div className="mt-5">
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
                    const still = product.variants.some((v) => v.color === c.name && v.sizeEu === size && v.onHand > 0);
                    if (!still) setSize("");
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${
                    color === c.name ? "bg-ink text-paper ring-ink" : "bg-white ring-black/[0.08]"
                  }`}
                >
                  {c.hex ? <span className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} /> : null}
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className={`mt-5 ${pulse ? "rounded-2xl ring-2 ring-brand ring-offset-2" : ""}`}>
          <p className="text-xs font-medium text-ink-muted">{t("euSize")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((s) => {
              const variant = product.variants.find((v) => v.sizeEu === s && (!color || v.color === color));
              const ok = (variant?.onHand || 0) > 0;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!ok}
                  onClick={() => {
                    setSize(s);
                    setPulse(false);
                    setError("");
                  }}
                  className={`min-w-11 rounded-full px-3 py-2 text-sm font-medium ring-1 ${
                    size === s ? "bg-ink text-paper ring-ink" : "bg-white ring-black/[0.08]"
                  } disabled:opacity-30`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-ink-muted">{error}</p> : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="btn-primary mt-5 h-12 w-full rounded-full disabled:opacity-60"
        >
          {busy ? c("adding") : c("addToBag")}
        </button>
      </div>
    </div>
  );
}
