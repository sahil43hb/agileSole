"use client";

import { Minus, Plus } from "lucide-react";

export function QtyStepper({
  qty,
  available,
  onChange,
}: {
  qty: number;
  available: number;
  onChange: (qty: number) => void;
}) {
  return (
    <div className="inline-flex h-9 items-center rounded-full bg-[#f3f5f2]">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={qty <= 1}
        onClick={() => onChange(Math.max(1, qty - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink disabled:opacity-30"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-medium tabular-nums">{qty}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={qty >= available}
        onClick={() => onChange(Math.min(available, qty + 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink disabled:opacity-30"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
