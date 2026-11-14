import type { ButtonHTMLAttributes, ReactNode } from "react";

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
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  block?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      className={`${variants[variant]} ${sizes[size]} ${block ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
