"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AdminSession } from "@/server/modules/auth/admin.service";
import { hasPermission, moduleForPath, type PermissionAction } from "@/shared/admin-rbac";

const AccessContext = createContext<AdminSession | null>(null);

export function AdminAccessProvider({ staff, children }: { staff: AdminSession; children: ReactNode }) {
  return <AccessContext.Provider value={staff}>{children}</AccessContext.Provider>;
}

export function useAdminAccess() {
  const staff = useContext(AccessContext);
  function can(moduleId: string, action: PermissionAction = "view") {
    if (!staff) return false;
    return hasPermission(staff.permissions, moduleId, action, staff.isOwner);
  }
  return { staff, can };
}

export function useCan(moduleId: string) {
  const { can } = useAdminAccess();
  return {
    view: can(moduleId, "view"),
    create: can(moduleId, "create"),
    update: can(moduleId, "update"),
    delete: can(moduleId, "delete"),
  };
}

export function Can({
  module: moduleId,
  action = "view",
  children,
}: {
  module: string;
  action?: PermissionAction;
  children: ReactNode;
}) {
  const { can } = useAdminAccess();
  if (!can(moduleId, action)) return null;
  return <>{children}</>;
}

export function AdminRouteGuard({ pathname, children }: { pathname: string; children: ReactNode }) {
  const { can } = useAdminAccess();
  if (pathname.startsWith("/admin/profile") || pathname.startsWith("/admin/login")) return <>{children}</>;
  const moduleId = moduleForPath(pathname);
  if (!moduleId || can(moduleId, "view")) return <>{children}</>;
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-[var(--admin-line)] bg-white p-8 text-center shadow-sm">
      <p className="text-lg font-semibold tracking-tight">You don’t have access</p>
      <p className="mt-2 text-sm text-ink-muted">Ask an owner to grant view permission for this page.</p>
    </div>
  );
}
