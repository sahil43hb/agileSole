import type { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";

export function ContentShell({ children }: { children: ReactNode }) {
  return <div className="bg-[#f6f7f5] pb-20">{children}</div>;
}

export function ContentHero({
  crumbs,
  kicker,
  title,
  body,
  actions,
}: {
  crumbs?: { href?: string; label: string }[];
  kicker?: string;
  title: string;
  body?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mx-auto max-w-site px-4 pt-8 md:px-8 md:pt-12">
      {crumbs?.length ? <Breadcrumbs items={crumbs} /> : null}
      {kicker ? (
        <p
          className={`mt-4 text-[11px] font-semibold text-brand-dark ${
            /[\u0600-\u06FF]/.test(kicker) ? "" : "uppercase tracking-[0.22em]"
          }`}
        >
          {kicker}
        </p>
      ) : null}
      <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
      {body ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted md:text-base">{body}</p> : null}
      {actions ? <div className="mt-6 flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function ContentCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[1.6rem] bg-white p-5 shadow-[0_10px_36px_rgba(17,17,17,0.04)] ring-1 ring-black/[0.04] md:p-7 ${className}`}>
      {children}
    </div>
  );
}
