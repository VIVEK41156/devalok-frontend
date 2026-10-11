"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { useSite } from "@/components/providers/SiteProvider";
import type { Sculpture } from "@/data/types";
import { useSculptureViewer } from "@/components/sculpture/ViewerProvider";
import SculptureCard from "@/components/sculpture/SculptureCard";
import { titleOf } from "@/components/ui/SectionTitle";

/*
 * The Hall of Devotion — a scroll-driven camera move through a temple corridor.
 *
 * Scroll drives a smoothed camera position f (GSAP scrub): f = i means the camera
 * rests in front of piece i; f = ENTRY is outside the gate.
 *
 * Performance rules (this runs every frame while scrolling):
 *  - the floor and walls are a "treadmill": three planes that stay with the
 *    camera and jump back by exactly one pattern period, so the corridor looks
 *    endless while only three layers exist and their transform rarely changes
 *    (many long, intersecting planes were what made it lag and blink);
 *  - anything behind the camera is hidden (visibility), so nothing flips;
 *  - per frame we only write transform / opacity / visibility via quickSetter;
 *  - no blur filters, blend modes or React state changes inside the scroll loop.
 */

const HALL_SIZE = 7;
const SPACING = 1500; // depth between pieces (px)
const START = 900; // depth of the first piece
const VIEW = 620; // how far in front of a piece the camera rests
const ENTRY = -1; // f value at the gate
const SIDE_ANGLE = 34; // how much an unfocused piece is turned towards the corridor
const DRAW = 6000; // draw distance; beyond this the hall is lost in shadow anyway
const PERIOD = 600; // repeat length of the floor/wall pattern (pillar spacing)
const BEHIND = 700; // corridor extends this far behind the camera
const CORRIDOR = DRAW + BEHIND + PERIOD; // length of the treadmill planes
// The planes are drawn at 1/RES size and scaled up: seen at grazing angles they look
// identical, but the GPU has ~16x fewer texture pixels to sample every frame.
const RES = 4;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/** Flat near whole numbers (the camera "holds" on each piece), smooth in between. */
function holdEase(f: number) {
  const i = Math.floor(f);
  const t = f - i;
  const h = 0.22;
  const u = clamp((t - h) / (1 - 2 * h));
  return i + u * u * (3 - 2 * u);
}

const DUST = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  size: 2 + ((i * 7) % 3),
  dur: 10 + ((i * 5) % 8),
  delay: -((i * 3) % 12),
}));

// Patterns are authored at 1/RES scale (see RES): 300px floor bands → 75px, 600px pillars → 150px.
const FLOOR_BG =
  "linear-gradient(90deg, #241a2d 0 34%, #7a6340 34% calc(34% + 1px), #241a2d calc(34% + 1px) calc(66% - 1px), #7a6340 calc(66% - 1px) 66%, #241a2d 66%), repeating-linear-gradient(0deg, rgba(200,164,93,0.2) 0 1px, transparent 1px 75px)";
const WALL_BG =
  "repeating-linear-gradient(90deg, #4a3858 0 30px, #1f1627 30px 40px, #6b5638 40px 41px, #1f1627 41px 150px)";

interface SceneProps {
  pieces: Sculpture[];
  arches: { key: string; z: number; gate: boolean }[];
  categoryName: (id: string) => string;
  onOpen: (slug: string) => void;
}

