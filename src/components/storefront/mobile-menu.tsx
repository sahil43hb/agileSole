"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ChevronDown, MessageCircle, Ruler, Truck, UserRound, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { MenuCategory } from "./mega-menu";
import { LanguageSwitcher } from "./language-switcher";
import { useAuth } from "./auth-provider";
import { CustomerAvatar, customerFirstName } from "./account-menu";

const CATEGORY_ART: Record<string, string> = {
  men: "/catalog/lookbook-city.jpg",
  women: "/catalog/lookbook-women.jpg",
  kids: "/catalog/hero-family.jpg",
  comfort: "/catalog/lookbook-comfort.jpg",
};

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
  const account = useTranslations("account");
  const { customer } = useAuth();
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const wa = (process.env.NEXT_PUBLIC_WHATSAPP || "923069158103").replace(/\D/g, "");
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setShown(true);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCloseRef.current();
      };
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener("keydown", onKey);
      };
    }
    const timer = window.setTimeout(() => {
      setShown(false);
      setOpenCat(null);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!mounted || (!open && !shown)) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className={`absolute inset-0 bg-[#0b0f0d]/45 backdrop-blur-[6px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute inset-y-0 start-0 flex w-[min(100%,22.5rem)] max-w-[88vw] flex-col bg-white shadow-[24px_0_80px_rgba(17,24,17,0.18)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] px-5 py-3.5">
          <div>
            <p id={titleId} className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-dark">
              {t("menu")}
            </p>
            <p className="mt-0.5 text-[15px] font-medium tracking-tight text-ink">{t("shop")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#f3f5f2] text-ink transition active:scale-95"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 pt-5">
            <Link
              href="/shop"
              onClick={onClose}
              className="flex h-12 items-center justify-between rounded-full bg-ink px-5 text-sm font-semibold text-white"
            >
              {t("shop")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>

          {categories.length ? (
            <div className="mt-6">
              <p className="px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">{t("explore")}</p>
              <div className="mt-3 flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/c/${cat.slug}`}
                    onClick={onClose}
                    className="relative h-[7.25rem] w-[6.35rem] shrink-0 overflow-hidden rounded-[1.15rem] bg-[#f3f5f2]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={CATEGORY_ART[cat.slug] || "/catalog/campaign-grid.jpg"}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-2 text-[13px] font-semibold text-white">{cat.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <nav className="mt-4 px-3">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center justify-between rounded-xl px-2 py-2.5 text-[15px] font-medium tracking-tight text-ink"
            >
              {t("home")}
              <ArrowRight className="h-3.5 w-3.5 text-ink-faint rtl:rotate-180" />
            </Link>
            {categories.map((cat) => {
              const expanded = openCat === cat.slug;
              return (
                <div key={cat.slug} className="border-t border-black/[0.05]">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/c/${cat.slug}`}
                      onClick={onClose}
                      className="min-w-0 flex-1 py-2.5 ps-2 text-[15px] font-medium tracking-tight text-ink"
                    >
                      {cat.label}
                    </Link>
                    {cat.children.length ? (
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-label={cat.label}
                        onClick={() => setOpenCat(expanded ? null : cat.slug)}
                        className="grid h-10 w-10 place-items-center rounded-full text-ink-muted"
                      >
                        <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
                      </button>
                    ) : null}
                  </div>
                  {cat.children.length ? (
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                        expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="flex flex-wrap gap-2 pb-4 ps-2">
                          <Link
                            href={`/c/${cat.slug}`}
                            onClick={onClose}
                            className="rounded-full bg-ink px-3.5 py-2 text-xs font-medium text-white"
                          >
                            {t("allCat", { label: cat.label })}
                          </Link>
                          {cat.children.map((child) => (
                            <Link
                              key={child.slug}
                              href={`/c/${cat.slug}/${child.slug}`}
                              onClick={onClose}
                              className="rounded-full bg-[#f3f5f2] px-3.5 py-2 text-xs font-medium text-ink"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          {collections.length ? (
            <div className="mt-2 px-5 pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">{t("collections")}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {collections.map((col) => (
                  <Link
                    key={col.slug}
                    href={`/collections/${col.slug}`}
                    onClick={onClose}
                    className="rounded-2xl bg-[#f4f6f4] px-3.5 py-3.5 text-sm font-medium leading-snug tracking-tight"
                  >
                    {col.label}
                  </Link>
                ))}
                <Link
                  href="/lookbook"
                  onClick={onClose}
                  className="rounded-2xl bg-[#f4f6f4] px-3.5 py-3.5 text-sm font-medium tracking-tight"
                >
                  {t("lookbook")}
                </Link>
                <Link
                  href="/brands"
                  onClick={onClose}
                  className="rounded-2xl bg-[#f4f6f4] px-3.5 py-3.5 text-sm font-medium tracking-tight"
                >
                  {t("brands")}
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-4 space-y-1 px-3 pb-6">
            <Link
              href="/size-guide"
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-2 py-2.5 text-sm font-medium text-ink-muted"
            >
              <Ruler className="h-4 w-4" />
              {t("sizeGuide")}
            </Link>
            <Link
              href="/track-order"
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-2 py-2.5 text-sm font-medium text-ink-muted"
            >
              <Truck className="h-4 w-4" />
              {t("track")}
            </Link>
          </div>
        </div>

        <div className="border-t border-black/[0.06] bg-[#f7f8f6] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-3">
            <LanguageSwitcher />
            {wa ? (
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 text-xs font-semibold text-white"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            ) : null}
          </div>
          {customer ? (
            <Link
              href="/account"
              onClick={onClose}
              className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-black/[0.05]"
            >
              <CustomerAvatar name={customer.name} phone={customer.phone} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{customerFirstName(customer.name, account("defaultName"))}</span>
                <span className="block text-xs text-ink-muted">{account("signedIn")}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-ink-faint rtl:rotate-180" />
            </Link>
          ) : (
            <Link
              href="/account/login"
              onClick={onClose}
              className="mt-3 flex h-11 items-center justify-center gap-2 rounded-full bg-white text-sm font-medium ring-1 ring-black/[0.08]"
            >
              <UserRound className="h-4 w-4" />
              {t("account")}
            </Link>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
