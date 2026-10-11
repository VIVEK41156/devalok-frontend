"use client";

import Image from "next/image";
import { Maximize2 } from "lucide-react";
import type { Sculpture } from "@/data/types";
import { useSite } from "@/components/providers/SiteProvider";
import RevealScope from "@/components/motion/RevealScope";
import { useSculptureViewer } from "./ViewerProvider";
import SplitWords from "@/components/motion/SplitWords";

export default function FeaturedSpotlight({ sculpture }: { sculpture: Sculpture }) {
  const { openSculpture } = useSculptureViewer();
  const { categoryName } = useSite();
  return (
    <RevealScope as="section" data-bg="gallery_spotlight" aria-labelledby="spotlight-title" className="relative overflow-hidden bg-lavender py-20 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/25 lg:left-[28%]" />
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
          <div className="absolute inset-[8%] rounded-t-full bg-[radial-gradient(circle_at_50%_40%,#faf7f0,rgba(217,197,240,0.4)_60%,transparent_75%)]" />
          <div data-reveal="mask" className="absolute inset-0">
            <Image
              src={sculpture.cutout?.src ?? sculpture.image.src}
              alt={sculpture.image.alt}
              fill
              sizes="(min-width: 1024px) 34vw, 90vw"
              className="object-contain drop-shadow-[0_30px_35px_rgba(48,35,59,0.35)]"
            />
          </div>
        </div>
        <div>
          <p data-reveal="up" className="eyebrow text-gold-deep">
            Featured sculpture · {categoryName(sculpture.category)}
          </p>
          <h2 id="spotlight-title" data-reveal="words" data-reveal-delay="0.05" className="mt-4 font-display text-[clamp(2.6rem,5vw,4.6rem)] leading-none text-plum">
            <SplitWords>{sculpture.name}</SplitWords>
          </h2>
          <span data-reveal="fade" aria-hidden className="gold-rule mt-6">
            <span className="block h-1.5 w-1.5 rotate-45 bg-gold" />
          </span>
          <p data-reveal="up" data-reveal-delay="0.12" className="mt-6 max-w-lg text-lg leading-relaxed text-plum/75">
            {sculpture.description}
          </p>
          <button
            type="button"
            data-reveal="up"
            data-reveal-delay="0.2"
            onClick={() => openSculpture(sculpture.slug)}
            className="group mt-9 inline-flex items-center gap-3 bg-plum px-7 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-gold hover:text-plum-deep"
          >
            Open in viewer <Maximize2 size={15} className="transition-transform group-hover:scale-110" />
          </button>
        </div>
      </div>
    </RevealScope>
  );
}
