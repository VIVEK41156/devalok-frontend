import type { ReactNode } from "react";
import SplitWords from "@/components/motion/SplitWords";

interface Props {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
  as?: "h1" | "h2";
}

export default function SectionHeading({ eyebrow, title, intro, align = "left", tone = "light", className = "", as = "h2" }: Props) {
  const H = as;
  const center = align === "center";
  const dark = tone === "dark";
  return (
    <div className={`${center ? "mx-auto text-center" : ""} max-w-3xl ${className}`}>
      <p data-reveal="up" className={`eyebrow ${dark ? "text-gold-soft" : "text-gold-deep"}`}>
        {eyebrow}
      </p>
      <H
        data-reveal="words"
        data-reveal-delay="0.05"
        className={`mt-4 font-display text-[clamp(2.4rem,5.2vw,4.4rem)] font-medium leading-[1.02] tracking-[-0.01em] ${dark ? "text-ivory" : "text-plum"}`}
      >
        <SplitWords>{title}</SplitWords>
      </H>
      <span data-reveal="fade" data-reveal-delay="0.2" aria-hidden className={`gold-rule mt-6 ${center ? "" : ""}`}>
        <span className="block h-1.5 w-1.5 rotate-45 bg-gold" />
      </span>
      {intro && (
        <p data-reveal="up" data-reveal-delay="0.16" className={`mt-5 text-base leading-relaxed sm:text-lg ${dark ? "text-ivory/70" : "text-mist"} ${center ? "mx-auto max-w-2xl" : "max-w-xl"}`}>
          {intro}
        </p>
      )}
    </div>
  );
}
