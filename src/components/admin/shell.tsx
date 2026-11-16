"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  LifeBuoy,
  Star,
  Percent,
  Package,
  FolderTree,
  Tag,
  Layers,
  Warehouse,
  PanelsTopLeft,
  CircleHelp,
  Ruler,
  BarChart3,
  Shield,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  UserRound,
} from "lucide-react";
import { AdminNotifications } from "@/components/admin/notifications";
import { Wordmark } from "@/components/brand/logo";
import { DEFAULT_LOGO, LOGO_CHANGED_EVENT } from "@/lib/brand-icon";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/tickets", label: "Tickets", icon: LifeBuoy },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/brands", label: "Brands", icon: Tag },
      { href: "/admin/collections", label: "Collections", icon: Layers },
      { href: "/admin/size-charts", label: "Size charts", icon: Ruler },
    ],
  },
  {
    title: "Growth",
    items: [
      { href: "/admin/discounts", label: "Discounts", icon: Percent },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/homepage", label: "Homepage", icon: PanelsTopLeft },
      { href: "/admin/faqs", label: "FAQs", icon: CircleHelp },
    ],
  },
  {
    title: "Workspace",
    items: [
      { href: "/admin/staff", label: "Staff", icon: Shield },
      { href: "/admin/audit", label: "Audit", icon: ScrollText },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function roleLabel(role: string) {
  if (role === "super_admin") return "Owner";
  return role.replaceAll("_", " ");
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AdminShell({
  staff,
  children,
  logoSrc,
  storeName = "Agile Sole",
}: {
  staff: { name: string; email: string; role: string };
  children: ReactNode;
  logoSrc?: string;
  storeName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logo, setLogo] = useState(logoSrc || DEFAULT_LOGO);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCollapsed(localStorage.getItem("as_admin_sidebar") === "1");
  }, []);

  useEffect(() => {
    setLogo(logoSrc || DEFAULT_LOGO);
  }, [logoSrc]);

  useEffect(() => {
    function onLogo(e: Event) {
      const next = (e as CustomEvent<string>).detail;
      if (next) setLogo(next);
    }
    window.addEventListener(LOGO_CHANGED_EVENT, onLogo);
    return () => window.removeEventListener(LOGO_CHANGED_EVENT, onLogo);
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("as_admin_sidebar", next ? "1" : "0");
      return next;
    });
  }

  const pageTitle = useMemo(() => {
    if (pathname.startsWith("/admin/profile")) return "Profile";
    const all = GROUPS.flatMap((g) => g.items);
    const match = all.find((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)));
    return match?.label || "Admin";
  }, [pathname]);

  async function logout() {
    await fetch("/api/v1/auth/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const sidebar = (narrow: boolean) => (
    <>
      <div className={`flex h-[76px] shrink-0 flex-col items-center justify-center border-b border-[var(--admin-line)] ${narrow ? "px-2" : "px-5"}`}>
        <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex justify-center">
          <Wordmark
            src={logo}
            alt={storeName}
            compact={narrow}
            className={narrow ? "h-11 w-auto max-w-[68px]" : "h-14 w-auto max-w-[188px]"}
          />
        </Link>
      </div>
      <nav className="admin-sidebar flex-1 overflow-y-auto px-2 py-4">
        {GROUPS.map((group) => (
          <div key={group.title} className="mb-4">
            {!narrow ? (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                {group.title}
              </p>
            ) : null}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center rounded-2xl text-sm transition ${
                      narrow ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2.5"
                    } ${
                      active
                        ? "bg-brand-mist font-medium text-brand-dark"
                        : "text-ink-muted hover:bg-[#f4f7f5] hover:text-ink"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!narrow ? item.label : <span className="sr-only">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div className="admin-app flex h-dvh max-h-dvh min-h-0 overflow-hidden bg-[var(--admin-bg)] text-ink">
      <aside
        className={`relative hidden h-full min-h-0 shrink-0 flex-col border-e border-[var(--admin-line)] bg-white transition-[width] duration-200 md:flex ${
          collapsed ? "w-[84px]" : "w-[268px]"
        }`}
      >
        {sidebar(collapsed)}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute -end-3 top-[62px] z-30 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--admin-line)] bg-white text-ink-muted shadow-sm hover:text-ink"
          aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-[min(86vw,280px)] flex-col bg-white shadow-2xl">{sidebar(false)}</aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-20 flex h-[76px] shrink-0 items-center justify-between gap-3 border-b border-[var(--admin-line)] bg-white/90 px-5 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-xl p-2 text-ink md:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">{pageTitle}</p>
              <p className="hidden text-[11px] text-ink-faint sm:block">{storeName} operations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdminNotifications />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full p-0.5"
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white ring-2 ring-brand-mist ring-offset-2 ring-offset-white">
                {initials(staff.name) || "A"}
              </span>
            </button>

            {menuOpen ? (
              <div className="absolute end-0 top-[calc(100%+10px)] z-30 w-72 overflow-hidden rounded-2xl border border-[var(--admin-line)] bg-white shadow-xl">
                <div className="flex items-center gap-3 border-b border-[var(--admin-line)] px-4 py-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                    {initials(staff.name) || "A"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{staff.name}</p>
                    <p className="truncate text-xs text-ink-muted">{staff.email}</p>
                    <p className="mt-0.5 text-[11px] capitalize text-ink-faint">{roleLabel(staff.role)}</p>
                  </div>
                </div>
                <div className="p-2">
                  <Link
                    href="/admin/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-[#f4f7f5]"
                  >
                    <UserRound className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          </div>
        </header>
        <main className="admin-main min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain bg-[var(--admin-bg)] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
