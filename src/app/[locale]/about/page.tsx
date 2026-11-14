import { setRequestLocale } from "next-intl/server";
import { BRAND } from "@/shared/constants";
import { Link } from "@/i18n/navigation";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ur = locale === "ur";
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">{BRAND.city}</p>
      <h1 className="mt-2 text-3xl font-semibold">{ur ? "Agile Sole کے بارے میں" : "About Agile Sole"}</h1>
      <p className="mt-6 text-lg">{ur ? BRAND.tagline.ur : BRAND.tagline.en}</p>
      <p className="mt-4 text-ink-muted">{ur ? BRAND.positioning.ur : BRAND.positioning.en}</p>
      <p className="mt-4 text-ink-muted">
        {ur
          ? "ہم گوجرانوالہ کا خاندانی جوتا گھر ہیں۔ سنیکرز سڑک کے لیے، سینڈل گھر کے آرام کے لیے — ایک جوڑی، ایک وقت۔"
          : "A family footwear house in Gujranwala. Sneakers for the street, sandals for the house — one pair at a time. The Facebook shop is still home; this site adds sizes, stock, and a clearer path to cash on delivery."}
      </p>
      <Link href="/lookbook" className="mt-8 inline-block text-sm text-brand-dark">
        {ur ? "لوک بک" : "Lookbook"}
      </Link>
    </div>
  );
}
