"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type AppSelectOption = { value: string; label: string };

type Tone = "admin" | "store";
type Size = "md" | "sm";

type MenuPos = { top: number; left: number; width: number; maxHeight?: number };

function placeMenu(trigger: HTMLElement, itemCount: number, searchable: boolean): MenuPos {
  const r = trigger.getBoundingClientRect();
  const width = Math.max(r.width, 188);
  const estimated = Math.min(itemCount, 12) * 44 + (searchable ? 56 : 16);
  const cap = searchable || itemCount > 8;
  const maxHeight = cap ? Math.min(360, window.innerHeight - 24) : undefined;
  const box = maxHeight ?? estimated;
  let top = r.bottom + 6;
  if (top + box > window.innerHeight - 8) {
    top = Math.max(8, window.innerHeight - box - 8);
  }
  const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
  return { top, left, width, maxHeight };
}

export function AppSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  prefix,
  disabled,
  required,
  name,
  tone = "admin",
  size = "md",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  prefix?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  tone?: Tone;
  size?: Size;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const searchable = options.length > 8;

  const selected = options.find((o) => o.value === value);
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const updatePos = useCallback(() => {
    if (triggerRef.current) setPos(placeMenu(triggerRef.current, options.length, searchable));
  }, [options.length, searchable]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
    const onWin = () => updatePos();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(-1);
      return;
    }
    const i = filtered.findIndex((o) => o.value === value);
    setActive(i >= 0 ? i : 0);
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  function pick(next: string) {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onTriggerKey(e: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onMenuKey(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, (i < 0 ? -1 : i) + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, (i < 0 ? 0 : i) - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[active];
      if (opt) pick(opt.value);
    }
  }

  const admin = tone === "admin";
  const trigger =
    size === "sm"
      ? `inline-flex h-9 min-w-[4.25rem] items-center justify-between gap-2 rounded-lg border px-2.5 text-xs ${
          admin ? "border-[#e7ebe8] bg-white" : "border-paper-line bg-white"
        }`
      : `flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-sm ${
          admin
            ? "border-[#e7ebe8] bg-[#f7f8f7] shadow-sm"
            : "border-paper-line bg-white"
        }`;

  return (
    <div className={className || (size === "sm" ? "inline-block" : "mt-1.5 w-full")}>
      {name ? <input type="hidden" name={name} value={value} required={required} /> : null}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
        className={`${trigger} text-start text-ink outline-none transition hover:bg-white disabled:opacity-50 ${
          open ? "border-brand bg-white ring-2 ring-brand/20" : ""
        }`}
      >
        <span className="min-w-0 truncate">
          {prefix ? <span className="mr-1.5 text-ink-faint">{prefix}</span> : null}
          <span className={selected ? "text-ink" : "text-ink-faint"}>{selected?.label || placeholder}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink-faint transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && pos
        ? createPortal(
            <div
              ref={menuRef}
              style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}
              className="fixed z-[320] flex flex-col overflow-hidden rounded-2xl border border-[#e7ebe8] bg-white py-1.5 shadow-[0_18px_50px_rgba(17,17,17,0.14)]"
              onKeyDown={onMenuKey}
            >
              {searchable ? (
                <div className="border-b border-[#e7ebe8] px-2 pb-1.5 pt-1">
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActive(0);
                    }}
                    placeholder="Search"
                    className="h-9 w-full rounded-lg border border-[#e7ebe8] bg-[#f7f8f7] px-3 text-sm outline-none focus:border-brand focus:bg-white"
                  />
                </div>
              ) : null}
              <ul id={listId} role="listbox" className="min-h-0 flex-1 overflow-y-auto p-1">
                {filtered.length === 0 ? (
                  <li className="px-3 py-2.5 text-sm text-ink-faint">No matches</li>
                ) : (
                  filtered.map((opt, i) => {
                    const on = opt.value === value;
                    return (
                      <li key={opt.value} role="option" aria-selected={on}>
                        <button
                          type="button"
                          onMouseEnter={() => setActive(i)}
                          onClick={() => pick(opt.value)}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-start text-sm transition ${
                            on
                              ? "bg-brand-mist font-medium text-brand-dark"
                              : i === active
                                ? "bg-[#f4f7f5] text-ink"
                                : "text-ink hover:bg-[#f4f7f5]"
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                          {on ? <Check className="h-4 w-4 shrink-0 text-brand" /> : null}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
