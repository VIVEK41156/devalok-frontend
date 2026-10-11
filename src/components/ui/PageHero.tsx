import Image from "next/image";
import type { ReactNode } from "react";
import RevealScope from "@/components/motion/RevealScope";
import SplitWords from "@/components/motion/SplitWords";

interface Props {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  /** `cutout`: a transparent PNG/WebP staged in a halo instead of a full-bleed photo. */
  image?: { src: string; alt: string; position?: string; cutout?: boolean };
  children?: ReactNode;
}

/** Dark editorial header for inner pages; keeps the transparent navbar legible. */
export default function PageHero({ eyebrow, title, intro, image, children }: Props) {
  return (
    <RevealScope as="header" className="grain relative isolate overflow-hidden bg-plum-deep text-ivory">
      <div aria-hidden data-bg="page_header" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_30%,#4a3858_0%,#30233b_45%,#1f1627_85%)]" />
      {image?.cutout && (
        <div aria-hidden className="absolute bottom-0 right-[-10%] top-[calc(var(--nav-h)+16px)] -z-10 w-[70%] opacity-40 md:right-[4%] md:w-[38%] md:opacity-100">
          <div className="absolute inset-x-0 bottom-0 top-[8%] rounded-t-full bg-[radial-gradient(circle_at_50%_45%,rgba(233,221,248,0.5),rgba(217,197,240,0.15)_45%,transparent_70%)]" />
          <svg viewBox="0 0 300 400" preserveAspectRatio="none" className="absolute inset-x-[6%] bottom-0 top-[4%] h-[96%] w-[88%] text-gold/40" fill="none">
            <path d="M5 400 V150 C5 70 70 5 150 5 C230 5 295 70 295 150 V400" stroke="currentColor" vectorEffect="non-scaling-stroke" />
          </svg>
          <div data-reveal="mask" className="absolute inset-x-[10%] bottom-0 top-[10%]">
            <Image src={image.src} alt="" fill priority sizes="(min-width: 768px) 30vw, 70vw" className="object-contain object-bottom drop-shadow-[0_30px_30px_rgba(0,0,0,0.5)]" />
          </div>
        </div>
      )}
      {image && !image.cutout && (
        <div aria-hidden className="absolute inset-y-0 right-0 -z-10 w-full opacity-35 [mask-image:linear-gradient(to_right,transparent,black_55%)] md:w-[60%] md:opacity-90">
          <div data-reveal="mask" className="absolute inset-0">
            <div data-parallax="0.14" className="absolute -inset-y-[10%] inset-x-0">
              <Image src={image.src} alt="" fill priority sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" style={{ objectPosition: image.position ?? "50% 30%" }} />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-plum-deep/80 to-transparent" />
        </div>
      )}
      <div className="mx-auto max-w-[1400px] px-5 pb-20 pt-[calc(var(--nav-h)+var(--topbar-h)+64px)] sm:px-8 sm:pb-24 lg:pt-[calc(var(--nav-h)+120px)]">
        <p data-reveal="up" className="eyebrow flex items-center gap-3 text-gold-soft">
          <span className="block h-px w-10 bg-gold" />
          {eyebrow}
        </p>
        <h1 data-reveal="words" data-reveal-delay="0.1" className="mt-6 max-w-4xl font-display text-[clamp(2.9rem,7vw,6.2rem)] font-medium leading-[0.95]">
          <SplitWords>{title}</SplitWords>
        </h1>
        {intro && (
          <p data-reveal="up" data-reveal-delay="0.16" className="mt-7 max-w-xl text-lg leading-relaxed text-ivory/70">
            {intro}
          </p>
        )}
        {children}
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
    </RevealScope>
  );
}
