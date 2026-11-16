"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { MenuCategory } from "./mega-menu";

export function MobileMenu({
  open,
  onClose,
  categories,
  collections,
}: {
  open: boolean;
  onClose: () => void;
  categories: MenuCategory[];
  collections: { slug: string; label: string }[];
}) {
  const t = useTranslations("nav");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 md:hidden" onClick={onClose}>
      <div className="absolute inset-y-0 start-0 w-80 overflow-y-auto bg-paper p-6" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">{t("shop")}</p>
        <ul className="mt-4 space-y-4 text-sm">
          <li>
            <Link href="/" onClick={onClose} className="font-medium">
              {t("home")}
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat.slug}>
              <Link href={`/c/${cat.slug}`} onClick={onClose} className="font-medium">
                {cat.label}
              </Link>
              {cat.children.length ? (
                <ul className="mt-2 space-y-1 ps-3 text-ink-muted">
                  {cat.children.map((child) => (
                    <li key={child.slug}>
                      <Link href={`/c/${cat.slug}/${child.slug}`} onClick={onClose}>
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-xs uppercase tracking-[0.14em] text-ink-faint">{t("collections")}</p>
        <ul className="mt-3 space-y-2 text-sm">
          {collections.map((col) => (
            <li key={col.slug}>
              <Link href={`/collections/${col.slug}`} onClick={onClose}>
                {col.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/lookbook" onClick={onClose}>
              {t("lookbook")}
            </Link>
          </li>
          <li>
            <Link href="/brands" onClick={onClose}>
              {t("brands")}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
