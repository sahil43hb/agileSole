"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const KEY = "as_wishlist";
const BOUGHT_KEY = "as_wishlist_bought";

const SKIP_BOUGHT = new Set(["cancelled", "returned"]);

function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function uniq(list: string[]) {
  return [...new Set(list.filter(Boolean))];
}

type Ctx = {
  slugs: string[];
  bought: string[];
  has: (slug: string) => boolean;
  isBought: (slug: string) => boolean;
  toggle: (slug: string) => void;
  markBought: (slugs: string[]) => void;
  count: number;
};

const WishlistContext = createContext<Ctx>({
  slugs: [],
  bought: [],
  has: () => false,
  isBought: () => false,
  toggle: () => {},
  markBought: () => {},
  count: 0,
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [bought, setBought] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSlugs(readList(KEY));
    setBought(readList(BOUGHT_KEY));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(slugs));
  }, [slugs, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(BOUGHT_KEY, JSON.stringify(bought));
  }, [bought, ready]);

  const markBought = useCallback((next: string[]) => {
    const extra = uniq(next);
    if (!extra.length) return;
    setBought((prev) => uniq([...prev, ...extra]));
  }, []);

  useEffect(() => {
    if (!ready) return;
    fetch("/api/v1/me/orders", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) return;
        const orders = (json.data?.orders || []) as { status?: string; items?: { slug?: string }[] }[];
        const fromOrders = orders
          .filter((o) => !SKIP_BOUGHT.has(o.status || ""))
          .flatMap((o) => (o.items || []).map((i) => i.slug || ""))
          .filter(Boolean);
        markBought(fromOrders);
      })
      .catch(() => {});
  }, [ready, markBought]);

  const value = useMemo<Ctx>(
    () => ({
      slugs,
      bought,
      count: slugs.filter((s) => !bought.includes(s)).length,
      has: (slug) => slugs.includes(slug),
      isBought: (slug) => bought.includes(slug),
      toggle: (slug) =>
        setSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug])),
      markBought,
    }),
    [slugs, bought, markBought],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}
