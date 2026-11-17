import type { ButtonHTMLAttributes, ReactNode } from "react";
import { BusyLabel } from "@/components/ui/spinner";

const variants = {
  primary:
    "btn-primary",
  secondary:
    "btn-secondary",
  ghost:
    "btn-ghost",
  danger:
    "btn-danger",
} as const;

const sizes = {
  sm: "h-9 px-3.5 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-sm",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  block,
  className = "",
  children,
  type = "button",
  loading,
  loadingLabel,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  block?: boolean;
  children: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 ${variants[variant]} ${sizes[size]} ${block ? "w-full" : ""} disabled:opacity-60 ${className}`}
      {...props}
    >
      <BusyLabel loading={loading} label={loadingLabel}>
        {children}
      </BusyLabel>
    </button>
  );
}
