import { setRequestLocale } from "next-intl/server";
import { SearchForm } from "@/components/storefront/search-form";
import { Link } from "@/i18n/navigation";

export default async function SearchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mx-auto max-w-site px-4 py-16">
      <h1 className="text-3xl font-semibold">{locale === "ur" ? "تلاش" : "Search"}</h1>
      <p className="mt-2 text-sm text-ink-muted">Type a name, colour, or SKU. Suggestions also open from the header search icon.</p>
      <SearchForm />
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/c/men" className="border border-paper-line px-3 py-1">Men</Link>
        <Link href="/c/women" className="border border-paper-line px-3 py-1">Women</Link>
        <Link href="/collections/new-arrivals" className="border border-paper-line px-3 py-1">New in</Link>
      </div>
    </div>
  );
}
