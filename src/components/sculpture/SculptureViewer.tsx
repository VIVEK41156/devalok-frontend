"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, type PanInfo } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Expand, Minimize, X } from "lucide-react";
import type { ImageAsset, Sculpture } from "@/data/types";
import { isLowResolution } from "@/lib/catalog";
import { useSite } from "@/components/providers/SiteProvider";

interface Props {
  sculpture: Sculpture;
  onClose: () => void;
  onPrevPiece: () => void;
  onNextPiece: () => void;
  onSelect: (slug: string) => void;
  position: { index: number; total: number };
}

interface View {
  label: string;
  x: number;
  y: number;
  zoom: number;
  /** A separate CMS gallery photo; when absent the view frames the main image. */
  asset?: ImageAsset;
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function SculptureViewer({ sculpture, onClose, onPrevPiece, onNextPiece, onSelect, position }: Props) {
  const { categoryName, getRelatedSculptures } = useSite();
  const views: View[] = [
    { label: "Full view", x: 50, y: 50, zoom: 1 },
    ...sculpture.gallery.map((g, i) => ({ label: `Photo ${i + 2}`, x: 50, y: 50, zoom: 1, asset: g })),
    ...sculpture.details,
  ];
  const [viewIndex, setViewIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const related = getRelatedSculptures(sculpture, 4);
  const view = views[Math.min(viewIndex, views.length - 1)];
  const lowRes = isLowResolution(sculpture);
  const fullscreenSupported = typeof document !== "undefined" && !!document.fullscreenEnabled;

  // Reset to the full view whenever a different piece is shown.
  const [shownId, setShownId] = useState(sculpture.id);
  if (shownId !== sculpture.id) {
    setShownId(sculpture.id);
    setViewIndex(0);
  }

  const stepView = useCallback(
    (dir: 1 | -1) => {
      if (views.length < 2) return dir === 1 ? onNextPiece() : onPrevPiece();
      setViewIndex((i) => (i + dir + views.length) % views.length);
    },
    [views.length, onNextPiece, onPrevPiece],
  );

  // Scroll lock, initial focus, focus restore.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    dialogRef.current?.focus({ preventScroll: true });
    return () => {
      root.style.overflow = prevOverflow;
      if (document.fullscreenElement) void document.exitFullscreen();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
      else if (e.key === "ArrowRight") stepView(1);
      else if (e.key === "ArrowLeft") stepView(-1);
      else if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [onClose, stepView]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void dialogRef.current?.requestFullscreen?.();
  };

  // Gentle pointer-driven tilt of the artwork plane (desktop, full view only).
  const rx = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || e.pointerType !== "mouse" || view.zoom !== 1) return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 7);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 7);
  };
  const resetTilt = () => {
    rx.set(0);
    ry.set(0);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) stepView(1);
    else if (info.offset.x > 60) stepView(-1);
  };

  // Pieces photographed on white are staged as transparent cutouts.
  const mainArt = sculpture.cutout ?? sculpture.image;
  const art = view.asset ?? mainArt;
  const staged = !view.asset && !!sculpture.cutout;
  const ratio = art.width / art.height;
  const frameStyle: CSSProperties = {
    aspectRatio: `${art.width} / ${art.height}`,
    width: `min(100cqw, 100cqh * ${ratio})`,
    maxWidth: lowRes && !view.asset ? `${Math.round(sculpture.image.width * 1.7)}px` : undefined,
  };

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewer-title"
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex flex-col outline-none overflow-y-auto bg-plum-deep text-ivory lg:flex-row lg:overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Ambient light behind the artwork */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute left-[8%] top-[10%] h-[70vh] w-[70vh] rounded-full bg-[radial-gradient(circle,rgba(217,197,240,0.18),transparent_65%)]" />
        <div className="absolute bottom-0 left-[20%] h-[40vh] w-[60vw] bg-[radial-gradient(ellipse_at_bottom,rgba(200,164,93,0.16),transparent_70%)]" />
      </div>

      {/* Stage */}
      <section aria-label="Sculpture images" className="relative flex min-h-[68svh] flex-1 flex-col lg:min-h-0">
        <div className="flex items-center justify-between px-5 pt-5 sm:px-8">
          <p className="eyebrow text-gold-soft/80">
            No. {pad(position.index + 1)} <span className="text-ivory/30">/ {pad(position.total)}</span>
          </p>
          <div className="flex items-center gap-2">
            {fullscreenSupported && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="hidden h-10 w-10 items-center justify-center rounded-full border border-ivory/15 text-ivory/80 transition hover:border-gold hover:text-gold sm:inline-flex"
                aria-label={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
              >
                {isFullscreen ? <Minimize size={16} /> : <Expand size={16} />}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-ivory/15 pl-4 pr-3 text-xs uppercase tracking-[0.2em] text-ivory/80 transition hover:border-gold hover:text-gold lg:hidden"
            >
              Close <X size={16} />
            </button>
          </div>
        </div>

        <div
          className="relative mx-auto flex w-full flex-1 items-center justify-center px-12 py-6 sm:px-20 [perspective:1400px]"
          style={{ containerType: "size" }}
          onPointerMove={onPointerMove}
          onPointerLeave={resetTilt}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`${sculpture.id}-${viewIndex}`}
              className={`relative cursor-grab overflow-hidden active:cursor-grabbing ${staged ? "" : "shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]"}`}
              style={{ ...frameStyle, rotateX: rx, rotateY: ry }}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.7, ease: [0.22, 1, 0.36, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={onDragEnd}
            >
              <div
                className="absolute inset-0 transition-transform duration-700 ease-[var(--ease-luxe)]"
                style={{ transform: `scale(${view.zoom}) translate(${50 - view.x}%, ${50 - view.y}%)` }}
              >
                <Image
                  src={art.src}
                  alt={view.zoom === 1 ? sculpture.image.alt : `${sculpture.name}: ${view.label}`}
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className={`pointer-events-none select-none object-cover ${staged ? "drop-shadow-[0_30px_30px_rgba(0,0,0,0.55)]" : ""}`}
                  priority
                  draggable={false}
                />
              </div>
              {!staged && <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold/25" />}
            </motion.div>
          </AnimatePresence>

          {views.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => stepView(-1)}
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/15 bg-plum-deep/60 text-ivory transition hover:border-gold hover:text-gold sm:left-5"
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => stepView(1)}
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/15 bg-plum-deep/60 text-ivory transition hover:border-gold hover:text-gold sm:right-5"
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails: full view + framed details of the same photograph */}
        <div className="px-5 pb-5 sm:px-8">
          {views.length > 1 ? (
            <div className="no-scrollbar flex items-end justify-center gap-3 overflow-x-auto" role="tablist" aria-label="Views of this sculpture">
              {views.map((v, i) => (
                <button
                  key={v.label}
                  type="button"
                  role="tab"
                  aria-selected={i === viewIndex}
                  onClick={() => setViewIndex(i)}
                  className="group shrink-0 text-left"
                >
                  <span
                    className={`relative block h-16 w-14 overflow-hidden ring-1 transition sm:h-20 sm:w-16 ${
                      i === viewIndex ? "ring-gold" : "opacity-55 ring-ivory/10 group-hover:opacity-90"
                    }`}
                  >
                    <span className="absolute inset-0" style={{ transform: `scale(${v.zoom}) translate(${50 - v.x}%, ${50 - v.y}%)` }}>
                      <Image src={(v.asset ?? mainArt).src} alt="" fill sizes="64px" className="object-cover" />
                    </span>
                  </span>
                  <span className={`mt-1.5 block max-w-16 truncate text-[10px] tracking-wide ${i === viewIndex ? "text-gold-soft" : "text-ivory/45"}`}>
                    {v.label}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-ivory/40">Swipe or use ← → to move between sculptures</p>
          )}
        </div>
      </section>

      {/* Information panel */}
      <aside className="relative flex w-full flex-col border-t border-ivory/10 bg-plum/70 lg:h-full lg:w-[420px] lg:overflow-y-auto lg:border-l lg:border-t-0 xl:w-[460px]">
        <div className="hidden justify-end px-8 pt-5 lg:flex">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-ivory/15 pl-4 pr-3 text-xs uppercase tracking-[0.2em] text-ivory/80 transition hover:border-gold hover:text-gold"
          >
            Close <X size={16} />
          </button>
        </div>

        <div className="flex-1 px-6 py-8 sm:px-8 lg:pt-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={sculpture.id}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="eyebrow text-gold">{categoryName(sculpture.category)} Collection</p>
              <h2 id="viewer-title" className="mt-3 font-display text-4xl font-medium leading-[1.05] text-ivory sm:text-5xl">
                {sculpture.name}
              </h2>
              <span className="gold-rule mt-5" aria-hidden>
                <span className="block h-1.5 w-1.5 rotate-45 bg-gold" />
              </span>
              <p className="mt-5 text-[15px] leading-relaxed text-ivory/75">{sculpture.description}</p>

              <dl className="mt-7 grid grid-cols-3 gap-4 border-y border-ivory/10 py-5 text-sm">
                <div>
                  <dt className="eyebrow text-[10px] text-ivory/40">Material</dt>
                  <dd className="mt-1.5 text-ivory/90">{categoryName(sculpture.category)}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-[10px] text-ivory/40">Finish</dt>
                  <dd className="mt-1.5 text-ivory/90">{sculpture.finish || "—"}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-[10px] text-ivory/40">Form</dt>
                  <dd className="mt-1.5 text-ivory/90">{sculpture.deity || "—"}</dd>
                </div>
              </dl>
              {(sculpture.dimensions || sculpture.weight) && (
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  {sculpture.dimensions && (
                    <div>
                      <dt className="eyebrow text-[10px] text-ivory/40">Dimensions</dt>
                      <dd className="mt-1.5 text-ivory/90">{sculpture.dimensions}</dd>
                    </div>
                  )}
                  {sculpture.weight && (
                    <div>
                      <dt className="eyebrow text-[10px] text-ivory/40">Weight</dt>
                      <dd className="mt-1.5 text-ivory/90">{sculpture.weight}</dd>
                    </div>
                  )}
                </dl>
              )}
              {sculpture.craftsmanship && <p className="mt-4 text-sm leading-relaxed text-ivory/65">{sculpture.craftsmanship}</p>}

              {sculpture.reference && (
                <p className="mt-5 border-l-2 border-gold/60 pl-3 text-xs leading-relaxed text-ivory/55">
                  Reference image: {sculpture.reference.credit} ({sculpture.reference.license}).{" "}
                  <a href={sculpture.reference.url} target="_blank" rel="noopener noreferrer" className="text-gold-soft underline-offset-2 hover:underline">
                    Source
                  </a>
                </p>
              )}

              <Link
                href={`/contact?sculpture=${sculpture.slug}`}
                onClick={onClose}
                className="group mt-7 flex items-center justify-between bg-gold px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-plum-deep transition hover:bg-gold-soft"
              >
                Enquire about this sculpture
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onPrevPiece}
                  className="flex flex-1 items-center justify-center gap-2 border border-ivory/15 py-3 text-xs uppercase tracking-[0.18em] text-ivory/75 transition hover:border-gold hover:text-gold"
                >
                  <ArrowLeft size={14} /> Previous piece
                </button>
                <button
                  type="button"
                  onClick={onNextPiece}
                  className="flex flex-1 items-center justify-center gap-2 border border-ivory/15 py-3 text-xs uppercase tracking-[0.18em] text-ivory/75 transition hover:border-gold hover:text-gold"
                >
                  Next piece <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10">
            <p className="eyebrow text-ivory/50">Related sculptures</p>
            <ul className="mt-4 grid grid-cols-4 gap-3">
              {related.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => onSelect(r.slug)} className="group block w-full text-left" aria-label={`View ${r.name}`}>
                    <span className="relative block aspect-[3/4] overflow-hidden bg-plum-soft ring-1 ring-ivory/10 transition group-hover:ring-gold">
                      <Image src={r.image.src} alt="" fill sizes="96px" className="object-cover transition duration-500 group-hover:scale-105" />
                    </span>
                    <span className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-ivory/60 group-hover:text-gold-soft">{r.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </motion.div>
  );
}
