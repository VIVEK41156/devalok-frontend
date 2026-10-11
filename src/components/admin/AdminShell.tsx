"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ChevronRight,
  ExternalLink,
  FileText,
  FolderTree,
  Images,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Shapes,
  Users,
  X,
  Navigation,
  Mail,
  Star,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { LoadingState } from "./ui";

interface NavLink {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

export const ADMIN_NAV: NavLink[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/sculptures", label: "Sculptures", icon: Shapes },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/media", label: "Gallery & Media", icon: Images },
  { href: "/admin/pages", label: "Website Pages", icon: FileText },
  { href: "/admin/sections", label: "Homepage Sections", icon: LayoutTemplate },
  { href: "/admin/menus", label: "Navigation Menus", icon: Navigation },
  { href: "/admin/settings", label: "Site Settings", icon: Settings, adminOnly: true },
  { href: "/admin/enquiries", label: "Contact Enquiries", icon: Inbox },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/seo", label: "SEO Settings", icon: Search },
  { href: "/admin/users", label: "Admin Users", icon: Users, adminOnly: true },
  { href: "/admin/smtp", label: "SMTP / Email", icon: Mail, adminOnly: true },
  { href: "/admin/activity", label: "Activity Logs", icon: Activity, adminOnly: true },
];

const STORAGE_KEY = "devalok-admin-sidebar";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "collapsed";
  } catch {
    return false;
  }
}

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const { user, status, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Restore the saved sidebar preference after hydration.
  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  useEffect(() => {
    if (status === "guest") router.replace("/admin/login");
  }, [status, router]);

  // Close the mobile drawer on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  const toggle = () => {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, c ? "expanded" : "collapsed");
      } catch {
        /* preference just won't persist */
      }
      return !c;
    });
  };

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label={status === "guest" ? "Redirecting to sign in…" : "Checking your session…"} />
      </div>
    );
  }

  const links = ADMIN_NAV.filter((l) => !l.adminOnly || user.role === "admin");
  const current = [...links].reverse().find((l) => isActive(pathname, l.href));
  const crumbs = [{ href: "/admin", label: "Dashboard" }, ...(current && current.href !== "/admin" ? [{ href: current.href, label: current.label }] : [])];
  const sub = current && pathname !== current.href ? pathname.slice(current.href.length + 1).split("/")[0] : null;

  const nav = (compact: boolean) => (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {links.map((l) => {
          const active = isActive(pathname, l.href);
          const Icon = l.icon;
          return (
            <li key={l.href} className="group/nav relative">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                aria-label={compact ? l.label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-lavender text-plum shadow-[inset_3px_0_0_#c8a45d]" : "text-ivory/75 hover:bg-white/8 hover:text-ivory"
                } ${compact ? "justify-center px-0" : ""}`}
              >
                <Icon size={18} className={active ? "text-plum" : "text-gold-soft"} />
                {!compact && <span className="truncate">{l.label}</span>}
              </Link>
              {compact && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-plum-deep px-2.5 py-1.5 text-xs text-ivory opacity-0 shadow-lg ring-1 ring-gold/30 transition-opacity group-focus-within/nav:opacity-100 group-hover/nav:opacity-100"
                >
                  {l.label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const brand = (compact: boolean) => (
    <Link href="/admin" className={`flex h-16 shrink-0 items-center gap-3 border-b border-white/10 ${compact ? "h-12 justify-center px-2" : "px-5"}`} aria-label="Devalok CMS dashboard">
      {compact ? (
        <Image src="/images/brand/om.png" alt="" width={36} height={31} className="h-8 w-auto" />
      ) : (
        <>
          <Image src="/images/brand/logo-horizontal.png" alt="Devalok Sculptures" width={584} height={208} className="h-9 w-auto" />
          <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold-soft">CMS</span>
        </>
      )}
    </Link>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-plum-deep text-ivory transition-[width] duration-300 lg:flex ${collapsed ? "w-[76px]" : "w-64"}`}>
        {/* Logo + collapse toggle side by side */}
        <div className={`flex shrink-0 border-b border-white/10 ${collapsed ? "flex-col items-center gap-1 py-2" : "items-center pr-2"}`}>
          <div className="min-w-0 flex-1 [&>a]:border-b-0">{brand(collapsed)}</div>
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ivory/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-gold-soft hover:ring-gold/40"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        {nav(collapsed)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-plum-deep/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-plum-deep text-ivory shadow-2xl">
            <div className="flex items-center justify-between pr-3">
              {brand(false)}
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu" className="rounded-md p-2 text-ivory/70 hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
            {nav(false)}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-gold/20 bg-ivory/90 px-4 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" className="rounded-md p-2 text-plum hover:bg-lavender lg:hidden">
            <Menu size={20} />
          </button>
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 truncate text-sm">
              {crumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight size={14} className="text-mist" />}
                  <Link href={c.href} className={i === crumbs.length - 1 && !sub ? "font-semibold text-plum" : "text-mist hover:text-plum"}>
                    {c.label}
                  </Link>
                </li>
              ))}
              {sub && (
                <li className="flex items-center gap-1.5">
                  <ChevronRight size={14} className="text-mist" />
                  <span className="font-semibold capitalize text-plum">{sub === "new" ? "New" : "Edit"}</span>
                </li>
              )}
            </ol>
          </nav>
          <a href="/" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm text-plum/70 hover:bg-lavender hover:text-plum sm:inline-flex">
            View site <ExternalLink size={14} />
          </a>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight text-plum">{user.name}</p>
            <p className="text-xs capitalize text-mist">{user.role}</p>
          </div>
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-plum font-display text-lg text-gold-soft">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <button type="button" onClick={() => void logout()} className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-plum/70 hover:bg-lavender hover:text-plum" aria-label="Sign out">
            <LogOut size={16} />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
