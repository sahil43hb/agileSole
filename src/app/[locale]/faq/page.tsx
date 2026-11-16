import { ChevronDown } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FAQS } from "@/content/faqs";
import { listFaqs } from "@/server/modules/cms/cms.service";
import { ContentHero, ContentShell } from "@/components/storefront/content-hero";

export const revalidate = 60;

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages");
  const n = await getTranslations("nav");
  let items: { q: string; a: string }[] = [];
  try {
    items = await listFaqs(locale);
  } catch {
    items = FAQS.map((item) => ({
      q: locale === "ur" ? item.q.ur : item.q.en,
      a: locale === "ur" ? item.a.ur : item.a.en,
    }));
  }

  return (
    <ContentShell>
      <ContentHero
        crumbs={[{ href: "/", label: n("home") }, { label: t("faqTitle") }]}
        kicker={t("help")}
        title={t("faqTitle")}
        body={t("faqHint")}
      />
      <div className="mx-auto mt-10 max-w-site px-4 md:px-8">
        <div className="mx-auto max-w-3xl space-y-3">
          {items.map((item, i) => (
            <details
              key={item.q}
              className="group rounded-[1.35rem] bg-white px-5 py-4 ring-1 ring-black/[0.04] open:shadow-[0_12px_32px_rgba(17,17,17,0.06)] md:px-6"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
                <span className="flex gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f3f5f2] text-[11px] font-semibold text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="pt-0.5 text-base font-medium leading-snug">{item.q}</span>
                </span>
                <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-ink-faint transition group-open:rotate-180" />
              </summary>
              <p className="ms-10 mt-3 text-sm leading-relaxed text-ink-muted">{item.a}</p>
            </details>
          ))}
        </div>
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-between gap-4 rounded-[1.6rem] bg-ink px-6 py-6 text-paper md:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-light">{t("help")}</p>
            <p className="mt-1 text-lg font-semibold">{t("needHelp")}</p>
          </div>
          <Link href="/contact" className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-medium text-white">
            {t("messageUs")}
          </Link>
        </div>
      </div>
    </ContentShell>
  );
}
