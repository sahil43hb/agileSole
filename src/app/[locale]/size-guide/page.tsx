import { setRequestLocale } from "next-intl/server";
import { listSizeCharts } from "@/server/modules/catalog/taxonomy.service";

export const revalidate = 60;

export default async function SizeGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const charts = await listSizeCharts(locale);

  return (
    <div className="mx-auto max-w-site px-4 py-10">
      <h1 className="text-3xl font-semibold">{locale === "ur" ? "سائز گائیڈ" : "Size guide"}</h1>
      <p className="mt-2 max-w-xl text-ink-muted">
        EU is the European size we sell. PK is the Pakistan size (same as UK in most local shops). US is the American equivalent. CM is your foot length in centimetres — measure heel to longest toe if you sit between sizes.
      </p>
      <div className="mt-10 space-y-12">
        {charts.map((chart) => (
          <section key={chart.code}>
            <h2 className="text-xl font-semibold">{chart.title}</h2>
            <table className="mt-4 w-full max-w-xl text-start text-sm">
              <thead>
                <tr className="border-b border-paper-line text-ink-faint">
                  <th className="py-2">EU (Europe)</th>
                  <th className="py-2">PK (Pakistan)</th>
                  <th className="py-2">UK</th>
                  <th className="py-2">US</th>
                  <th className="py-2">Length (cm)</th>
                </tr>
              </thead>
              <tbody>
                {chart.rows.map((row: { eu?: string; pk?: string; uk?: string; us?: string; cm?: string }, i: number) => (
                  <tr key={`${chart.code}-${row.eu}-${i}`} className="border-b border-paper-line">
                    <td className="py-2">{row.eu}</td>
                    <td>{row.pk || row.uk}</td>
                    <td>{row.uk}</td>
                    <td>{row.us}</td>
                    <td>{row.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
}
