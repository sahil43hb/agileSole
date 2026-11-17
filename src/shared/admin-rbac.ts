export const PERMISSION_ACTIONS = ["view", "create", "update", "delete"] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export type ModulePerms = Partial<Record<PermissionAction, boolean>>;
export type PermissionsMap = Record<string, ModulePerms>;

export const ADMIN_MODULES = [
  { id: "dashboard", label: "Dashboard", group: "Overview", actions: ["view"] as const },
  { id: "orders", label: "Orders", group: "Overview", actions: ["view", "create", "update"] as const },
  { id: "customers", label: "Customers", group: "Overview", actions: ["view", "create", "update", "delete"] as const },
  { id: "tickets", label: "Tickets", group: "Overview", actions: ["view", "update"] as const },
  { id: "products", label: "Products", group: "Catalog", actions: ["view", "create", "update", "delete"] as const },
  { id: "inventory", label: "Inventory", group: "Catalog", actions: ["view", "update"] as const },
  { id: "categories", label: "Categories", group: "Catalog", actions: ["view", "create", "update", "delete"] as const },
  { id: "brands", label: "Brands", group: "Catalog", actions: ["view", "create", "update", "delete"] as const },
  { id: "collections", label: "Collections", group: "Catalog", actions: ["view", "create", "update", "delete"] as const },
  { id: "size_charts", label: "Size charts", group: "Catalog", actions: ["view", "create", "update", "delete"] as const },
  { id: "discounts", label: "Discounts", group: "Growth", actions: ["view", "create", "update", "delete"] as const },
  { id: "reviews", label: "Reviews", group: "Growth", actions: ["view", "update"] as const },
  { id: "reports", label: "Reports", group: "Growth", actions: ["view"] as const },
  { id: "homepage", label: "Homepage", group: "Content", actions: ["view", "update"] as const },
  { id: "faqs", label: "FAQs", group: "Content", actions: ["view", "create", "update", "delete"] as const },
  { id: "staff", label: "Staff", group: "Workspace", actions: ["view", "create", "update", "delete"] as const },
  { id: "roles", label: "Roles", group: "Workspace", actions: ["view", "create", "update", "delete"] as const },
  { id: "audit", label: "Audit log", group: "Workspace", actions: ["view"] as const },
  { id: "settings", label: "Settings", group: "Workspace", actions: ["view", "update"] as const },
] as const;

export type AdminModuleId = (typeof ADMIN_MODULES)[number]["id"];

export const ACTION_LABEL: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  update: "Edit",
  delete: "Delete",
};

export function emptyPermissions(): PermissionsMap {
  const next: PermissionsMap = {};
  for (const mod of ADMIN_MODULES) next[mod.id] = {};
  return next;
}

export function allPermissions(): PermissionsMap {
  const next: PermissionsMap = {};
  for (const mod of ADMIN_MODULES) {
    const row: ModulePerms = {};
    for (const action of mod.actions) row[action] = true;
    next[mod.id] = row;
  }
  return next;
}

export function permissionsFor(spec: Partial<Record<AdminModuleId, readonly PermissionAction[] | "all">>): PermissionsMap {
  const next = emptyPermissions();
  for (const mod of ADMIN_MODULES) {
    const wanted = spec[mod.id];
    if (!wanted) continue;
    const row: ModulePerms = {};
    const actions = wanted === "all" ? mod.actions : wanted;
    for (const action of actions) {
      if ((mod.actions as readonly string[]).includes(action)) row[action] = true;
    }
    next[mod.id] = row;
  }
  return next;
}

export function hasPermission(
  permissions: PermissionsMap | undefined,
  moduleId: string,
  action: PermissionAction,
  isOwner = false,
) {
  if (isOwner) return true;
  const row = permissions?.[moduleId] || {};
  if (action === "view") {
    return Boolean(row.view || row.create || row.update || row.delete);
  }
  return Boolean(row[action]);
}

export function actionFromMethod(method: string): PermissionAction {
  const m = method.toUpperCase();
  if (m === "POST") return "create";
  if (m === "PATCH" || m === "PUT") return "update";
  if (m === "DELETE") return "delete";
  return "view";
}

export const PATH_MODULES: { prefix: string; module: AdminModuleId; exact?: boolean }[] = [
  { prefix: "/admin/orders", module: "orders" },
  { prefix: "/admin/customers", module: "customers" },
  { prefix: "/admin/tickets", module: "tickets" },
  { prefix: "/admin/products", module: "products" },
  { prefix: "/admin/inventory", module: "inventory" },
  { prefix: "/admin/categories", module: "categories" },
  { prefix: "/admin/brands", module: "brands" },
  { prefix: "/admin/collections", module: "collections" },
  { prefix: "/admin/size-charts", module: "size_charts" },
  { prefix: "/admin/discounts", module: "discounts" },
  { prefix: "/admin/reviews", module: "reviews" },
  { prefix: "/admin/reports", module: "reports" },
  { prefix: "/admin/homepage", module: "homepage" },
  { prefix: "/admin/faqs", module: "faqs" },
  { prefix: "/admin/staff", module: "staff" },
  { prefix: "/admin/roles", module: "roles" },
  { prefix: "/admin/audit", module: "audit" },
  { prefix: "/admin/settings", module: "settings" },
  { prefix: "/admin", module: "dashboard", exact: true },
];

export function moduleForPath(pathname: string): AdminModuleId | null {
  for (const row of PATH_MODULES) {
    if (row.exact) {
      if (pathname === row.prefix) return row.module;
      continue;
    }
    if (pathname === row.prefix || pathname.startsWith(`${row.prefix}/`)) return row.module;
  }
  return null;
}
