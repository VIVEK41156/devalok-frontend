"use client";

import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
      className="group inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-ivory/70 transition hover:text-gold"
    >
      Back to top
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 transition group-hover:-translate-y-1 group-hover:border-gold">
        <ArrowUp size={16} />
      </span>
    </button>
  );
}
