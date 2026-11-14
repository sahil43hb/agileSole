import { setRequestLocale } from "next-intl/server";
import { FAQS } from "@/content/faqs";
import { listFaqs } from "@/server/modules/cms/cms.service";

export const revalidate = 60;

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
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
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold">FAQ</h1>
      <dl className="mt-10 space-y-8">
        {items.map((item) => (
          <div key={item.q}>
            <dt className="font-medium">{item.q}</dt>
            <dd className="mt-2 text-ink-muted">{item.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
