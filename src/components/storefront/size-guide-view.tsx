"use client";

import { useMemo, useState } from "react";
import { Ruler } from "lucide-react";
import { useTranslations } from "next-intl";
import { ContentCard } from "./content-hero";

type Chart = {
  code: string;
  title: string;
  rows: { eu?: string; pk?: string; uk?: string; us?: string; cm?: string }[];
};

export function SizeGuideView({ charts }: { charts: Chart[] }) {
  const t = useTranslations("pages");
  const [active, setActive] = useState(charts[0]?.code || "");
  const chart = useMemo(() => charts.find((c) => c.code === active) || charts[0], [charts, active]);

  const measures = [
    { code: "EU", hint: t("euHint") },
    { code: "PK", hint: t("pkHint") },
    { code: "US", hint: t("usHint") },
    { code: "CM", hint: t("cmHint") },
  ];

  if (!chart) return null;

  return (
    <div className="mx-auto mt-10 max-w-site space-y-6 px-4 md:px-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {measures.map((m) => (
          <div key={m.code} className="rounded-[1.35rem] bg-white p-4 ring-1 ring-black/[0.04]">
            <p className="text-lg font-semibold tracking-tight text-brand-dark">{m.code}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{m.hint}</p>
          </div>
        ))}
      </div>

      {charts.length > 1 ? (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {charts.map((c) => {
            const on = c.code === chart.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setActive(c.code)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  on ? "bg-ink text-paper" : "bg-white text-ink ring-1 ring-black/[0.06] hover:bg-[#eef1ee]"
                }`}
              >
                {c.title}
              </button>
            );
          })}
        </div>
      ) : null}

      <ContentCard className="overflow-hidden p-0 md:p-0">
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-5 py-4 md:px-7">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-mist text-brand">
            <Ruler className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">{t("charts")}</p>
            <h2 className="text-lg font-semibold tracking-tight">{chart.title}</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-start text-sm">
            <thead>
              <tr className="bg-[#f7f8f6] text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                <th className="px-5 py-3 md:px-7">{t("euEurope")}</th>
                <th className="px-3 py-3">{t("pkPakistan")}</th>
                <th className="px-3 py-3">UK</th>
                <th className="px-3 py-3">US</th>
                <th className="px-5 py-3 md:px-7">{t("lengthCm")}</th>
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((row, i) => (
                <tr key={`${chart.code}-${row.eu}-${i}`} className="border-t border-black/[0.05]">
                  <td className="px-5 py-3.5 font-semibold tabular-nums md:px-7">{row.eu}</td>
                  <td className="px-3 py-3.5 tabular-nums text-ink-muted">{row.pk || row.uk}</td>
                  <td className="px-3 py-3.5 tabular-nums text-ink-muted">{row.uk}</td>
                  <td className="px-3 py-3.5 tabular-nums text-ink-muted">{row.us}</td>
                  <td className="px-5 py-3.5 tabular-nums md:px-7">{row.cm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </div>
  );
}
