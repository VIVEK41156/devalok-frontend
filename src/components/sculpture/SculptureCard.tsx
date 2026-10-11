"use client";

import { useRef, type PointerEvent } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Sculpture } from "@/data/types";
import { useSite } from "@/components/providers/SiteProvider";
import { useSculptureViewer } from "./ViewerProvider";

interface Props {
  sculpture: Sculpture;
  /** Slugs the viewer's previous/next piece buttons should walk through. */
  sequence?: string[];
  number?: number;
  /** Tailwind aspect class for the image frame (default variant). */
  aspect?: string;
  sizes?: string;
  showSummary?: boolean;
  tone?: "light" | "dark";
  /** "overlay" fills its grid cell and puts the caption on the image (bento layouts). */
  variant?: "default" | "overlay";
  /** CSS object-position for cropped photos, e.g. "50% 20%". */
  focus?: string;
  className?: string;
}

export default function SculptureCard({
  sculpture,
  sequence,
  number,
  aspect = "aspect-[4/5]",
  sizes = "(min-width: 1280px) 24vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw",
  showSummary = true,
  tone = "light",
  variant = "default",
  focus,
  className = "",
}: Props) {
  const { openSculpture } = useSculptureViewer();
  const { categoryName } = useSite();
  const frame = useRef<HTMLDivElement>(null);
  const dark = tone === "dark";
  const overlay = variant === "overlay";

  // Pointer-driven 3D tilt + moving light, written straight to CSS variables (no re-render).
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !frame.current) return;
    const r = frame.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    frame.current.style.setProperty("--ry", `${(x - 0.5) * 9}deg`);
    frame.current.style.setProperty("--rx", `${(0.5 - y) * 9}deg`);
    frame.current.style.setProperty("--mx", `${x * 100}%`);
    frame.current.style.setProperty("--my", `${y * 100}%`);
  };
  const onLeave = () => {
    frame.current?.style.setProperty("--ry", "0deg");
    frame.current?.style.setProperty("--rx", "0deg");
  };

  const media = (
    <>
      {sculpture.cutout ? (
        <>
          <span
            aria-hidden
            className={`absolute inset-0 ${
              dark || overlay
                ? "bg-[radial-gradient(ellipse_at_50%_40%,#5a4670,#30233b_75%)]"
                : "bg-[radial-gradient(ellipse_at_50%_38%,#faf7f0_0%,#e9ddf8_55%,#d9c5f0_100%)]"
            }`}
          />
          <span aria-hidden className="absolute inset-x-[14%] bottom-[5%] h-[6%] rounded-[50%] bg-plum-deep/30 blur-md" />
          <Image
            src={sculpture.cutout.src}
            alt={sculpture.image.alt}
            fill
            sizes={sizes}
            className="object-contain object-bottom px-[9%] pb-[6%] pt-[8%] drop-shadow-[0_18px_22px_rgba(31,22,39,0.4)] transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.05]"
          />
        </>
      ) : (
        <Image
          src={sculpture.image.src}
          alt={sculpture.image.alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.07]"
          style={focus ? { objectPosition: focus } : undefined}
        />
      )}
      {/* Moving light sheen */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle at var(--mx,50%) var(--my,30%), rgba(255,255,255,0.55), transparent 45%)" }}
      />
      {/* Inset gold frame draws in on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-3 scale-[0.97] border border-gold/0 transition-all duration-700 ease-[var(--ease-luxe)] group-hover:scale-100 group-hover:border-gold/80"
      />
      {sculpture.reference && (
        <span className="absolute left-3 top-3 bg-plum-deep/75 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-soft backdrop-blur-sm">
          Reference image
        </span>
      )}
      {number !== undefined && (
        <span className="absolute right-4 top-3.5 font-display text-sm italic text-ivory drop-shadow">No. {String(number).padStart(2, "0")}</span>
      )}
    </>
  );

  const tiltStyle = {
    transform: "perspective(1000px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))",
    transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
  } as const;

  if (overlay) {
    return (
      <article className={`group h-full ${className}`}>
        <button
          type="button"
          onClick={() => openSculpture(sculpture.slug, sequence)}
          className="block h-full w-full text-left"
          aria-label={`View ${sculpture.name}`}
        >
          <div
            ref={frame}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            style={tiltStyle}
            className="relative h-full min-h-[320px] overflow-hidden bg-plum shadow-[0_30px_60px_-35px_rgba(31,22,39,0.7)]"
          >
            {media}
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-plum-deep/90 via-plum-deep/40 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-6 text-ivory">
              <span className="eyebrow block text-[10px] text-gold-soft">{categoryName(sculpture.category)}</span>
              <span className="mt-2 block font-display text-[1.7rem] leading-tight">{sculpture.name}</span>
              <span className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ivory/80 transition-colors group-hover:text-gold-soft">
                <span className="h-px w-6 bg-gold transition-all duration-500 group-hover:w-12" /> View <ArrowUpRight size={14} />
              </span>
            </span>
          </div>
        </button>
      </article>
    );
  }

  return (
    <article className={`group ${className}`}>
      <button type="button" onClick={() => openSculpture(sculpture.slug, sequence)} className="block w-full text-left" aria-label={`View ${sculpture.name}`}>
        <div
          ref={frame}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          style={tiltStyle}
          className={`relative overflow-hidden ${aspect} ${dark ? "bg-plum-soft" : "bg-lavender/60"} shadow-[0_25px_50px_-35px_rgba(31,22,39,0.6)]`}
        >
          {media}
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-plum-deep/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <span className="absolute bottom-5 left-5 flex translate-y-3 items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ivory opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            View sculpture <ArrowUpRight size={15} />
          </span>
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className={`eyebrow text-[10px] ${dark ? "text-gold-soft/80" : "text-gold-deep"}`}>{categoryName(sculpture.category)}</p>
            <h3 className={`mt-1.5 truncate font-display text-2xl leading-tight ${dark ? "text-ivory" : "text-plum"}`}>{sculpture.name}</h3>
          </div>
          <span aria-hidden className="mt-2 h-px w-8 shrink-0 bg-gold transition-all duration-500 group-hover:w-14" />
        </div>
        {showSummary && <p className={`mt-2 line-clamp-2 min-h-[2.75em] text-sm leading-relaxed ${dark ? "text-ivory/60" : "text-mist"}`}>{sculpture.summary}</p>}
      </button>
    </article>
  );
}
