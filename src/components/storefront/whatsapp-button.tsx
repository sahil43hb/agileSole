"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "@/i18n/navigation";

export function WhatsAppButton({ phone }: { phone?: string }) {
  const pathname = usePathname();
  if (!phone || pathname.startsWith("/cart") || pathname.startsWith("/checkout")) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const href = `https://wa.me/${digits}?text=${encodeURIComponent("Hi Agile Sole, I have a question about a pair.")}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-20 end-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow md:bottom-6"
      aria-label="WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