/** The static 3D geometry. Memoised so it never re-renders while scrolling. */
const Scene = memo(function Scene({ pieces, arches, categoryName, onOpen }: SceneProps) {
  return (
    <>
      {/* Treadmill corridor: moved in whole pattern periods to follow the camera */}
      <div data-treadmill style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
        <div aria-hidden className="absolute" style={{ width: 2600 / RES, height: CORRIDOR / RES, left: -1300, top: 190, transform: `rotateX(-90deg) scale(${RES})`, transformOrigin: "0 0", background: FLOOR_BG }} />
        {[-1, 1].map((side) => (
          <div key={side} aria-hidden className="absolute" style={{ width: CORRIDOR / RES, height: 1300 / RES, top: -1110, left: side * 900, transform: `rotateY(90deg) scale(${RES})`, transformOrigin: "0 0", background: WALL_BG }} />
        ))}
      </div>

      {arches.map((a) => (
        <svg
          key={a.key}
          data-arch={a.z}
          data-gate={a.gate ? "" : undefined}
          aria-hidden
          viewBox="0 0 600 760"
          className="absolute text-gold"
          fill="none"
          style={{ width: 1500, height: 1900, left: -750, top: -1710, transform: `translateZ(${a.z}px)`, opacity: a.gate ? 0.9 : 0.4, willChange: "transform, opacity" }}
        >
          <path d="M20 760 V300 C20 140 145 20 300 20 C455 20 580 140 580 300 V760" stroke="currentColor" strokeWidth={a.gate ? 2.5 : 1.4} />
          <path d="M48 760 V306 C48 160 160 50 300 50 C440 50 552 160 552 306 V760" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 9" />
        </svg>
      ))}

      {pieces.map((s) => (
        <button
          key={s.id}
          type="button"
          data-piece
          onClick={() => onOpen(s.slug)}
          aria-label={`View ${s.name}`}
          className="group absolute -left-[170px] -top-[330px] block w-[340px] text-left outline-none"
          style={{ transformStyle: "preserve-3d", opacity: 0, visibility: "hidden", willChange: "transform, opacity" }}
        >
          <span
            data-light
            aria-hidden
            className="pointer-events-none absolute -top-[260px] left-1/2 h-[700px] w-[520px] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,236,190,0.32),rgba(255,236,190,0.05)_75%,transparent)] [clip-path:polygon(44%_0,56%_0,100%_100%,0_100%)]"
            style={{ opacity: 0 }}
          />
          <span className="relative block aspect-[3/4] overflow-hidden rounded-t-[170px] shadow-[0_50px_70px_-40px_rgba(0,0,0,0.95)] ring-1 ring-gold/50 group-hover:ring-gold group-focus-visible:ring-2 group-focus-visible:ring-gold">
            {s.cutout ? (
              <>
                <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,#efe4fb_0%,#bba6d2_55%,#4a3858_100%)]" />
                <Image src={s.cutout.src} alt={s.image.alt} fill sizes="340px" loading="eager" className="object-contain object-bottom px-[9%] pt-[14%]" />
              </>
            ) : (
              <Image src={s.image.src} alt={s.image.alt} fill sizes="340px" loading="eager" className="object-cover" />
            )}
            <span data-shade aria-hidden className="absolute inset-0 bg-plum-deep" style={{ opacity: 0.6 }} />
            <span aria-hidden className="absolute inset-3 rounded-t-[160px] border border-gold/40" />
          </span>
          <span aria-hidden className="relative mx-auto block h-16 w-[112%] -translate-x-[5.5%] bg-[linear-gradient(180deg,#3d2d4b,#1b1322)]">
            <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent" />
            <span className="absolute inset-x-6 top-4 text-center text-[9px] font-semibold uppercase tracking-[0.35em] text-gold-soft/80">{categoryName(s.category)}</span>
          </span>
        </button>
      ))}
    </>
  );
});

