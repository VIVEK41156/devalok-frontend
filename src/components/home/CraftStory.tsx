"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import SplitWords from "@/components/motion/SplitWords";
import { useSite } from "@/components/providers/SiteProvider";
import { titleOf } from "@/components/ui/SectionTitle";

const CHAPTERS = [
  {
    numeral: "I",
    label: "Material",
    title: "The material is chosen",
    text: "Every sculpture begins with the right block of stone, the right length of seasoned wood, or the right alloy for casting. Its grain and character decide what the figure can become.",
    image: "/images/sculptures/radha-krishna-stone.jpg",
    alt: "A seated Radha Krishna stone sculpture in the carving workshop",
    position: "50% 35%",
  },
  {
    numeral: "II",
    label: "Form",
    title: "The form is revealed",
    text: "Proportion comes first: posture, gesture and the gentle tilt of a face. Then, layer by layer, the figure is drawn out of the material by hand.",
    image: "/images/sculptures/panchamukha-ganapati.jpg",
    alt: "Five-faced Ganapati emerging within a carved arch",
    position: "50% 45%",
  },
  {
    numeral: "III",
    label: "Ornament",
    title: "The ornament is carved",
    text: "Crowns, necklaces, girdles and the scrolling foliage of the prabhavali are worked line by line. It is the slowest part of the work, and the most devotional.",
    image: "/images/sculptures/radha-krishna-wood.jpg",
    alt: "Openwork carving of foliage and birds above Radha and Krishna in wood",
    position: "50% 15%",
  },
  {
    numeral: "IV",
    label: "Presence",
    title: "The presence arrives",
    text: "Finishing brings out the stone's depth, the wood's warmth and the metal's glow, until the sculpture is ready to take its place in a temple or a home.",
    image: "/images/sculptures/venkateswara.jpg",
    alt: "Garlanded sculpture of Sri Venkateswara with a dark polished finish",
    position: "50% 22%",
  },
];

/**
 * Pinned scroll presentation: the section locks to the viewport and each
 * chapter plays in turn (image wipe + text slide + progress), scrubbed by scroll.
 */
