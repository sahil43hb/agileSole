"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";

export function ProductSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue || "");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(q ? `/admin/products?q=${encodeURIComponent(q)}` : "/admin/products");
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl gap-2">
      <label className="search-field min-w-0 flex-1">
        <Search className="search-field-icon" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title or SKU"
          className="admin-search-input h-11 w-full"
        />
      </label>
      <button className="h-11 rounded-xl border border-[var(--admin-line)] bg-white px-4 text-sm" type="submit">
        Search
      </button>
    </form>
  );
}
