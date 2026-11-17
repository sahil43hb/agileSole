"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { toastApiError } from "@/components/ui/toast";
import { apiErrorMessage } from "@/shared/api-error";

export type CartLine = {
  sku: string;
  qty: number;
  title: string;
  slug: string;
  color?: string;
  sizeEu?: string;
  price: number;
  image?: string;
  available: number;
};

export type CartPayload = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  discount: number;
  promoCode: string;
  shipping: number;
  total: number;
  shippingMeta: { id: string; name: string; fee: number; eta: string; freeOver: number };
};

const empty: CartPayload = {
  lines: [],
  count: 0,
  subtotal: 0,
  discount: 0,
  promoCode: "",
  shipping: 0,
  total: 0,
  shippingMeta: { id: "standard-cod", name: "Standard COD", fee: 250, eta: "2–5 working days", freeOver: 5000 },
};

type Ctx = {
  cart: CartPayload;
  loading: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  refresh: () => Promise<void>;
  add: (sku: string, qty?: number) => Promise<string | null>;
  setQty: (sku: string, qty: number) => Promise<string | null>;
  remove: (sku: string) => Promise<void>;
  applyPromo: (code: string) => Promise<string | null>;
  clearPromo: () => Promise<void>;
};

const CartContext = createContext<Ctx>({
  cart: empty,
  loading: true,
  drawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  refresh: async () => {},
  add: async () => null,
  setQty: async () => null,
  remove: async () => {},
  applyPromo: async () => null,
  clearPromo: async () => {},
});

async function readCart(locale: string): Promise<CartPayload> {
  const res = await fetch(`/api/v1/cart?locale=${encodeURIComponent(locale)}`, { credentials: "same-origin" });
  const json = await res.json();
  if (!json.ok) return empty;
  return json.data as CartPayload;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const [cart, setCart] = useState<CartPayload>(empty);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setCart(await readCart(locale));
    } catch {
      setCart(empty);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (sku: string, qty = 1) => {
      const res = await fetch("/api/v1/cart/items", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, qty, locale }),
      });
      const json = await res.json();
      if (!json.ok) {
        toastApiError(json, "Could not add to bag");
        return apiErrorMessage(json, "Could not add to bag");
      }
      setCart(json.data as CartPayload);
      setDrawerOpen(true);
      trackEvent("add_to_cart", { currency: "PKR", value: (json.data as CartPayload).subtotal });
      return null;
    },
    [locale],
  );

  const setQty = useCallback(
    async (sku: string, qty: number) => {
      const res = await fetch("/api/v1/cart/items", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, qty, locale }),
      });
      const json = await res.json();
      if (!json.ok) {
        toastApiError(json, "Could not update bag");
        return apiErrorMessage(json, "Could not update bag");
      }
      setCart(json.data as CartPayload);
      return null;
    },
    [locale],
  );

  const remove = useCallback(
    async (sku: string) => {
      await fetch(`/api/v1/cart/items?sku=${encodeURIComponent(sku)}&locale=${encodeURIComponent(locale)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      await refresh();
    },
    [locale, refresh],
  );

  const applyPromo = useCallback(
    async (code: string) => {
      const res = await fetch("/api/v1/cart/promo", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, locale }),
      });
      const json = await res.json();
      if (!json.ok) {
        toastApiError(json, "Could not apply code");
        return apiErrorMessage(json, "Could not apply code");
      }
      setCart(json.data as CartPayload);
      return null;
    },
    [locale],
  );

  const clearPromo = useCallback(async () => {
    const res = await fetch(`/api/v1/cart/promo?locale=${encodeURIComponent(locale)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    const json = await res.json();
    if (json.ok) setCart(json.data as CartPayload);
    else await refresh();
  }, [locale, refresh]);

  const value = useMemo<Ctx>(
    () => ({
      cart,
      loading,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      refresh,
      add,
      setQty,
      remove,
      applyPromo,
      clearPromo,
    }),
    [cart, loading, drawerOpen, refresh, add, setQty, remove, applyPromo, clearPromo],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
