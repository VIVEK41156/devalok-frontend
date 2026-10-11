"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { gsap, useGSAP, MOTION_OK, DESKTOP_MOTION } from "@/lib/gsap";
import { useSite } from "@/components/providers/SiteProvider";

const SLIDE_SECONDS = 5.2;
// Background tint per slide, cycled in collection order.
const TINTS = ["rgba(160,170,215,0.45)", "rgba(196,92,62,0.42)", "rgba(214,170,80,0.5)", "rgba(250,247,240,0.4)", "rgba(217,197,240,0.45)"];

interface Slide {
  src: string;
  cutout?: boolean;
  position?: string;
  tint: string;
  reference?: boolean;
}

/** Splits the CMS heading into display lines: "Art that" / "transcends" / accent. */
function headlineLines(heading: string, accent?: string | null): string[][] {
  const words = heading.split(/\s+/).filter(Boolean);
  const lines = words.length > 2 ? [words.slice(0, 2), words.slice(2)] : [words];
  return accent ? [...lines, accent.split(/\s+/)] : lines;
}

/**
 * Home hero: headline intro, then a self-playing presentation of the four
 * collections (arch-window image wipe, letter-by-letter name, tint shift).
 */
export default function CinematicHero() {
  const root = useRef<HTMLElement>(null);
  const progressTween = useRef<gsap.core.Tween | null>(null);
  const slideTl = useRef<gsap.core.Timeline | null>(null);
  const busy = useRef(false);
  const currentRef = useRef(0);
  const pausedRef = useRef(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const site = useSite();
  const categories = site.getCategories();
  const n = categories.length;
  const hero = site.section("home", "hero");
  const HEADLINE = headlineLines(hero?.heading ?? "Art that transcends", hero ? hero.headingAccent : "time.");
  const accentLine = (hero ? hero.headingAccent : "time.") ? HEADLINE.length - 1 : -1;
  // Each collection is shown with a transparent cut-out when one of its pieces has
  // one (the figure then stands free in the arch), otherwise with its cover photo.
  const SLIDES: Record<string, Slide> = Object.fromEntries(
    categories.map((c, i) => {
      const pieces = site.getSculptures(c.id);
      const withCutout = pieces.find((p) => p.cutout);
      const slide: Slide = withCutout?.cutout
        ? { src: withCutout.cutout.src, cutout: true, tint: TINTS[i % TINTS.length] }
        : { src: c.coverImage, position: "50% 30%", tint: TINTS[i % TINTS.length], reference: pieces.length > 0 && pieces.every((p) => p.reference) };
      return [c.id, slide];
    }),
  );


  // Progress bar of the active collection doubles as the autoplay timer.
  function startProgress() {
    if (!root.current) return;
    const bars = gsap.utils.selector(root)("[data-hero-bar]");
    progressTween.current?.kill();
    gsap.set(bars, { scaleX: 0 });
    progressTween.current = gsap.fromTo(
      bars[currentRef.current],
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: SLIDE_SECONDS,
        ease: "none",
        paused: pausedRef.current || !!reduceMotion,
        onComplete: () => go((currentRef.current + 1) % n),
      },
    );
  }

  function go(next: number) {
    const from = currentRef.current;
    if (next === from || busy.current) return;
    const q = gsap.utils.selector(root);
    const imgs = q("[data-slide-img]");
    const inners = q("[data-slide-inner]");
    const names = q("[data-slide-name]");
    const metas = q("[data-slide-meta]");
    const dir = next > from || (from === n - 1 && next === 0) ? 1 : -1;
    busy.current = true;
    currentRef.current = next;
    setActive(next);

    slideTl.current?.kill();
    const tl = gsap.timeline({
      defaults: { ease: "expo.inOut" },
      onComplete: () => {
        busy.current = false;
        startProgress();
      },
    });
    if (reduceMotion) tl.timeScale(50);

    // Out: name lifts away letter by letter, meta fades, image keeps pushing in.
    tl.to(names[from].querySelectorAll("[data-l]"), { yPercent: -120 * dir, duration: 0.6, stagger: 0.02, ease: "power3.in" }, 0)
      .to(metas[from], { autoAlpha: 0, y: -12, duration: 0.4, ease: "power2.in" }, 0)
      .to(inners[from], { scale: 1.12, duration: 1.1 }, 0)
      // In: next image wipes over the old one and settles from a push-in.
      .set(imgs[next], { zIndex: 2 }, 0)
      .set(imgs[from], { zIndex: 1 }, 0)
      .fromTo(imgs[next], { clipPath: dir > 0 ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.15 }, 0.15)
      .fromTo(inners[next], { scale: 1.3, yPercent: 6 * dir }, { scale: 1, yPercent: 0, duration: 1.6, ease: "expo.out" }, 0.15)
      .set(imgs[from], { clipPath: "inset(100% 0% 0% 0%)", zIndex: 0 }, 1.3)
      .set(inners[from], { scale: 1 }, 1.3)
      .set(names[next], { visibility: "visible" }, 0.5)
      .set(names[from], { visibility: "hidden" }, 0.75)
      .fromTo(
        names[next].querySelectorAll("[data-l]"),
        { yPercent: 120 * dir, rotateX: -80 * dir },
        { yPercent: 0, rotateX: 0, duration: 1, stagger: 0.04, ease: "expo.out" },
        0.55,
      )
      .fromTo(metas[next], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.85)
      .to(q("[data-hero='tint']"), { backgroundColor: SLIDES[categories[next].id]?.tint, duration: 1.4, ease: "power2.inOut" }, 0)
      .fromTo(q("[data-hero='ghost-num']"), { autoAlpha: 0, yPercent: 20 * dir }, { autoAlpha: 1, yPercent: 0, duration: 1, ease: "expo.out" }, 0.5);
    slideTl.current = tl;
  }

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.55, onComplete: () => startProgress() });
        tl.from("[data-hero='aura']", { scale: 0.6, autoAlpha: 0, duration: 2.2 }, 0)
          .fromTo(
            "[data-hero='frame']",
            { clipPath: "inset(100% 0% 0% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.8, clearProps: "clipPath" },
            0.15,
          )
          .from(q("[data-slide-inner]")[0], { scale: 1.35, duration: 2.4 }, 0.15)
          .from("[data-hero='arch']", { autoAlpha: 0, scale: 0.9, duration: 1.8, stagger: 0.12 }, 0.3)
          .from("[data-hero='word']", { yPercent: 115, rotate: 4, duration: 1.3, stagger: 0.07 }, 0.4)
          .from("[data-hero='eyebrow']", { autoAlpha: 0, y: 14, duration: 1 }, 0.45)
          .from("[data-hero='line']", { scaleX: 0, duration: 1.4, ease: "power3.inOut" }, 0.6)
          .from(q("[data-slide-name]")[0].querySelectorAll("[data-l]"), { yPercent: 120, rotateX: -80, duration: 1.1, stagger: 0.045 }, 0.9)
          .from(q("[data-slide-meta]")[0], { autoAlpha: 0, y: 16, duration: 0.9 }, 1.15)
          .from("[data-hero='ghost-num']", { autoAlpha: 0, xPercent: -10, duration: 1.6 }, 0.9)
          .from("[data-hero='fade']", { autoAlpha: 0, y: 22, duration: 1.1, stagger: 0.1 }, 1)
          .from("[data-hero='nav'] > li", { autoAlpha: 0, y: 18, duration: 0.9, stagger: 0.08 }, 1.2)
          .from("[data-hero='cue']", { autoAlpha: 0, duration: 1 }, 1.6);
      });

      // Scroll: the camera drifts toward the arch as the copy recedes.
      mm.add(DESKTOP_MOTION, () => {
        const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 };
        gsap.to("[data-hero='stage']", { yPercent: 12, scale: 1.06, ease: "none", scrollTrigger: st });
        gsap.to("[data-hero='copy']", { yPercent: -16, autoAlpha: 0.15, ease: "none", scrollTrigger: st });

        // Pointer parallax: each layer sits at a different depth.
        const layers: [string, number, number][] = [
          ["[data-hero='frame']", 16, 10],
          ["[data-hero='arches']", -12, -8],
          ["[data-hero='aura']", 28, 18],
          ["[data-hero='ghost-num']", -26, -6],
        ];
        const onMove = (e: PointerEvent) => {
          const x = e.clientX / window.innerWidth - 0.5;
          const y = e.clientY / window.innerHeight - 0.5;
          layers.forEach(([sel, dx, dy]) => gsap.to(sel, { x: x * dx * 2, y: y * dy * 2, duration: 1.4, ease: "power3.out", overwrite: "auto" }));
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
      });

      return () => {
        progressTween.current?.kill();
        slideTl.current?.kill();
        mm.revert();
      };
    },
    { scope: root },
  );

  const togglePause = () => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (next) progressTween.current?.pause();
    else if (progressTween.current && progressTween.current.progress() < 1) progressTween.current.resume();
    else startProgress();
  };

  const isPaused = paused || !!reduceMotion;

  return (
    <section
      ref={root}
      className="grain relative isolate overflow-hidden bg-plum-deep text-ivory lg:h-[100svh] lg:min-h-[720px]"
      aria-labelledby="hero-title"
      aria-roledescription="carousel"
    >
      {/* Atmosphere */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div data-bg="home_hero" className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_45%,#4a3858_0%,#30233b_40%,#1f1627_80%)]" />
        <div
          data-hero="aura"
          className="absolute left-1/2 top-[64%] h-[min(80vh,760px)] w-[min(80vh,760px)] -translate-x-1/2 -translate-y-1/2 lg:left-[70%] lg:top-[52%]"
        >
          <div data-hero="tint" className="absolute inset-[10%] rounded-full opacity-60 blur-3xl" style={{ backgroundColor: TINTS[0] }} />
        </div>
        <div className="absolute bottom-0 left-1/2 h-[40%] w-[90%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(200,164,93,0.25),transparent_65%)] lg:left-[70%] lg:w-[55%]" />
      </div>

      <div className="relative mx-auto grid max-w-[1400px] gap-12 px-5 pb-16 pt-[calc(var(--nav-h)+var(--topbar-h)+28px)] sm:px-8 lg:h-full lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-6 lg:pb-12 lg:pt-[calc(var(--nav-h)+var(--topbar-h))]">
        {/* Copy */}
        <div data-hero="copy" className="relative z-10 flex flex-col">
          <p data-hero="eyebrow" className="eyebrow flex items-center gap-3 text-gold-soft">
            <span data-hero="line" className="block h-px w-10 origin-left bg-gold" />
            {hero?.eyebrow ?? "Devalok Sculptures"}
          </p>
          <h1 id="hero-title" className="mt-6 font-display text-[clamp(2.8rem,6vw,6.2rem)] font-medium uppercase leading-[0.9] tracking-[-0.01em]">
            {HEADLINE.map((line, i) => (
              <span key={i} className="block overflow-hidden pb-[0.06em]">
                {line.map((w) => (
                  <span key={w} data-hero="word" className={`mr-[0.22em] inline-block ${i === accentLine ? "text-gold-sheen italic normal-case" : ""}`}>
                    {w}
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <p data-hero="fade" className="mt-6 max-w-md text-base leading-relaxed text-ivory/75 sm:text-lg">
            {hero?.description ?? "Where timeless craftsmanship meets the soul of Indian art."}
          </p>
          <div data-hero="fade" className="mt-8 flex flex-wrap gap-3">
            <Link href={hero?.ctaUrl || "/gallery"} className="group inline-flex items-center gap-3 bg-gold px-7 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-plum-deep transition-colors hover:bg-gold-soft">
              {hero?.ctaLabel || "Explore Sculptures"}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/about" className="inline-flex items-center gap-3 border border-ivory/35 px-7 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-ivory transition-colors hover:border-gold hover:text-gold-soft">
              Our Story
            </Link>
          </div>

          {/* Collection navigator: the active bar fills as the slide plays */}
          <div className="mt-10 flex items-end gap-4 lg:mt-14">
            <ol data-hero="nav" className="grid flex-1 grid-cols-4 gap-3 sm:gap-5" aria-label="Collections">
              {categories.map((c, i) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === active ? "true" : undefined}
                    aria-label={`Show ${c.name}`}
                    className="group block w-full py-1 text-left"
                  >
                    <span className="block h-[2px] bg-ivory/15">
                      <span data-hero-bar className="block h-full origin-left bg-gold" style={{ transform: "scaleX(0)" }} />
                    </span>
                    <span className={`mt-3 flex items-baseline gap-1.5 transition-colors duration-500 ${i === active ? "text-ivory" : "text-ivory/45 group-hover:text-ivory/80"}`}>
                      <span className="font-display text-sm italic text-gold">0{i + 1}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-[11px]">{c.shortName}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={togglePause}
              className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ivory/20 text-ivory/70 transition hover:border-gold hover:text-gold"
              aria-label={isPaused ? "Play collection slideshow" : "Pause collection slideshow"}
            >
              {isPaused ? <Play size={13} /> : <Pause size={13} />}
            </button>
          </div>
        </div>

        {/* Stage */}
        <div data-hero="stage" className="relative mx-auto h-[min(122vw,560px)] w-full max-w-[440px] lg:mx-0 lg:ml-auto lg:mr-[6%] lg:h-[min(74vh,680px)] lg:max-w-[480px]">
          {/* Giant outlined index number behind the arch */}
          <span
            data-hero="ghost-num"
            aria-hidden
            className="pointer-events-none absolute -left-[18%] -top-[4%] select-none font-display text-[clamp(8rem,17vw,15rem)] italic leading-none text-transparent [-webkit-text-stroke:1px_rgba(200,164,93,0.5)] lg:-left-[34%]"
          >
            0{active + 1}
          </span>

          <div data-hero="arches" aria-hidden className="pointer-events-none absolute -inset-x-[6%] -top-[4%] bottom-0">
            <svg data-hero="arch" viewBox="0 0 600 800" preserveAspectRatio="none" className="absolute inset-0 h-full w-full text-gold/55" fill="none">
              <path d="M8 800 V300 C8 135 138 8 300 8 C462 8 592 135 592 300 V800" stroke="currentColor" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>

          {/* Arch window holding the slides */}
          <div data-hero="frame" className="absolute inset-0 overflow-hidden rounded-t-[999px] bg-plum shadow-[0_50px_90px_-40px_rgba(0,0,0,0.9)]">
            {categories.map((c, i) => {
              const s = SLIDES[c.id];
              if (!s) return null;
              return (
                <div
                  key={c.id}
                  data-slide-img
                  className="absolute inset-0 overflow-hidden"
                  style={i > 0 ? { clipPath: "inset(100% 0% 0% 0%)" } : { zIndex: 1 }}
                  aria-hidden={i !== active}
                >
                  <div data-slide-inner className="absolute inset-0 will-change-transform">
                    {s.cutout ? (
                      <>
                        <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,#e9ddf8_0%,#b9a3d0_45%,#4a3858_100%)]" />
                        <Image
                          src={s.src}
                          alt={`${c.name}: featured sculpture`}
                          fill
                          priority
                          sizes="(min-width: 1024px) 480px, 90vw"
                          className="object-contain object-bottom px-[9%] pt-[14%] drop-shadow-[0_30px_30px_rgba(0,0,0,0.55)]"
                        />
                      </>
                    ) : (
                      <Image src={s.src} alt={c.name} fill sizes="(min-width: 1024px) 480px, 90vw" className="object-cover" style={{ objectPosition: s.position }} />
                    )}
                    <span className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-plum-deep via-plum-deep/50 to-transparent" />
                  </div>
                </div>
              );
            })}
            <span aria-hidden className="pointer-events-none absolute inset-3 z-10 rounded-t-[999px] border border-gold/40" />
          </div>

          {/* Category name + meta over the base of the arch */}
          <div className="absolute inset-x-0 bottom-0 z-20 px-7 pb-6 sm:px-9 sm:pb-8">
            <div className="relative h-[clamp(3.4rem,6.4vw,5.4rem)] [perspective:600px]">
              {categories.map((c, i) => (
                <p
                  key={c.id}
                  data-slide-name
                  aria-hidden={i !== active}
                  className="absolute inset-x-0 bottom-0 overflow-hidden whitespace-nowrap pb-[0.08em] font-display text-[clamp(3rem,6vw,5rem)] leading-none"
                  style={i > 0 ? { visibility: "hidden" } : undefined}
                >
                  {c.shortName.split("").map((ch, k) => (
                    <span key={k} data-l className="inline-block origin-bottom">
                      {ch}
                    </span>
                  ))}
                  <span data-l className="inline-block origin-bottom text-gold">
                    .
                  </span>
                </p>
              ))}
            </div>
            <div className="relative mt-2 h-10">
              {categories.map((c, i) => (
                <div
                  key={c.id}
                  data-slide-meta
                  aria-hidden={i !== active}
                  className="absolute inset-0 flex items-center justify-between gap-4"
                  style={i > 0 ? { opacity: 0, visibility: "hidden" } : undefined}
                >
                  <p className="min-w-0 truncate text-sm italic text-gold-soft">
                    {c.tagline}
                    {SLIDES[c.id]?.reference && <span className="ml-2 text-[9px] not-italic uppercase tracking-[0.18em] text-ivory/50">· Reference image</span>}
                  </p>
                  <Link
                    href={`/products#${c.slug}`}
                    tabIndex={i === active ? 0 : -1}
                    className="inline-flex shrink-0 items-center gap-1.5 border-b border-gold/60 pb-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:text-gold-soft"
                  >
                    Explore <ArrowUpRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
          <p className="sr-only" aria-live="polite">
            Showing collection {active + 1} of {n}: {categories[active]?.name}
          </p>
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#introduction"
        data-hero="cue"
        className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-ivory/55 hover:text-gold lg:flex"
      >
        <span className="relative block h-10 w-px overflow-hidden bg-ivory/15">
          <span className="animate-scroll-cue absolute inset-x-0 top-0 h-1/2 bg-gold" />
        </span>
        Scroll
      </a>

      {/* Curtain: CSS-only so it can never trap the page if scripts fail */}
      <div aria-hidden className="curtain pointer-events-none absolute inset-0 z-30 flex">
        <span className="curtain-panel curtain-left" />
        <span className="curtain-panel curtain-right" />
      </div>
    </section>
  );
}
