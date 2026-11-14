"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

type Suggest = {
  products: { slug: string; title: string; price: number }[];
  categories: { slug: string; label: string }[];
  brands: { slug: string; label: string }[];
};

export function SearchForm() {
  const router = useRouter();
  const locale = useLocale();
  const [q, setQ] = useState("");
  const [data, setData] = useState<Suggest>({ products: [], categories: [], brands: [] });
  const [status, setStatus] = useState<"idle" | "load" | "done">("idle");

  useEffect(() => {
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
  }, [q, locale]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="mt-6 flex gap-2">
        <input
          className="w-full max-w-md border border-paper-line px-3 py-2"
          placeholder="Name, color, or SKU"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn-primary h-11 px-5" type="submit">
          Search
        </button>
      </form>
      {status === "load" ? <p className="mt-3 text-sm text-ink-muted">Searching…</p> : null}
      {data.products.length ? (
        <ul className="mt-4 max-w-md space-y-2 text-sm">
          {data.products.map((p) => (
            <li key={p.slug}>
              <Link href={`/product/${p.slug}`} className="flex justify-between hover:text-brand-dark">
                <span>{p.title}</span>
                <span className="text-ink-faint">Rs {p.price.toLocaleString("en-PK")}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {status === "done" && q.trim().length >= 2 && !data.products.length ? (
        <p className="mt-4 text-sm text-ink-muted">No matches. Try Men, Women, or a colour name.</p>
      ) : null}
    </div>
  );
}
