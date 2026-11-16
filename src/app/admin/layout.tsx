import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin.css";
import { getPublicSettings } from "@/server/modules/admin/settings.service";
import { brandIconHref } from "@/lib/brand-icon";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { logo, name } = await getPublicSettings();
  const icon = brandIconHref(logo);
  return {
    title: `${name} Admin`,
    robots: { index: false, follow: false },
    icons: {
      icon: [{ url: icon }],
      apple: [{ url: icon }],
      shortcut: [icon],
    },
  };
}

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="h-dvh max-h-dvh min-h-0 overflow-hidden bg-[#f3f5f4] text-ink">{children}</div>;
}