/** Overlays. Owns the "current piece" state so the 3D scene never re-renders. */
function Hud({
  pieces,
  register,
  categoryName,
  onOpen,
  onJump,
  label,
}: {
  pieces: Sculpture[];
  register: (fn: ((i: number) => void) | null) => void;
  categoryName: (id: string) => string;
  onOpen: (slug: string) => void;
  onJump: (i: number) => void;
  label: string;
}) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    register(setCurrent);
    return () => register(null);
  }, [register]);
  const piece = pieces[current];
  const n = pieces.length;
  return (
    <>
      <div data-hud className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-plum-deep/90 to-transparent pb-16 pt-[calc(var(--nav-h)+20px)]" style={{ opacity: 0 }}>
        <div className="mx-auto flex max-w-[1400px] items-start justify-between px-5 sm:px-8">
          <p className="eyebrow text-gold-soft">{label}</p>
          <p className="font-display text-sm italic text-ivory/60">
            <span className="text-2xl text-gold">{String(current + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")}
          </p>
        </div>
      </div>
      <div data-hud className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum-deep via-plum-deep/85 to-transparent pt-24" style={{ opacity: 0 }}>
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-6 px-5 pb-6 sm:px-8">
          <div className="min-w-0" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div key={piece?.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <p className="eyebrow text-[10px] text-gold-soft">{piece ? categoryName(piece.category) : ""}</p>
                <p className="mt-1 truncate font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight">{piece?.name}</p>
                {piece?.summary && <p className="mt-1 hidden max-w-xl truncate text-sm text-ivory/60 sm:block">{piece.summary}</p>}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="pointer-events-auto flex items-center gap-4">
            <ol className="hidden items-center gap-2 md:flex" aria-label="Pieces in the hall">
              {pieces.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onJump(i)}
                    aria-label={`Go to ${s.name}`}
                    aria-current={i === current ? "true" : undefined}
                    className={`relative block h-12 w-10 overflow-hidden rounded-t-full ring-1 transition-[opacity,transform] duration-500 ${i === current ? "scale-110 ring-gold" : "opacity-50 ring-ivory/20 hover:opacity-90"}`}
                  >
                    <Image src={(s.cutout ?? s.image).src} alt="" fill sizes="48px" className={s.cutout ? "bg-lilac/40 object-contain object-bottom" : "object-cover"} />
                  </button>
                </li>
              ))}
            </ol>
            {piece && (
              <button
                type="button"
                onClick={() => onOpen(piece.slug)}
                className="inline-flex shrink-0 items-center gap-2 border border-gold/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors hover:bg-gold hover:text-plum-deep"
              >
                View piece <Maximize2 size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="mx-auto h-[2px] max-w-[1400px] bg-ivory/10">
          <div className="h-full origin-left bg-gold transition-transform duration-500" style={{ transform: `scaleX(${(current + 1) / n})` }} />
        </div>
      </div>
    </>
  );
}

export default function GalleryHall3D() {
  const root = useRef<HTMLElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const hudSet = useRef<((i: number) => void) | null>(null);
  const reduceMotion = useReducedMotion();
  const { openSculpture } = useSculptureViewer();
  const site = useSite();
  const { categoryName } = site;
  const sec = site.section("home", "hall");

  const pieces = useMemo(() => {
    const featured = site.getFeaturedSculptures();
    return (featured.length >= 4 ? featured : site.getSculptures()).slice(0, HALL_SIZE);
  }, [site]);
  const n = pieces.length;
  const END = n - 1 + 0.35;
  const sequence = useMemo(() => pieces.map((p) => p.slug), [pieces]);
  const onOpen = useMemo(() => (slug: string) => openSculpture(slug, sequence), [openSculpture, sequence]);
  const register = useMemo(
    () => (fn: ((i: number) => void) | null) => {
      hudSet.current = fn;
    },
    [],
  );

  // Geometry layout (z = translateZ of each element; negative = further away).
  const arches = useMemo(
    () => [
      { key: "gate", z: -(START - SPACING / 2), gate: true },
      ...pieces
        .map((_, i) => i)
        .filter((i) => i % 2 === 1)
        .map((i) => ({ key: `a${i}`, z: -(START + i * SPACING + SPACING / 2), gate: false })),
    ],
    [pieces],
  );

  useGSAP(
    () => {
      if (reduceMotion || !world.current || !n) return;
      const q = gsap.utils.selector(root);
      const archEls = q("[data-arch]");
      const wide = window.matchMedia("(min-width: 768px)").matches;
      const X = wide ? 360 : 150;
      const xs = pieces.map((_, i) => (i % 2 === 0 ? -X : X));

      const setWorld = gsap.quickSetter(world.current, "css");
      const pieceSet = q("[data-piece]").map((el) => gsap.quickSetter(el, "css"));
      const shadeSet = q("[data-shade]").map((el) => gsap.quickSetter(el, "opacity"));
      const lightSet = q("[data-light]").map((el) => gsap.quickSetter(el, "opacity"));
      const treadmill = q("[data-treadmill]")[0];
      let lastTread = NaN;
      const archSet = archEls.map((el) => gsap.quickSetter(el, "css"));
      const archZ = archEls.map((el) => Number(el.dataset.arch));
      const archBase = archEls.map((el) => (el.hasAttribute("data-gate") ? 0.9 : 0.4));
      const introSet = gsap.quickSetter(q("[data-intro]")[0], "css");
      const hudOpacity = q("[data-hud]").map((el) => gsap.quickSetter(el, "opacity"));

      let last = -1;
      let lastF = NaN;
      const render = (fRaw: number) => {
        if (Math.abs(fRaw - lastF) < 0.0004) return; // nothing visible changed
        lastF = fRaw;
        const f = fRaw < 0 ? fRaw : holdEase(fRaw);
        const i0 = clamp(Math.floor(f), 0, n - 1);
        const i1 = clamp(i0 + 1, 0, n - 1);
        const t = clamp(f - Math.floor(f));
        const camZ = START + f * SPACING - VIEW;
        const camX = f < 0 ? xs[0] * clamp(1 + f) * 0.85 : (xs[i0] + (xs[i1] - xs[i0]) * t) * 0.85;
        const yaw = f < 0 ? 0 : ((xs[i1] - xs[i0]) / X) * Math.sin(Math.PI * t) * 9;
        const bob = Math.sin(f * Math.PI * 2) * 5;
        setWorld({ transform: `rotateY(${(-yaw).toFixed(3)}deg) translate3d(${(-camX).toFixed(1)}px, ${bob.toFixed(1)}px, ${camZ.toFixed(1)}px)` });

        // Treadmill: keep the corridor's near edge just behind the camera, snapped to the
        // pattern period so the floor lines and pillars stay fixed in world space.
        const tread = Math.ceil((BEHIND - camZ) / PERIOD) * PERIOD;
        if (tread !== lastTread) {
          lastTread = tread;
          treadmill.style.transform = `translateZ(${tread}px)`;
        }
        // Arches: fade as the camera approaches, hidden once passed.
        for (let k = 0; k < archZ.length; k++) {
          const rel = archZ[k] + camZ;
          const o = rel > 350 ? 0 : rel > -350 ? archBase[k] * clamp((350 - rel) / 700) : rel < -DRAW ? 0 : archBase[k] * clamp((DRAW + rel) / 1500);
          archSet[k]({ opacity: o, visibility: o > 0.01 ? "visible" : "hidden" });
        }
        // Pieces: turn to face the camera and light up on arrival.
        for (let i = 0; i < n; i++) {
          const d = f - i;
          const focus = clamp(1 - Math.abs(d) * 1.4);
          const side = i % 2 === 0 ? SIDE_ANGLE : -SIDE_ANGLE;
          const fade = d > 0.5 ? clamp(1 - (d - 0.5) / 0.25) : clamp((d + 3.4) / 0.6);
          pieceSet[i]({
            opacity: fade,
            visibility: fade > 0.01 ? "visible" : "hidden",
            transform: `translate3d(${xs[i]}px, 0, ${-(START + i * SPACING)}px) rotateY(${(side * (1 - focus)).toFixed(2)}deg) scale(${(0.92 + 0.08 * focus).toFixed(4)})`,
          });
          shadeSet[i](0.6 * (1 - focus));
          lightSet[i](focus);
        }

        // Entrance: the title grows and fades as the camera passes through (no blur — it's costly).
        const gateP = clamp((f - ENTRY) / -ENTRY);
        const io = 1 - clamp(gateP * 1.6);
        introSet({ opacity: io, visibility: io > 0.01 ? "visible" : "hidden", transform: `scale(${(1 + gateP * 1.4).toFixed(4)})` });
        const ho = clamp((gateP - 0.6) / 0.35);
        hudOpacity.forEach((s) => s(ho));

        const nearest = clamp(Math.round(f), 0, n - 1);
        if (nearest !== last) {
          last = nearest;
          hudSet.current?.(nearest);
        }
      };

      const cam = { f: ENTRY };
      render(ENTRY);
      const tween = gsap.to(cam, {
        f: END,
        ease: "none",
        onUpdate: () => render(cam.f),
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 1.2 },
      });
      triggerRef.current = tween.scrollTrigger ?? null;

      // Gentle pointer parallax (desktop), eased with quickTo.
      const stage = q("[data-stage]")[0];
      const rx = gsap.quickTo(stage, "rotationX", { duration: 1.2, ease: "power3.out" });
      const ry = gsap.quickTo(stage, "rotationY", { duration: 1.2, ease: "power3.out" });
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        ry((e.clientX / window.innerWidth - 0.5) * 4);
        rx(-(e.clientY / window.innerHeight - 0.5) * 3);
      };
      if (wide) window.addEventListener("pointermove", onMove, { passive: true });
      return () => {
        window.removeEventListener("pointermove", onMove);
        triggerRef.current = null;
      };
    },
    { scope: root, dependencies: [reduceMotion, n] },
  );

  const goTo = useMemo(
    () => (i: number) => {
      const st = triggerRef.current;
      if (!st) return;
      const p = (i - ENTRY) / (END - ENTRY);
      window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: "smooth" });
    },
    [END],
  );

  if (!n) return null;

  if (reduceMotion) {
    return (
      <section aria-labelledby="hall-title" className="bg-plum-deep py-24 text-ivory">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <h2 id="hall-title" className="font-display text-5xl">
            {sec?.heading ?? "The Hall of"} {sec?.headingAccent ?? "Devotion"}
          </h2>
          <ul className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {pieces.map((s) => (
              <li key={s.id}>
                <SculptureCard sculpture={s} sequence={sequence} tone="dark" showSummary={false} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section ref={root} aria-labelledby="hall-title" className="relative bg-plum-deep text-ivory" style={{ height: `${(n + 1.6) * 95}vh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Atmosphere: static gradients only (no blur or blend modes) */}
        <div aria-hidden data-bg="home_hall" className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,#5a4370_0%,#30233b_42%,#150f1b_85%)]" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[75%] w-[46vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_0%,rgba(233,221,248,0.22),rgba(233,221,248,0.05)_55%,transparent_75%)]" />

        {/* 3D stage */}
        <div className="absolute inset-0" style={{ perspective: "1000px", perspectiveOrigin: "50% 44%" }}>
          <div data-stage className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            <div ref={world} className="absolute left-1/2 top-[46%] h-0 w-0 will-change-transform" style={{ transformStyle: "preserve-3d" }}>
              <Scene pieces={pieces} arches={arches} categoryName={categoryName} onOpen={onOpen} />
            </div>
          </div>
        </div>

        {/* Floating dust: transform-only CSS animation */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {DUST.map((d, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-gold-soft/70 [animation:dust_linear_infinite]"
              style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}
            />
          ))}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_45%,rgba(10,6,14,0.75)_100%)]" />

        {/* Entrance title — the camera flies through it */}
        <div data-intro className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center will-change-transform">
          <p className="eyebrow text-gold-soft">{sec?.eyebrow ?? "Walk the gallery"}</p>
          <h2 id="hall-title" className="mt-4 font-display text-[clamp(3rem,9vw,8.5rem)] font-medium leading-[0.95] [text-shadow:0_6px_40px_rgba(20,12,28,0.9)]">
            {titleOf(sec, { heading: "The Hall of", accent: "Devotion" }, "text-gold-sheen italic")}
          </h2>
          <p className="mt-6 text-sm uppercase tracking-[0.3em] text-lilac/80">Scroll to enter</p>
        </div>

        <Hud pieces={pieces} register={register} categoryName={categoryName} onOpen={onOpen} onJump={goTo} label={`${sec?.heading ?? "The Hall of"} ${sec?.headingAccent ?? "Devotion"}`} />
      </div>
    </section>
  );
}
