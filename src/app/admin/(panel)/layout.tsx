import type { ReactNode } from "react";
import { requireAdminPage } from "@/server/lib/require-admin";
import { AdminShell } from "@/components/admin/shell";
import { getPublicSettings } from "@/server/modules/admin/settings.service";
import { BrandIconSync } from "@/components/brand/brand-icon-sync";
import { StoreIdentityProvider } from "@/components/store-identity";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const [staff, settings] = await Promise.all([requireAdminPage(), getPublicSettings()]);
  return (
    <>
      <BrandIconSync src={settings.logo} />
      <StoreIdentityProvider value={settings}>
        <AdminShell staff={staff} logoSrc={settings.logo} storeName={settings.name}>
          {children}
        </AdminShell>
      </StoreIdentityProvider>
    </>
  );
}
