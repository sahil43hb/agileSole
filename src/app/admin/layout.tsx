import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin.css";
import { getPublicSettings } from "@/server/modules/admin/settings.service";
import { brandIconHref } from "@/lib/brand-icon";

export async function generateMetadata(): Promise<Metadata> {
  const { logo } = await getPublicSettings();
  const icon = brandIconHref(logo);
  return {
    title: "Agile Sole Admin",
    robots: { index: false, follow: false },
    icons: {
      icon: [{ url: icon }],
      apple: [{ url: icon }],
      shortcut: [icon],
    },
  };
}

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="h-dvh overflow-hidden bg-[#f3f5f4] text-ink">{children}</div>;
}
