import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LookbookGrid } from "@/components/storefront/lookbook-grid";
import { ArrowRight } from "lucide-react";

export default async function LookbookPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ur = locale === "ur";
  return (
    <div className="mx-auto max-w-site px-4 py-10 md:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-dark">
        Agile Sole · Gujranwala
      </p>
      <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">Lookbook</h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted">
        {ur
          ? "سنیکرز سڑک کے لیے، آرام گھر کے لیے — وہی گوجرانوالہ جوڑیاں، اب سائٹ پر فریم کی گئی۔"
          : "Sneakers for the street, comfort for the house — the Gujranwala mix, framed for the site."}
      </p>
      <LookbookGrid locale={locale} />
      <div className="mt-10">
        <Link href="/shop" className="btn-primary inline-flex h-12 items-center gap-2 rounded-full px-7">
          {ur ? "سب جوڑیاں دیکھیں" : "Shop the collection"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
