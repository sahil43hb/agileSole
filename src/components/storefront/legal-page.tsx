import { getTranslations, setRequestLocale } from "next-intl/server";
import { LEGAL } from "@/content/legal";
import { Link } from "@/i18n/navigation";
import { getAllSettings, shippingPolicyCopy } from "@/server/modules/admin/settings.service";
import { Breadcrumbs } from "./breadcrumbs";
import { ContentShell } from "./content-hero";

type LegalCopy = {
  title: string;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
};

export async function LegalPage({
  locale,
  kind,
}: {
  locale: string;
  kind: keyof typeof LEGAL;
}) {
  setRequestLocale(locale);
  const n = await getTranslations("nav");
  const t = await getTranslations("pages");
  const f = await getTranslations("footer");
  const source = locale === "ur" ? LEGAL[kind].ur : LEGAL[kind].en;
  const copy: LegalCopy = {
    title: source.title,
    intro: source.intro,
    sections: source.sections.map((section) => ({ ...section })),
  };
  if (kind === "shipping") {
    const { store } = await getAllSettings();
    const body = shippingPolicyCopy(locale, store);
    copy.sections = copy.sections.map((section) =>
      section.heading === "COD shipping" || section.heading === "کیش شپنگ" ? { ...section, body } : section,
    );
  }

  const related = [
    { href: "/shipping-returns", label: f("shipping"), id: "shipping" },
    { href: "/privacy", label: f("privacy"), id: "privacy" },
    { href: "/terms", label: f("terms"), id: "terms" },
  ];

  return (
    <ContentShell>
      <div className="mx-auto max-w-[42rem] px-4 pt-10 pb-4 md:px-6 md:pt-14">
        <div className="text-center">
          <div className="flex justify-center">
            <Breadcrumbs items={[{ href: "/", label: n("home") }, { label: copy.title }]} />
          </div>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-dark">{t("help")}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{copy.title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted md:text-base">{copy.intro}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {related.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  item.id === kind ? "bg-ink text-paper" : "bg-white text-ink ring-1 ring-black/[0.06] hover:bg-[#eef1ee]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-[1.7rem] bg-white ring-1 ring-black/[0.04]">
          {copy.sections.map((section, i) => (
            <article
              key={section.heading}
              className={`grid gap-3 px-5 py-6 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-6 sm:px-8 sm:py-7 ${
                i ? "border-t border-black/[0.06]" : ""
              }`}
            >
              <p className="text-[11px] font-semibold tabular-nums tracking-[0.18em] text-brand-dark">
                {String(i + 1).padStart(2, "0")}
              </p>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{section.heading}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted md:text-[15px]">{section.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 rounded-[1.6rem] bg-ink px-6 py-7 text-center text-paper">
          <p className="text-lg font-semibold tracking-tight">{t("needHelp")}</p>
          <Link href="/contact" className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-medium text-white">
            {t("messageUs")}
          </Link>
        </div>
      </div>
    </ContentShell>
  );
}
