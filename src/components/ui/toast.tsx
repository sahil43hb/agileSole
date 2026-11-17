"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { apiErrorMessage } from "@/shared/api-error";

export type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};

type Listener = (items: ToastItem[]) => void;

const listeners = new Set<Listener>();
let items: ToastItem[] = [];

function emit() {
  listeners.forEach((fn) => fn(items));
}

function push(type: ToastType, message: string) {
  const text = (message || "").trim();
  if (!text) return;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  items = [...items.slice(-4), { id, type, message: text }];
  emit();
  window.setTimeout(() => dismiss(id), type === "error" ? 6500 : 4200);
}

function dismiss(id: string) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
  info: (message: string) => push("info", message),
};

export function toastApiError(json: unknown, fallback = "Something went wrong") {
  toast.error(apiErrorMessage(json, fallback));
}

export async function toastFromResponse(res: Response, fallback: string, success?: string) {
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    toast.error(fallback);
    return { ok: false as const, json: null };
  }
  if (!json || typeof json !== "object" || !(json as { ok?: boolean }).ok) {
    toastApiError(json, fallback);
    return { ok: false as const, json };
  }
  if (success) toast.success(success);
  return { ok: true as const, json: json as { ok: true; data?: unknown } };
}

function friendlyValidity(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  const name = `${el.getAttribute("name") || ""} ${el.getAttribute("placeholder") || ""} ${el.id || ""}`.toLowerCase();
  const v = el.validity;
  if (v.valueMissing) {
    if (el instanceof HTMLInputElement && el.type === "email") return "Enter a valid email";
    if (el instanceof HTMLInputElement && el.type === "password") return "Enter your password";
    if (/phone|mobile|03xx/.test(name)) return "Enter a Pakistan mobile like 03XX XXXXXXX";
    if (/code|otp/.test(name)) return "Enter the 6-digit code";
    if (el instanceof HTMLSelectElement) return "Please choose an option";
    return el.getAttribute("placeholder") ? `Please fill in ${el.getAttribute("placeholder")}` : "Please fill in this field";
  }
  if (v.tooShort) {
    const minLen = "minLength" in el ? el.minLength : 0;
    const maxLen = "maxLength" in el ? el.maxLength : 0;
    if (maxLen === 6 || minLen === 6) return "Enter the 6-digit code";
    if (/phone|mobile/.test(name)) return "Enter a Pakistan mobile like 03XX XXXXXXX";
    return `Use at least ${minLen} characters`;
  }
  if (v.typeMismatch && el instanceof HTMLInputElement && el.type === "email") return "Enter a valid email";
  if (v.patternMismatch) {
    if (/phone|mobile/.test(name)) return "Enter a Pakistan mobile like 03XX XXXXXXX";
    if (/code|otp/.test(name)) return "Enter the 6-digit code";
    return el.title || "Please check this field";
  }
  if (v.rangeOverflow) return "That number is too high";
  if (v.rangeUnderflow) return "That number is too low";
  if (v.stepMismatch) return "Enter a whole number";
  return el.validationMessage || "Please check this field";
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listen: Listener = (next) => setToasts(next);
    listeners.add(listen);
    setToasts(items);
    return () => {
      listeners.delete(listen);
    };
  }, []);

  useEffect(() => {
    function onInvalid(e: Event) {
      const el = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (!el || !("validity" in el)) return;
      e.preventDefault();
      toast.error(friendlyValidity(el));
    }
    document.addEventListener("invalid", onInvalid, true);
    return () => document.removeEventListener("invalid", onInvalid, true);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-24 z-[200] mx-auto flex max-w-md flex-col gap-2 sm:inset-x-auto sm:bottom-auto sm:end-4 sm:top-20 sm:start-auto sm:max-w-sm">
      {toasts.map((item) => {
        const Icon = item.type === "success" ? CheckCircle2 : item.type === "error" ? AlertCircle : Info;
        const tone =
          item.type === "success"
            ? "border-brand/20 bg-white text-ink"
            : item.type === "error"
              ? "border-red-200 bg-white text-red-800"
              : "border-[#e7ebe8] bg-white text-ink";
        const iconTone = item.type === "success" ? "text-brand" : item.type === "error" ? "text-red-600" : "text-ink-muted";
        return (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_12px_40px_rgba(17,17,17,0.12)] ${tone}`}
            role="status"
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconTone}`} />
            <p className="min-w-0 flex-1 text-sm leading-5">{item.message}</p>
            <button
              type="button"
              className="shrink-0 rounded-lg p-0.5 text-ink-faint hover:text-ink"
              aria-label="Dismiss"
              onClick={() => dismiss(item.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
