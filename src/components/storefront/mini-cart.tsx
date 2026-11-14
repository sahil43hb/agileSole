"use client";

import { Link } from "@/i18n/navigation";
import { formatPkr } from "@/shared/money";
import { useCart } from "./cart-provider";
import { AppSelect } from "@/components/ui/app-select";

export function MiniCart() {
  const { cart, drawerOpen, closeDrawer, setQty, remove } = useCart();
  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={closeDrawer}>
      <aside
        className="flex h-full w-full max-w-md flex-col bg-paper shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-paper-line px-4 py-3">
          <h2 className="text-lg font-semibold">Your bag</h2>
          <button type="button" className="text-sm text-ink-muted" onClick={closeDrawer}>
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {cart.lines.length === 0 ? (
            <p className="text-sm text-ink-muted">Your bag is empty.</p>
          ) : (
            <ul className="space-y-4">
              {cart.lines.map((line) => (
                <li key={line.sku} className="flex gap-3">
                  <div className="h-20 w-20 shrink-0 bg-brand-mist">
                    {line.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.image} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${line.slug}`} className="text-sm font-medium" onClick={closeDrawer}>
                      {line.title}
                    </Link>
                    <p className="text-xs text-ink-faint">
                      {line.color} · EU {line.sizeEu}
                    </p>
                    <p className="mt-1 text-sm">{formatPkr(line.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <AppSelect
                        tone="store"
                        size="sm"
                        className="inline-block w-[4.75rem]"
                        value={String(line.qty)}
                        onChange={(next) => void setQty(line.sku, Number(next))}
                        options={Array.from({ length: Math.min(5, line.available) }, (_, i) => ({
                          value: String(i + 1),
                          label: String(i + 1),
                        }))}
                      />
                      <button type="button" className="text-xs text-ink-muted" onClick={() => void remove(line.sku)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-paper-line px-4 py-4">
          <p className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPkr(cart.subtotal)}</span>
          </p>
          {cart.discount ? (
            <p className="mt-1 flex justify-between text-sm text-ink-muted">
              <span>Discount{cart.promoCode ? ` (${cart.promoCode})` : ""}</span>
              <span>−{formatPkr(cart.discount)}</span>
            </p>
          ) : null}
          <p className="mt-1 flex justify-between text-sm text-ink-muted">
            <span>COD shipping</span>
            <span>{cart.shipping ? formatPkr(cart.shipping) : "Free"}</span>
          </p>
          <p className="mt-2 flex justify-between font-medium">
            <span>Total</span>
            <span>{formatPkr(cart.total)}</span>
          </p>
          <Link
            href="/checkout"
            data-testid="mini-checkout"
            className="btn-primary mt-4 h-12 w-full"
            onClick={closeDrawer}
          >
            Checkout · Cash on delivery
          </Link>
          <Link href="/cart" className="mt-2 block text-center text-sm text-ink-muted" onClick={closeDrawer}>
            View bag
          </Link>
        </div>
      </aside>
    </div>
  );
}
