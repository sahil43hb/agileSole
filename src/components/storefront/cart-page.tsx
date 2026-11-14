"use client";

import { Link } from "@/i18n/navigation";
import { formatPkr } from "@/shared/money";
import { useCart } from "./cart-provider";
import { PromoCode } from "./promo-code";
import { AppSelect } from "@/components/ui/app-select";

export function CartPageView() {
  const { cart, loading, setQty, remove } = useCart();

  if (loading) {
    return (
      <div className="mx-auto max-w-site px-4 py-16">
        <p className="text-sm text-ink-muted">Loading your bag…</p>
      </div>
    );
  }

  if (!cart.lines.length) {
    return (
      <div className="mx-auto max-w-site px-4 py-16">
        <h1 className="text-3xl font-semibold">Your bag</h1>
        <p className="mt-3 text-ink-muted">Nothing here yet. Add a size from any pair.</p>
        <Link href="/shop" className="btn-primary mt-6 h-11 px-5">
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-site gap-10 px-4 py-12 md:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-3xl font-semibold">Your bag</h1>
        <ul className="mt-8 divide-y divide-paper-line border-y border-paper-line">
          {cart.lines.map((line) => (
            <li key={line.sku} className="flex gap-4 py-4">
              <Link href={`/product/${line.slug}`} className="h-28 w-28 shrink-0 bg-brand-mist">
                {line.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={line.image} alt="" className="h-full w-full object-cover" />
                ) : null}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${line.slug}`} className="font-medium">
                  {line.title}
                </Link>
                <p className="text-sm text-ink-muted">
                  {line.color} · EU {line.sizeEu} · {line.sku}
                </p>
                <p className="mt-1">{formatPkr(line.price)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <label className="text-sm">
                    Qty
                    <AppSelect
                      tone="store"
                      size="sm"
                      className="ms-2 inline-block w-[4.75rem]"
                      value={String(line.qty)}
                      onChange={(next) => void setQty(line.sku, Number(next))}
                      options={Array.from({ length: Math.min(5, line.available) }, (_, i) => ({
                        value: String(i + 1),
                        label: String(i + 1),
                      }))}
                    />
                  </label>
                  <button type="button" className="text-sm text-ink-muted" onClick={() => void remove(line.sku)}>
                    Remove
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium">{formatPkr(line.price * line.qty)}</p>
            </li>
          ))}
        </ul>
      </div>
      <aside className="h-fit bg-paper-warm p-5">
        <h2 className="font-semibold">Order summary</h2>
        <p className="mt-4 flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatPkr(cart.subtotal)}</span>
        </p>
        <p className="mt-2 flex justify-between text-sm">
          <span>Shipping ({cart.shippingMeta.name})</span>
          <span>{cart.shipping ? formatPkr(cart.shipping) : "Free"}</span>
        </p>
        <PromoCode />
        {cart.subtotal < cart.shippingMeta.freeOver && cart.subtotal > 0 ? (
          <p className="mt-2 text-xs text-ink-muted">
            Free delivery over {formatPkr(cart.shippingMeta.freeOver)}.
          </p>
        ) : null}
        <p className="mt-4 flex justify-between border-t border-paper-line pt-3 font-medium">
          <span>Total · COD</span>
          <span>{formatPkr(cart.total)}</span>
        </p>
        <p className="mt-2 text-xs text-ink-faint">Pay cash when the pair arrives. {cart.shippingMeta.eta}.</p>
        <Link href="/checkout" className="btn-primary mt-6 h-12 w-full">
          Continue to checkout
        </Link>
      </aside>
    </div>
  );
}
