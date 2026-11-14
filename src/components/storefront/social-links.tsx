import type { ReactNode } from "react";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="currentColor">
      <path d="M14.5 8.5V6.7c0-.7.5-1.2 1.2-1.2H17V3h-2.3C12.4 3 11 4.5 11 6.7v1.8H9v2.6h2V21h3.2V11.1h2.3l.4-2.6h-2.7Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="currentColor">
      <path d="M12.04 3.5A8.45 8.45 0 0 0 4.2 16.4L3.5 20.5l4.2-.7A8.45 8.45 0 1 0 12.04 3.5Zm4.9 12c-.2.57-1.17 1.05-1.62 1.12-.41.06-.93.09-1.5-.09-.35-.12-.79-.26-1.36-.5-2.4-1.04-3.96-3.46-4.08-3.62-.12-.16-1-1.33-1-2.54s.63-1.8.86-2.05c.2-.22.53-.33.86-.33h.62c.2 0 .47-.07.73.56.27.66.91 2.28.99 2.45.08.16.13.35.03.56-.1.22-.15.35-.3.54-.15.18-.31.4-.44.54-.15.15-.3.32-.13.62.16.3.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.3 1.4.3.14.48.12.66-.07.18-.2.77-.9.98-1.2.2-.31.41-.26.68-.15.28.1 1.76.83 2.06.98.3.15.5.22.57.35.08.13.08.75-.13 1.32Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="currentColor">
      <path d="M14.5 3c.3 2.4 1.6 4.1 4 4.5v2.6c-1.4 0-2.7-.45-3.8-1.3v6.1a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.08v2.7a3 3 0 1 0 2.1 2.9V3h2.5Z" />
    </svg>
  );
}

const STYLES: Record<string, string> = {
  Facebook: "bg-[#1877F2] text-white hover:bg-[#166fe5]",
  Instagram: "bg-[linear-gradient(45deg,#f58529_0%,#dd2a7b_50%,#8134af_100%)] text-white hover:opacity-90",
  TikTok: "bg-[#111] text-white hover:bg-black",
  WhatsApp: "bg-[#25D366] text-white hover:bg-[#1ebe5d]",
};

export function FooterSocialLinks({ whatsapp }: { whatsapp?: string }) {
  const wa = (whatsapp || process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/\D/g, "");
  const facebook = process.env.NEXT_PUBLIC_FACEBOOK || "https://www.facebook.com/sahil.mazeem";
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM || "https://www.instagram.com/agilesole/";
  const tiktok = process.env.NEXT_PUBLIC_TIKTOK || "https://www.tiktok.com/@agilesole";

  const items = [
    { href: facebook, label: "Facebook", icon: <FacebookIcon /> },
    { href: instagram, label: "Instagram", icon: <InstagramIcon /> },
    { href: tiktok, label: "TikTok", icon: <TikTokIcon /> },
    wa ? { href: `https://wa.me/${wa}`, label: "WhatsApp", icon: <WhatsAppIcon /> } : null,
  ].filter(Boolean) as { href: string; label: string; icon: ReactNode }[];

  return (
    <nav aria-label="Social" className="flex items-center gap-2">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={item.label}
          className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition hover:scale-105 ${STYLES[item.label]}`}
        >
          {item.icon}
        </a>
      ))}
    </nav>
  );
}
