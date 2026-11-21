"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { LoginOtpForm } from "./login-otp-form";

export function LoginModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}) {
  const c = useTranslations("common");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  if (!open || !ready) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-5">
      <button type="button" className="absolute inset-0" aria-label={c("close")} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="relative z-10 w-full max-w-md rounded-t-[1.6rem] bg-white p-6 shadow-[0_10px_36px_rgba(17,17,17,0.12)] ring-1 ring-black/[0.04] sm:rounded-[1.6rem] md:p-8"
      >
        <button
          type="button"
          aria-label={c("close")}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f5f2] text-ink-muted transition hover:bg-[#e8ece8] hover:text-ink"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
        <div id="login-modal-title">
          <LoginOtpForm onSuccess={onSuccess} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