export default function CraftStory() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const sec = useSite().section("home", "craft");

  useGSAP(
    () => {
      if (reduceMotion) return;
      const q = gsap.utils.selector(root);
      const images = q("[data-craft-img]");
      const inners = q("[data-craft-inner]");
      const texts = q("[data-craft-text]");
      const bars = q("[data-craft-bar]");
      const n = CHAPTERS.length;

      gsap.fromTo(
        q("#craft-title [data-word]"),
        { yPercent: 115 },
        { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: root.current, start: "top 75%", once: true } },
      );

      // Initial state: first chapter showing, the rest waiting.
      gsap.set(images.slice(1), { clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(texts.slice(1), { autoAlpha: 0, y: 70 });
      gsap.set(bars, { scaleX: 0 });
      gsap.set(bars[0], { scaleX: 1 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${window.innerHeight * (n - 0.4)}`,
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: { snapTo: 1 / (n - 1), inertia: false, duration: { min: 0.3, max: 0.8 }, delay: 0.1, ease: "power2.inOut" },
          onUpdate: (self) => setActive(Math.min(n - 1, Math.round(self.progress * (n - 1)))),
        },
      });

      // Slow push-in on every image across the whole sequence (camera feel).
      tl.fromTo(inners, { scale: 1.18 }, { scale: 1, ease: "none", duration: n - 1 }, 0);

      for (let i = 1; i < n; i++) {
        const at = i - 1;
        tl.to(texts[i - 1], { autoAlpha: 0, y: -70, duration: 0.45 }, at + 0.1)
          .to(images[i], { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8 }, at + 0.1)
          .fromTo(inners[i], { yPercent: 12 }, { yPercent: 0, duration: 0.8 }, at + 0.1)
          .to(texts[i], { autoAlpha: 1, y: 0, duration: 0.5 }, at + 0.45)
          .to(bars[i], { scaleX: 1, duration: 0.6 }, at + 0.2);
      }

      // Images inside fixed-ratio boxes load lazily; keep positions accurate.
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);
      return () => window.removeEventListener("load", refresh);
    },
    { scope: root, dependencies: [reduceMotion] },
  );

  if (reduceMotion) {
    return (
      <section aria-labelledby="craft-title" className="bg-plum py-24 text-ivory">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <p className="eyebrow text-gold-soft">{sec?.eyebrow ?? "The art & the craft"}</p>
          <h2 id="craft-title" className="mt-4 font-display text-5xl">
            {sec?.heading ?? "From raw material"} {sec?.headingAccent ?? "to sacred presence."}
          </h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-2">
            {CHAPTERS.map((c) => (
              <li key={c.title}>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={c.image} alt={c.alt} fill sizes="(min-width: 768px) 45vw, 92vw" className="object-cover" style={{ objectPosition: c.position }} />
                </div>
                <h3 className="mt-5 font-display text-3xl">
                  {c.numeral}. {c.title}
                </h3>
                <p className="mt-3 text-ivory/70">{c.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section ref={root} aria-labelledby="craft-title" className="grain relative h-[100svh] min-h-[620px] overflow-hidden bg-plum text-ivory">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[10%] top-[10%] h-[70vh] w-[70vh] rounded-full bg-[radial-gradient(circle,rgba(200,164,93,0.18),transparent_65%)]" />
        <div className="absolute -right-[5%] bottom-0 h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle,rgba(217,197,240,0.14),transparent_65%)]" />
        <span className="absolute bottom-[-6vh] right-[2%] select-none font-display text-[38vh] italic leading-none text-ivory/[0.035]">
          {CHAPTERS[active].numeral}
        </span>
      </div>

      <div className="relative mx-auto grid h-full max-w-[1400px] grid-rows-[auto_1fr_auto] gap-6 px-5 pb-8 pt-[calc(var(--nav-h)+20px)] sm:px-8 lg:gap-8 lg:pb-10">
        <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-2">
          <div>
            <p className="eyebrow text-gold-soft">{sec?.eyebrow ?? "The art & the craft"}</p>
            <h2 id="craft-title" className="mt-3 font-display text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.02]">
              <SplitWords>
                {titleOf(sec, { heading: "From raw material", accent: "to sacred presence." }, "text-gold-sheen")}
              </SplitWords>
            </h2>
          </div>
          <p className="hidden font-display text-lg italic text-ivory/50 md:block">Scroll to move through the four chapters</p>
        </header>

        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-6 lg:grid-cols-[1.15fr_1fr] lg:grid-rows-1 lg:items-center lg:gap-16">
          {/* Image stage */}
          <div className="relative h-full min-h-0 overflow-hidden bg-plum-deep shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]">
            {CHAPTERS.map((c, i) => (
              <div key={c.image} data-craft-img className="absolute inset-0 overflow-hidden" style={i > 0 ? { clipPath: "inset(100% 0% 0% 0%)" } : undefined}>
                <div data-craft-inner className="absolute inset-0 will-change-transform">
                  <Image
                    src={c.image}
                    alt={c.alt}
                    fill
                    sizes="(min-width: 1024px) 55vw, 92vw"
                    className="object-cover"
                    style={{ objectPosition: c.position }}
                    priority={i === 0}
                  />
                </div>
              </div>
            ))}
            <span aria-hidden className="pointer-events-none absolute inset-4 border border-gold/45" />
            <span className="absolute left-6 top-6 bg-plum-deep/75 px-3 py-1.5 font-display text-sm italic text-gold-soft backdrop-blur">
              Chapter {CHAPTERS[active].numeral}
            </span>
          </div>

          {/* Text stage: chapters stacked in one place, swapped by the timeline */}
          <div className="relative min-h-[190px] sm:min-h-[220px] lg:min-h-[320px]">
            {CHAPTERS.map((c, i) => (
              <article
                key={c.title}
                data-craft-text
                aria-hidden={i !== active}
                className="absolute inset-x-0 top-0 lg:top-1/2 lg:-translate-y-1/2"
                style={i > 0 ? { opacity: 0, visibility: "hidden" } : undefined}
              >
                <div className="flex items-center gap-4">
                  <span className="font-display text-4xl italic text-gold lg:text-6xl">{c.numeral}</span>
                  <span className="h-px w-16 bg-gold lg:w-24" />
                  <span className="eyebrow text-[10px] text-ivory/50">{c.label}</span>
                </div>
                <h3 className="mt-3 font-display text-3xl leading-tight sm:text-4xl lg:mt-5 lg:text-5xl">{c.title}</h3>
                <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ivory/70 sm:text-base lg:mt-5 lg:text-lg">{c.text}</p>
              </article>
            ))}
          </div>
        </div>

        {/* Progress */}
        <ol className="grid grid-cols-4 gap-3 sm:gap-6" aria-label="Chapters">
          {CHAPTERS.map((c, i) => (
            <li key={c.label} aria-current={i === active ? "step" : undefined}>
              <span className="block h-px bg-ivory/15">
                <span data-craft-bar className="block h-px origin-left bg-gold" style={{ transform: i === 0 ? "scaleX(1)" : "scaleX(0)" }} />
              </span>
              <span className={`mt-2.5 flex items-baseline gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] transition-colors duration-500 sm:text-[11px] ${i === active ? "text-gold-soft" : "text-ivory/40"}`}>
                <span className="font-display text-sm normal-case italic">{c.numeral}</span>
                <span className="hidden sm:inline">{c.label}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
