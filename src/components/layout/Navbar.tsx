"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, LockKeyhole, Mail, Phone, X } from "lucide-react";
import { useSite } from "@/components/providers/SiteProvider";
import TopBar from "./TopBar";
import type { NavItem } from "@/data/types";

// Used only if the CMS menu is empty or unreachable, so the site stays navigable.
const FALLBACK_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact Us", href: "/contact" },
];

const telHref = (phone: string) => `tel:${phone.replace(/[^0-9+]/g, "")}`;

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data, getCategories, getSculptures } = useSite();
  const site = data.settings;
  const navItems = data.menus.header.length ? data.menus.header : FALLBACK_NAV;
  const categories = getCategories();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
    setProductsOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();
    const toggle = toggleRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      toggle?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!productsOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setProductsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [productsOpen]);

  const showProducts = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setProductsOpen(true);
  };
  const hideProducts = () => {
    closeTimer.current = setTimeout(() => setProductsOpen(false), 140);
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const solid = scrolled && !open;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 text-ivory transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
          solid
            ? "bg-plum-deep/88 shadow-[0_1px_0_rgba(200,164,93,0.4),0_20px_40px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            : "bg-gradient-to-b from-plum-deep/70 to-transparent"
        }`}
      >
        <TopBar collapsed={scrolled || open} />
        <nav aria-label="Primary" className="mx-auto flex h-[var(--nav-h)] max-w-[1400px] items-center justify-between px-5 sm:px-8">
          {/* Full official logo (Om mark + DEVALOK SCULPTURES), same as the footer; set in Site Settings → Logo */}
          <Link href="/" className="group relative flex shrink-0 items-center" aria-label={`${site.siteName}, home`}>
            <span aria-hidden className="absolute -inset-x-4 -inset-y-2 rounded-full bg-[radial-gradient(ellipse,rgba(230,211,163,0.16),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <Image
              src={site.logo || "/images/brand/logo.png"}
              alt={site.siteName}
              width={480}
              height={563}
              priority
              className={`relative w-auto drop-shadow-[0_2px_12px_rgba(230,211,163,0.3)] transition-[height] duration-500 ${solid ? "h-[78px] sm:h-[86px]" : "h-[88px] sm:h-[104px]"}`}
            />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const isProducts = item.href === "/products";
              return (
                <li
                  key={item.href}
                  className="relative"
                  onMouseEnter={isProducts ? showProducts : undefined}
                  onMouseLeave={isProducts ? hideProducts : undefined}
                >
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="group relative px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.24em]"
                    >
                      <span className={`transition-colors ${active ? "text-gold-soft" : "text-ivory/85 group-hover:text-ivory"}`}>{item.label}</span>
                      <span
                        aria-hidden
                        className={`absolute inset-x-4 -bottom-0.5 h-px origin-left bg-gold transition-transform duration-500 ${
                          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                        }`}
                      />
                    </Link>
                    {isProducts && (
                      <button
                        type="button"
                        aria-expanded={productsOpen}
                        aria-controls="products-menu"
                        aria-label="Show product categories"
                        onClick={() => setProductsOpen((o) => !o)}
                        className="-ml-3 flex h-8 w-6 items-center justify-center text-ivory/70 hover:text-gold-soft"
                      >
                        <ChevronDown size={14} className={`transition-transform duration-300 ${productsOpen ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>

                  {isProducts && (
                    <AnimatePresence>
                      {productsOpen && (
                        <motion.div
                          id="products-menu"
                          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, rotateX: -8 }}
                          animate={{ opacity: 1, y: 0, rotateX: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          style={{ transformPerspective: 900, transformOrigin: "top center" }}
                          className="absolute left-1/2 top-full w-[620px] -translate-x-1/2 pt-4"
                        >
                          <div className="grid grid-cols-2 gap-2 border border-gold/30 bg-plum-deep/96 p-3 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl">
                            {categories.map((c, i) => (
                              <Link
                                key={c.id}
                                href={`/products#${c.slug}`}
                                onClick={() => setProductsOpen(false)}
                                className="group/item flex items-center gap-4 p-2.5 transition-colors hover:bg-ivory/[0.06]"
                              >
                                <span className="relative h-16 w-14 shrink-0 overflow-hidden ring-1 ring-gold/25">
                                  <Image src={c.coverImage} alt="" fill sizes="56px" className="object-cover transition-transform duration-700 group-hover/item:scale-110" />
                                </span>
                                <span>
                                  <span className="block font-display text-sm italic text-gold">0{i + 1}</span>
                                  <span className="block font-display text-xl leading-tight text-ivory group-hover/item:text-gold-soft">{c.name}</span>
                                  <span className="mt-0.5 block text-[11px] text-ivory/50">{getSculptures(c.id).length} pieces</span>
                                </span>
                              </Link>
                            ))}
                            <Link
                              href="/products"
                              onClick={() => setProductsOpen(false)}
                              className="col-span-2 mt-1 flex items-center justify-between border-t border-ivory/10 px-2.5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-soft hover:text-gold"
                            >
                              View all collections <span aria-hidden>→</span>
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              aria-label="Admin login"
              title="Admin login"
              className="group hidden items-center gap-2 rounded-full border border-ivory/20 py-2 pl-2.5 pr-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory/80 transition-colors hover:border-gold hover:text-gold-soft sm:inline-flex"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/15 text-gold-soft ring-1 ring-gold/40 transition-colors group-hover:bg-gold group-hover:text-plum-deep">
                <LockKeyhole size={12} />
              </span>
              Admin
            </Link>
            <Link
              href="/contact"
              className="hidden border border-gold/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors hover:bg-gold hover:text-plum-deep md:inline-block"
            >
              Enquire
            </Link>
            <button
              ref={toggleRef}
              type="button"
              className="relative z-[60] flex h-11 w-11 items-center justify-center lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? (
                <X size={26} className="text-ivory" />
              ) : (
                <span aria-hidden className="flex w-7 flex-col items-end gap-[7px]">
                  <span className="h-[1.5px] w-7 bg-ivory" />
                  <span className="h-[1.5px] w-5 bg-gold" />
                  <span className="h-[1.5px] w-7 bg-ivory" />
                </span>
              )}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-0 z-[45] flex flex-col overflow-y-auto bg-plum-deep px-6 pb-10 pt-[calc(var(--nav-h)+24px)] text-ivory lg:hidden"
            initial={reduceMotion ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            animate={reduceMotion ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
            exit={reduceMotion ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <div aria-hidden className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full border border-gold/20" />
            <div aria-hidden className="pointer-events-none absolute -right-10 top-40 h-80 w-80 rounded-full border border-gold/10" />
            <ul className="relative flex flex-1 flex-col justify-center gap-1">
              {navItems.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="flex items-baseline gap-4 py-2"
                  >
                    <span className="font-display text-sm italic text-gold">0{i + 1}</span>
                    <span className={`font-display text-[clamp(2.1rem,8.5vw,3.2rem)] leading-none ${isActive(item.href) ? "text-gold-soft" : "text-ivory"}`}>
                      {item.label}
                    </span>
                  </Link>
                  {item.href === "/products" && (
                    <ul className="mb-2 ml-9 grid grid-cols-2 gap-x-4 gap-y-1.5 border-l border-gold/30 pl-4">
                      {categories.map((c) => (
                        <li key={c.id}>
                          <Link href={`/products#${c.slug}`} onClick={() => setOpen(false)} className="text-sm text-ivory/70 hover:text-gold-soft">
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.li>
              ))}
            </ul>
            <div className="relative space-y-3 border-t border-ivory/10 pt-6 text-sm text-ivory/70">
              <Link href="/admin/login" onClick={() => setOpen(false)} className="flex items-center gap-3 font-semibold text-gold-soft hover:text-gold">
                <LockKeyhole size={16} className="text-gold" /> Admin login
              </Link>
              {site.phone && (
                <a href={telHref(site.phone)} className="flex items-center gap-3 hover:text-gold">
                  <Phone size={16} className="text-gold" /> {site.phone}
                </a>
              )}
              {site.email && (
                <a href={`mailto:${site.email}`} className="flex items-center gap-3 hover:text-gold">
                  <Mail size={16} className="text-gold" /> {site.email}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
