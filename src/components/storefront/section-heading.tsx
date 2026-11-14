import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export function SectionHeading({
  eyebrow,
  title,
  href,
  action,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-dark">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
      </div>
      {href && action ? (
        <Link href={href} className="mb-0.5 shrink-0 text-sm font-medium text-brand-dark hover:underline">
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export function SectionShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-[90rem] px-4 py-12 md:px-8 md:py-16 ${className}`}>{children}</section>;
}
