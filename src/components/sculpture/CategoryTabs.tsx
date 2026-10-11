"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/data/types";

/** Sticky in-page navigation for /products that tracks the section in view. */
export default function CategoryTabs({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState(categories[0]?.slug);

  useEffect(() => {
    const sections = categories.map((c) => document.getElementById(c.slug)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    sections.forEach((s) => io.observe(s));

    // Arriving from another page with /products#marble: client navigation doesn't
    // always land on the anchor, so jump there once the sections exist.
    const jump = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = id && document.getElementById(id);
      if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    };
    jump();
    window.addEventListener("hashchange", jump);
    return () => {
      io.disconnect();
      window.removeEventListener("hashchange", jump);
    };
  }, [categories]);

  return (
    <nav aria-label="Collections" className="sticky top-[var(--nav-h)] z-30 border-b border-gold/30 bg-ivory/90 backdrop-blur-xl">
      <ul className="no-scrollbar mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-5 py-3 sm:justify-center sm:px-8">
        {categories.map((c, i) => {
          const on = active === c.slug;
          return (
            <li key={c.id} className="shrink-0">
              <a
                href={`#${c.slug}`}
                aria-current={on ? "true" : undefined}
                className={`flex items-center gap-2.5 rounded-full px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
                  on ? "bg-plum text-ivory" : "text-plum/70 hover:bg-lavender hover:text-plum"
                }`}
              >
                <span className={`font-display text-sm normal-case italic ${on ? "text-gold-soft" : "text-gold-deep"}`}>0{i + 1}</span>
                {c.name}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
