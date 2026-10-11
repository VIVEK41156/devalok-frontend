"use client";

import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { HiOutlineEnvelope, HiOutlinePhone } from "react-icons/hi2";
import { useSite } from "@/components/providers/SiteProvider";

const SOCIAL_ICONS: Record<string, IconType> = {
  Instagram: FaInstagram,
  Facebook: FaFacebookF,
  YouTube: FaYoutube,
  X: FaXTwitter,
};

interface Badge {
  key: string;
  href: string;
  image: string;
  label: string;
  meta: string;
}

/**
 * Lavender strip above the main navigation: an endless carousel of collection
 * badges (sculpture thumbnail + category name) and the business's real social
 * and contact links on the right. All content comes from the CMS.
 */
export default function TopBar({ collapsed }: { collapsed: boolean }) {
  const site = useSite();
  const s = site.data.settings;

  // One badge per collection, illustrated by its pieces in turn so the strip has variety.
  const base: Badge[] = site.getCategories().flatMap((c) => {
    const pieces = site.getSculptures(c.id).slice(0, 2);
    const imgs = pieces.length ? pieces.map((p) => p.image.src) : [c.coverImage];
    return imgs.map((image, i) => ({
      key: `${c.id}-${i}`,
      href: `/products#${c.slug}`,
      image,
      label: c.name,
      meta: `${site.getSculptures(c.id).length} pieces`,
    }));
  });
  // Repeat so one half of the track is always wider than the screen, then duplicate for a seamless loop.
  const half = base.length ? Array.from({ length: Math.max(1, Math.ceil(10 / base.length)) }, () => base).flat() : [];

  const whatsapp = s.whatsapp?.replace(/[^0-9]/g, "");
  const links: { label: string; href: string; Icon: IconType; external?: boolean }[] = [
    ...s.social.map((x) => ({ label: x.label, href: x.href, Icon: SOCIAL_ICONS[x.label], external: true })).filter((x) => x.Icon),
    ...(whatsapp ? [{ label: "WhatsApp", href: `https://wa.me/${whatsapp}`, Icon: FaWhatsapp, external: true }] : []),
    ...(s.phone ? [{ label: `Call ${s.phone}`, href: `tel:${s.phone.replace(/[^0-9+]/g, "")}`, Icon: HiOutlinePhone }] : []),
    ...(s.email ? [{ label: `Email ${s.email}`, href: `mailto:${s.email}`, Icon: HiOutlineEnvelope }] : []),
  ];

  return (
    <div
      className={`overflow-hidden bg-lavender text-plum transition-[height,opacity] duration-500 ease-[var(--ease-luxe)] ${collapsed ? "h-0 opacity-0" : "h-[var(--topbar-h)] opacity-100"}`}
      aria-hidden={collapsed}
    >
      <div className="relative mx-auto flex h-[var(--topbar-h)] max-w-[1400px] items-center gap-4 border-b border-gold/30 px-5 sm:px-8">
        {/* Carousel */}
        <div className="group/marquee relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          {half.length > 0 && (
            <ul className="flex w-max animate-marquee items-center group-hover/marquee:[animation-play-state:paused]" aria-label="Our collections">
              {[0, 1].map((copy) =>
                half.map((b, i) => (
                  <li key={`${copy}-${i}-${b.key}`} aria-hidden={copy === 1} className="flex items-center">
                    <Link
                      href={b.href}
                      tabIndex={copy === 1 ? -1 : 0}
                      className="group/badge mx-1.5 flex items-center gap-2 rounded-full bg-ivory/80 py-1 pl-1 pr-3 ring-1 ring-gold/30 transition hover:bg-white hover:ring-gold"
                    >
                      <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-gold/50">
                        <Image src={b.image} alt="" fill sizes="24px" className="object-cover transition-transform duration-500 group-hover/badge:scale-125" />
                      </span>
                      <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] text-plum">{b.label}</span>
                      <span className="hidden whitespace-nowrap text-[10px] text-mist sm:inline">· {b.meta}</span>
                    </Link>
                    <span aria-hidden className="mx-1.5 h-1.5 w-1.5 rotate-45 bg-gold/70" />
                  </li>
                )),
              )}
            </ul>
          )}
        </div>

        {/* Social + contact */}
        {links.length > 0 && (
          <ul className="flex shrink-0 items-center gap-1.5 border-l border-gold/40 pl-3 sm:pl-4" aria-label="Social and contact links">
            {links.map(({ label, href, Icon, external }) => (
              <li key={href}>
                <a
                  href={href}
                  aria-label={label}
                  title={label}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-plum text-[13px] text-ivory transition hover:-translate-y-0.5 hover:bg-gold hover:text-plum-deep"
                >
                  <Icon aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
