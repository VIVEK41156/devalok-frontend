"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useSite } from "@/components/providers/SiteProvider";
import { useSculptureViewer } from "@/components/sculpture/ViewerProvider";

interface Result {
  key: string;
  kind: "sculpture" | "collection";
  title: string;
  meta: string;
  image: string;
  contain: boolean;
  go: () => void;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");

/**
 * Header search over the CMS catalogue (sculptures + collections). Runs in the
 * browser on data the page already has, so results appear instantly.
 * Compact field on wide screens; an icon that opens the field on smaller ones.
 */
export default function HeaderSearch({ solid }: { solid: boolean }) {
  const site = useSite();
  const router = useRouter();
  const { openSculpture } = useSculptureViewer();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false); // small screens: field shown
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo<Result[]>(() => {
    const q = norm(query.trim());
    if (q.length < 2) return [];
    const terms = q.split(/\s+/);
    const match = (hay: string) => terms.every((t) => hay.includes(t));
    const close = () => {
      setOpen(false);
      setExpanded(false);
      setQuery("");
    };

    const collections: Result[] = site
      .getCategories()
      .filter((c) => match(norm(`${c.name} ${c.shortName} ${c.tagline} ${c.description}`)))
      .map((c) => ({
        key: `c-${c.id}`,
        kind: "collection",
        title: c.name,
        meta: `Collection · ${site.getSculptures(c.id).length} pieces`,
        image: c.coverImage,
        contain: false,
        go: () => {
          close();
          router.push(`/products#${c.slug}`);
        },
      }));

    const all = site.getSculptures();
    const sequence = all.map((s) => s.slug);
    const sculptures: Result[] = all
      .map((s) => {
        const name = norm(s.name);
        const hay = norm(`${s.name} ${s.deity} ${s.finish} ${site.categoryName(s.category)} ${s.summary} ${s.description}`);
        if (!match(hay)) return null;
        // Name matches rank above description matches.
        const score = terms.every((t) => name.includes(t)) ? (name.startsWith(terms[0]) ? 0 : 1) : 2;
        return { s, score };
      })
      .filter((x): x is { s: (typeof all)[number]; score: number } => !!x)
      .sort((a, b) => a.score - b.score || a.s.order - b.s.order)
      .slice(0, 6)
      .map(({ s }) => ({
        key: `s-${s.id}`,
        kind: "sculpture",
        title: s.name,
        meta: [site.categoryName(s.category), s.deity].filter(Boolean).join(" · "),
        image: (s.cutout ?? s.image).src,
        contain: !!s.cutout,
        go: () => {
          close();
          openSculpture(s.slug, sequence);
        },
      }));

    return [...collections, ...sculptures].slice(0, 8);
  }, [query, site, router, openSculpture]);

  // Close when clicking outside.
  useEffect(() => {
    if (!open && !expanded) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) {
        setOpen(false);
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, expanded]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setExpanded(false);
      input.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      results[active].go();
    }
  };

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={wrap} className="relative">
      {/* Small screens: icon toggles the field */}
      <button
        type="button"
        onClick={() => {
          setExpanded((v) => !v);
          setTimeout(() => input.current?.focus(), 30);
        }}
        aria-label="Search sculptures"
        aria-expanded={expanded}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/20 text-ivory/80 transition hover:border-gold hover:text-gold-soft xl:hidden"
      >
        {expanded ? <X size={16} /> : <Search size={16} />}
      </button>

      <div
        className={`${expanded ? "fixed inset-x-4 top-[calc(var(--nav-h)+8px)] z-[70] block sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+12px)] sm:w-[340px]" : "hidden"} xl:static xl:block`}
      >
        <label className="group relative block">
          <span className="sr-only">Search sculptures and collections</span>
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-soft/80" />
          <input
            ref={input}
            type="search"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showPanel && results[active] ? `${listId}-${active}` : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder="Search sculptures…"
            autoComplete="off"
            className={`w-full rounded-full border py-2.5 pl-10 pr-4 text-sm text-ivory placeholder:text-ivory/45 outline-none transition-[width,border-color,background-color] duration-300 focus:border-gold xl:w-[190px] xl:focus:w-[260px] 2xl:w-[220px] ${
              expanded ? "border-gold/50 bg-plum-deep shadow-2xl" : solid ? "border-ivory/20 bg-white/[0.06]" : "border-ivory/25 bg-plum-deep/40 backdrop-blur-sm"
            } [&::-webkit-search-cancel-button]:hidden`}
          />
        </label>

        {showPanel && (
          <div className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-gold/30 bg-plum-deep/98 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            {results.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-ivory/60">
                No sculptures match &ldquo;{query.trim()}&rdquo;.
                <br />
                <span className="text-xs text-ivory/40">Try a deity, material or collection, e.g. &ldquo;Krishna&rdquo; or &ldquo;stone&rdquo;.</span>
              </p>
            ) : (
              <ul id={listId} role="listbox" aria-label="Search results" className="max-h-[60vh] overflow-y-auto py-2">
                {results.map((r, i) => (
                  <li key={r.key} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={r.go}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === active ? "bg-ivory/[0.08]" : ""}`}
                    >
                      <span className={`relative h-12 w-10 shrink-0 overflow-hidden rounded-md ring-1 ring-gold/30 ${r.contain ? "bg-lilac/50" : ""}`}>
                        <Image src={r.image} alt="" fill sizes="40px" className={r.contain ? "object-contain object-bottom" : "object-cover"} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-lg leading-tight text-ivory">{r.title}</span>
                        <span className="block truncate text-[11px] uppercase tracking-[0.14em] text-gold-soft/80">{r.meta}</span>
                      </span>
                      <ArrowUpRight size={15} className={`shrink-0 transition ${i === active ? "text-gold" : "text-ivory/30"}`} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
