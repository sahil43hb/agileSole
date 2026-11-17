import type { ReactNode } from "react";
import { headers } from "next/headers";
import { requireAdminPage } from "@/server/lib/require-admin";
import { AdminShell } from "@/components/admin/shell";
import { AdminAccessProvider } from "@/components/admin/access";
import { getPublicSettings } from "@/server/modules/admin/settings.service";
import { BrandIconSync } from "@/components/brand/brand-icon-sync";
import { StoreIdentityProvider } from "@/components/store-identity";
import { hasPermission, moduleForPath } from "@/shared/admin-rbac";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const [staff, settings, headerList] = await Promise.all([requireAdminPage(), getPublicSettings(), headers()]);
  const pathname = headerList.get("x-admin-path") || "/admin";
  const moduleId = moduleForPath(pathname);
  const allowed =
    pathname.startsWith("/admin/profile") ||
    !moduleId ||
    hasPermission(staff.permissions, moduleId, "view", staff.isOwner);

  return (
    <>
      <BrandIconSync src={settings.logo} />
      <StoreIdentityProvider value={settings}>
        <AdminAccessProvider staff={staff}>
          <AdminShell staff={staff} logoSrc={settings.logo} storeName={settings.name}>
            {allowed ? (
              children
            ) : (
              <div className="mx-auto max-w-lg rounded-3xl border border-[var(--admin-line)] bg-white p-8 text-center shadow-sm">
                <p className="text-lg font-semibold tracking-tight">You don’t have access</p>
                <p className="mt-2 text-sm text-ink-muted">Ask an owner to grant view permission for this page.</p>
              </div>
            )}
          </AdminShell>
        </AdminAccessProvider>
      </StoreIdentityProvider>
    </>
  );
}
