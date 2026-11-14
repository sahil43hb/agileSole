"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, ChevronDown, Pencil, Search } from "lucide-react";
import { AppSelect } from "@/components/ui/app-select";

export const rowBtn =
  "inline-flex h-8 items-center justify-center rounded-full border border-[#e7ebe8] bg-white px-3.5 text-xs font-medium text-ink transition hover:border-brand/25 hover:bg-brand-mist hover:text-brand-dark";

export const rowBtnEdit =
  "row-btn-edit inline-flex h-8 items-center justify-center gap-1 rounded-full px-3.5 text-xs font-semibold text-white transition";

export const rowBtnDanger =
  "inline-flex h-8 items-center justify-center rounded-full border border-red-200 bg-white px-3.5 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50";

export function RowEditButton({
  href,
  onClick,
  children = "Edit",
}: {
  href?: string;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const content = (
    <>
      <Pencil className="h-3 w-3" strokeWidth={2.25} />
      {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={rowBtnEdit}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={rowBtnEdit} onClick={onClick}>
      {content}
    </button>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1>{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminSearch({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder: string;
}) {
  return (
    <label className="search-field min-w-[16rem] flex-1">
      <Search className="search-field-icon" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
        placeholder={placeholder}
        className="admin-search-input h-11 w-full rounded-xl border border-[var(--admin-line)] bg-white text-sm shadow-sm"
      />
    </label>
  );
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const summary =
    value.length === 0 ? `All ${label.toLowerCase()}` : value.length === 1 ? options.find((o) => o.id === value[0])?.label || label : `${value.length} ${label.toLowerCase()}`;

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 min-w-[11.5rem] items-center justify-between gap-3 rounded-xl border border-[var(--admin-line)] bg-white px-3.5 text-sm shadow-sm"
        aria-expanded={open}
      >
        <span className="truncate text-ink">
          <span className="mr-1.5 text-ink-faint">{label}</span>
          {summary}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink-faint transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute start-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--admin-line)] bg-white py-1 shadow-xl">
          <button
            type="button"
            className="flex w-full items-center justify-between px-3.5 py-2 text-sm text-ink-muted hover:bg-[#f4f7f5]"
            onClick={() => onChange([])}
          >
            Clear
            {value.length === 0 ? <Check className="h-4 w-4 text-brand" /> : null}
          </button>
          <div className="max-h-64 overflow-y-auto border-t border-[var(--admin-line)]">
            {options.map((opt) => {
              const on = value.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggle(opt.id)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-[#f4f7f5]"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      on ? "border-brand bg-brand text-white" : "border-[var(--admin-line)] bg-white"
                    }`}
                  >
                    {on ? <Check className="h-3 w-3" /> : null}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SingleSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <AppSelect
      prefix={label}
      value={value}
      onChange={onChange}
      options={options.map((o) => ({ value: o.id, label: o.label }))}
      className="w-auto min-w-[11rem]"
      tone="admin"
    />
  );
}

export function StatusBadge({ value }: { value: string }) {
  const key = value.replaceAll("_", " ");
  const tone =
    value.includes("pending") || value === "on_hold" || value === "unreachable"
      ? "bg-amber-50 text-amber-800"
      : value === "confirmed" || value === "packed" || value === "pickup_ready"
        ? "bg-sky-50 text-sky-800"
        : value === "shipped" || value === "out_for_delivery"
          ? "bg-indigo-50 text-indigo-800"
          : value === "delivered" || value === "published" || value === "active" || value === "paid" || value === "in stock"
            ? "bg-brand-mist text-brand-dark"
            : value === "low stock"
              ? "bg-amber-50 text-amber-800"
            : value.includes("fail") || value === "cancelled" || value === "returned" || value === "blocked" || value === "hidden" || value === "out of stock" || value === "inactive"
              ? "bg-red-50 text-red-700"
              : value === "open"
                ? "bg-orange-50 text-orange-800"
                : "bg-[#f4f7f5] text-ink-muted";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${tone}`}>
      {key}
    </span>
  );
}

export function formatAdminDate(value?: string | Date) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--admin-line)] bg-white px-6 py-12 text-center text-sm text-ink-muted">
      {children}
    </div>
  );
}

export function AdminModal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!ready) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-ink/50" aria-label="Close" onClick={onClose} />
      {children}
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <AdminModal onClose={onCancel}>
      <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn-secondary h-10 px-4"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-10 px-4 ${danger ? "btn-danger" : "btn-primary"}`}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
