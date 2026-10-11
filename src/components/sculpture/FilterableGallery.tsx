"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CategoryId } from "@/data/types";
import { useSite } from "@/components/providers/SiteProvider";
import SculptureCard from "./SculptureCard";

type Filter = CategoryId | "all";

interface Props {
  initialFilter?: Filter;
  /** Cap the number of pieces shown (homepage preview). */
  limit?: number;
  tone?: "light" | "dark";
  /** Sync the active filter into ?category= so the view can be shared. */
  syncUrl?: boolean;
}


export default function FilterableGallery({ initialFilter = "all", limit, tone = "light", syncUrl = false }: Props) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const reduceMotion = useReducedMotion();
  const { getCategories, getSculptures } = useSite();
  const categories = getCategories();
  const dark = tone === "dark";

  const all = useMemo(() => getSculptures(filter === "all" ? undefined : filter), [filter, getSculptures]);
  const items = limit ? all.slice(0, limit) : all;
  const sequence = all.map((s) => s.slug);

  const options: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: getSculptures().length },
    ...categories.map((c) => ({ id: c.id as Filter, label: c.shortName, count: getSculptures(c.id).length })),
  ];

  const choose = (id: Filter) => {
    setFilter(id);
    if (syncUrl) {
      const url = new URL(window.location.href);
      if (id === "all") url.searchParams.delete("category");
      else url.searchParams.set("category", id);
      window.history.replaceState(null, "", url);
    }
  };

  return (
    <div>
      <div role="group" aria-label="Filter sculptures by material" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {options.map((o) => {
          const active = o.id === filter;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              onClick={() => choose(o.id)}
              className={`relative shrink-0 rounded-full border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                active
                  ? dark
                    ? "border-gold text-plum-deep"
                    : "border-plum text-ivory"
                  : dark
                    ? "border-ivory/20 text-ivory/70 hover:border-gold hover:text-gold"
                    : "border-plum/15 text-plum/70 hover:border-gold hover:text-gold-deep"
              }`}
            >
              {active && (
                <motion.span
                  layoutId={`filter-pill-${tone}`}
                  className={`absolute inset-0 -z-0 rounded-full ${dark ? "bg-gold" : "bg-plum"}`}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10">
                {o.label}
                <span className={`ml-2 ${active ? "opacity-70" : "opacity-45"}`}>{o.count}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {all.length} {filter === "all" ? "sculptures" : `${filter} sculptures`}
      </p>

      {items.length === 0 ? (
        <div className={`mt-10 border border-dashed p-12 text-center ${dark ? "border-ivory/20 text-ivory/60" : "border-plum/20 text-mist"}`}>
          <p className="font-display text-2xl">No sculptures in this collection yet.</p>
          <button type="button" onClick={() => choose("all")} className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold-deep underline-offset-4 hover:underline">
            View all sculptures
          </button>
        </div>
      ) : (
        <motion.ul layout={!reduceMotion} className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-x-8">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((s, i) => (
              <motion.li
                key={s.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, y: 40, rotateX: -14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                style={{ transformPerspective: 1000, transformOrigin: "50% 100%" }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
                transition={{ duration: 0.6, delay: reduceMotion ? 0 : Math.min(i, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <SculptureCard sculpture={s} sequence={sequence} number={s.order} aspect="aspect-[4/5]" tone={tone} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
