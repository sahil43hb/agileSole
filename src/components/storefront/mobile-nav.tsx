"use client";

import { useTranslations } from "next-intl";
import { Heart, Home, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useWishlist } from "./wishlist-provider";
import { useCart } from "./cart-provider";

export function MobileNav() {
  const t = useTranslations("nav");
  const c = useTranslations("common");
  const pathname = usePathname();
  const { count } = useWishlist();
  const { cart } = useCart();

  const items = [
    { href: "/", icon: Home, label: t("home") },
    { href: "/shop", icon: LayoutGrid, label: t("shop") },
    { href: "/search", icon: Search, label: c("search") },
    { href: "/wishlist", icon: Heart, label: t("wishlist"), badge: count },
    { href: "/cart", icon: ShoppingBag, label: t("cart"), badge: cart.count },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-paper-line bg-paper md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] ${
                  active ? "text-brand-dark" : "text-ink-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                {"badge" in item && item.badge ? (
                  <span className="absolute end-4 top-1 min-w-4 rounded-full bg-brand px-1 text-[9px] leading-4 text-white">
                    {item.badge}
                  </span>
                ) : null}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
