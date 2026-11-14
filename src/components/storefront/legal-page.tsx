import { setRequestLocale } from "next-intl/server";
import { LEGAL } from "@/content/legal";
import { Link } from "@/i18n/navigation";

export async function LegalPage({
  locale,
  kind,
}: {
  locale: string;
  kind: keyof typeof LEGAL;
}) {
  setRequestLocale(locale);
  const copy = locale === "ur" ? LEGAL[kind].ur : LEGAL[kind].en;
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold">{copy.title}</h1>
      <div className="mt-8 space-y-4 text-ink-muted">
        {copy.body.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
      <Link href="/" className="mt-10 inline-block text-sm text-brand-dark">
        {locale === "ur" ? "ہوم" : "Home"}
      </Link>
    </div>
  );
}
