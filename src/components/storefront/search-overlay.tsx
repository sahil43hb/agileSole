"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

type Suggest = {
  products: { slug: string; title: string; price: number }[];
  categories: { slug: string; label: string }[];
  brands: { slug: string; label: string }[];
};

const RECENTS = "as_recent_searches";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("searchPage");
  const [q, setQ] = useState("");
  const [data, setData] = useState<Suggest>({ products: [], categories: [], brands: [] });
  const [recents, setRecents] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "load" | "done">("idle");

  useEffect(() => {
    try {
      setRecents(JSON.parse(localStorage.getItem(RECENTS) || "[]") as string[]);
    } catch {
      setRecents([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) {
      setData({ products: [], categories: [], brands: [] });
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("load");
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/catalog/search?locale=${locale}&q=${encodeURIComponent(term)}`);
        const json = await res.json();
        if (cancelled) return;
        if (json.ok) setData(json.data);
        setStatus("done");
      } catch {
        if (!cancelled) setStatus("done");
      }
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [q, locale, open]);

  function remember(term: string) {
    const next = [term, ...recents.filter((r) => r !== term)].slice(0, 6);
    localStorage.setItem(RECENTS, JSON.stringify(next));
  }

  function go(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    remember(q.trim());
    onClose();
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-ink/40" onClick={onClose}>
      <div
        className="mx-auto mt-0 max-w-2xl bg-paper p-4 shadow-lg md:mt-16"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={go} className="flex items-center gap-2 border-b border-paper-line pb-3">
          <Search className="h-5 w-5 text-ink-faint" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("placeholder")}
            className="flex-1 bg-transparent py-2 text-lg"
          />
          <button type="button" onClick={onClose} aria-label={t("close")}>
            <X className="h-5 w-5" />
          </button>
        </form>
        <div className="max-h-[70vh] overflow-y-auto py-4 text-sm">
          {!q && recents.length ? (
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">{t("recent")}</p>
              <ul className="mt-2 space-y-1">
                {recents.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      className="text-ink-muted hover:text-ink"
                      onClick={() => {
                        remember(r);
                        onClose();
                        router.push(`/shop?q=${encodeURIComponent(r)}`);
                      }}
                    >
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {data.products.length ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">{t("pairs")}</p>
              <ul className="mt-2 space-y-2">
                {data.products.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/product/${p.slug}`}
                      onClick={() => {
                        remember(q.trim());
                        onClose();
                      }}
                      className="flex justify-between hover:text-brand-dark"
                    >
                      <span>{p.title}</span>
                      <span className="text-ink-faint">Rs {p.price.toLocaleString("en-PK")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {data.categories.length ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">{t("categories")}</p>
              <ul className="mt-2 space-y-1">
                {data.categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/c/${c.slug}`} onClick={onClose} className="hover:text-brand-dark">
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {data.brands.length ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">{t("brands")}</p>
              <ul className="mt-2 space-y-1">
                {data.brands.map((b) => (
                  <li key={b.slug}>
                    <Link href={`/brands/${b.slug}`} onClick={onClose} className="hover:text-brand-dark">
                      {b.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {status === "load" ? <p className="mt-4 text-ink-muted">{t("searching")}</p> : null}
          {status === "done" && q.trim().length >= 2 && !data.products.length && !data.categories.length && !data.brands.length ? (
            <p className="mt-4 text-ink-muted">{t("noneLong")}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
