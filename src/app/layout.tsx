import type { ReactNode } from "react";
import { Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { BrandIconSync } from "@/components/brand/brand-icon-sync";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  variable: "--font-nastaliq",
  weight: "400",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${nastaliq.variable}`}>
      <body suppressHydrationWarning className="min-h-dvh bg-paper font-sans text-ink antialiased">
        <BrandIconSync />
        {children}
      </body>
    </html>
  );
}
