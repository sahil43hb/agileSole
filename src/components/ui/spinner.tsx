import type { ReactNode } from "react";

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-90"
      />
    </svg>
  );
}

export function BusyLabel({
  loading,
  label,
  children,
}: {
  loading?: boolean;
  label?: string;
  children: ReactNode;
}) {
  if (!loading) return <>{children}</>;
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Spinner />
      <span>{label ?? children}</span>
    </span>
  );
}
