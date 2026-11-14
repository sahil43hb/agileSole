"use client";

import { useState, type ReactNode } from "react";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Wordmark } from "@/components/brand/logo";
import { LanguageSwitcher } from "./language-switcher";
import { MegaMenu, type MenuCategory } from "./mega-menu";
import { MobileMenu } from "./mobile-menu";
import { SearchOverlay } from "./search-overlay";
import { useWishlist } from "./wishlist-provider";
import { useCart } from "./cart-provider";
import { useAuth } from "./auth-provider";

function IconBtn({
  label,
  onClick,
  href,
  children,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  children: ReactNode;
}) {
  const cls =
    "relative grid h-9 w-9 place-items-center rounded-full text-ink/80 transition hover:bg-white hover:text-ink";
  if (href) {
    return (
      <Link href={href} aria-label={label} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

function Badge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute -end-0.5 -top-0.5 grid min-w-[1.05rem] place-items-center rounded-full bg-brand px-1 text-[9px] font-semibold leading-4 text-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function HeaderChrome({
  announce,
  labels,
  categories,
  collections,
  logoSrc,
}: {
  announce: string;
  labels: { search: string; account: string; wishlist: string; cart: string };
  categories: MenuCategory[];
  collections: { slug: string; label: string }[];
  logoSrc?: string;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useWishlist();
  const { cart, openDrawer } = useCart();
  const { customer } = useAuth();

  return (
    <header className="sticky top-0 z-40">
      <p className="flex items-center justify-center gap-2 bg-[#0b0f0d] px-4 py-[7px] text-center text-[11px] font-medium tracking-[0.12em] text-white/75">
        <span className="hidden h-1.5 w-1.5 rounded-full bg-brand sm:inline-block" />
        {announce}
      </p>
      <div className="relative border-b border-black/[0.05] bg-white/80 shadow-[0_10px_30px_rgba(17,17,17,0.04)] backdrop-blur-xl">
        <div className="mx-auto grid h-[4.35rem] max-w-[90rem] grid-cols-[auto_1fr_auto] items-stretch gap-4 px-4 md:h-[4.6rem] md:gap-8 md:px-8">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#f3f5f3] md:hidden"
              aria-label="Menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center rounded-2xl px-0.5">
              <Wordmark src={logoSrc} className="h-10 w-auto max-w-[148px] md:h-11 md:max-w-[168px]" />
            </Link>
          </div>

          <MegaMenu categories={categories} collections={collections} />

          <div className="flex items-center justify-end gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-10 min-w-[15.5rem] items-center gap-2 rounded-full bg-[#f2f4f2] px-3.5 text-sm text-ink-muted transition hover:bg-[#e8ece9] xl:inline-flex"
            >
              <Search className="h-4 w-4 text-ink/70" strokeWidth={1.75} />
              <span className="flex-1 text-start">{labels.search}</span>
            </button>
            <div className="flex items-center rounded-full bg-[#f2f4f2] p-0.5">
              <span className="xl:hidden">
                <IconBtn label={labels.search} onClick={() => setSearchOpen(true)}>
                  <Search className="h-[17px] w-[17px]" strokeWidth={1.75} />
                </IconBtn>
              </span>
              <IconBtn label={labels.account} href={customer ? "/account" : "/account/login"}>
                <User className="h-[17px] w-[17px]" strokeWidth={1.75} />
              </IconBtn>
              <span className="hidden sm:inline-flex">
                <IconBtn label={labels.wishlist} href="/wishlist">
                  <Heart className="h-[17px] w-[17px]" strokeWidth={1.75} />
                  <Badge n={count} />
                </IconBtn>
              </span>
            </div>
            <button
              type="button"
              aria-label={labels.cart}
              onClick={openDrawer}
              className="relative inline-flex h-10 items-center gap-2 rounded-full bg-ink px-3.5 text-sm font-medium text-paper transition hover:bg-[#222]"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">{labels.cart}</span>
              {cart.count ? (
                <span className="grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-5 text-white">
                  {cart.count > 99 ? "99+" : cart.count}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        categories={categories}
        collections={collections}
      />
    </header>
  );
}
