"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const KEY = "as_wishlist";

type Ctx = {
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  count: number;
};

const WishlistContext = createContext<Ctx>({ slugs: [], has: () => false, toggle: () => {}, count: 0 });

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSlugs(JSON.parse(raw) as string[]);
    } catch {
      setSlugs([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(slugs));
  }, [slugs, ready]);

  const value = useMemo<Ctx>(
    () => ({
      slugs,
      count: slugs.length,
      has: (slug) => slugs.includes(slug),
      toggle: (slug) =>
        setSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug])),
    }),
    [slugs],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}
