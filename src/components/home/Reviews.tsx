import Image from "next/image";
import { FaQuoteLeft, FaStar } from "react-icons/fa6";
import RevealScope from "@/components/motion/RevealScope";
import SplitWords from "@/components/motion/SplitWords";
import { titleOf } from "@/components/ui/SectionTitle";
import type { Review } from "@/data/types";
import { getSite } from "@/lib/site";

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <FaStar key={i} size={size} aria-hidden className={i <= rating ? "text-gold" : "text-ivory/20"} />
      ))}
    </span>
  );
}

function ReviewCard({ r }: { r: Review }) {
  return (
    <figure className="group/card relative flex w-[min(82vw,380px)] shrink-0 flex-col rounded-2xl border border-lilac/20 bg-white/[0.06] p-7 text-ivory shadow-[0_30px_60px_-35px_rgba(0,0,0,0.8)] backdrop-blur-sm transition duration-500 hover:-translate-y-1.5 hover:border-gold/60 hover:bg-white/[0.1]">
      <span aria-hidden className="absolute right-6 top-6 text-3xl text-lilac/25 transition-colors group-hover/card:text-gold/50">
        <FaQuoteLeft />
      </span>
      <Stars rating={r.rating} />
      <blockquote className="mt-5 flex-1 font-display text-[1.35rem] leading-snug text-ivory/90">&ldquo;{r.content}&rdquo;</blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-lilac/15 pt-5">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-lilac to-gold font-display text-lg text-plum-deep ring-2 ring-gold/40">
          {r.avatar ? <Image src={r.avatar} alt="" fill sizes="44px" className="object-cover" /> : r.name.charAt(0)}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{r.name}</span>
          {r.location && <span className="block truncate text-xs text-lilac/80">{r.location}</span>}
        </span>
        {r.sample && <span className="ml-auto shrink-0 rounded-full border border-lilac/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-lilac/70">Sample</span>}
      </figcaption>
    </figure>
  );
}

/** Two rows of review cards drifting in opposite directions (pause on hover). */
function Row({ items, reverse }: { items: Review[]; reverse?: boolean }) {
  const half = Array.from({ length: Math.max(1, Math.ceil(6 / items.length)) }, () => items).flat();
  return (
    <div className="group/row relative overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <ul className={`flex w-max gap-6 pr-6 ${reverse ? "animate-marquee-reverse" : "animate-marquee"} [animation-duration:60s] group-hover/row:[animation-play-state:paused]`}>
        {[0, 1].map((copy) =>
          half.map((r, i) => (
            <li key={`${copy}-${i}-${r.id}`} aria-hidden={copy === 1} className="flex">
              <ReviewCard r={r} />
            </li>
          )),
        )}
      </ul>
    </div>
  );
}

export default async function Reviews() {
  const site = await getSite();
  const reviews = site.data.reviews;
  if (!reviews.length) return null;
  const sec = site.section("home", "reviews");
  const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
  const mid = Math.ceil(reviews.length / 2);
  const rowA = reviews.slice(0, mid);
  const rowB = reviews.length > 3 ? reviews.slice(mid) : reviews;

  return (
    <RevealScope as="section" data-bg="home_reviews" aria-labelledby="reviews-title" className="grain relative overflow-hidden bg-[linear-gradient(160deg,#3d2b52_0%,#30233b_45%,#4b3366_100%)] py-24 text-ivory sm:py-32">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(217,197,240,0.28),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute -right-40 bottom-0 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(200,164,93,0.18),transparent_65%)]" />

      <div className="relative mx-auto flex max-w-[1400px] flex-col gap-10 px-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p data-reveal="up" className="eyebrow text-gold-soft">
            {sec?.eyebrow ?? "Kind words"}
          </p>
          <h2 id="reviews-title" data-reveal="words" className="mt-4 font-display text-[clamp(2.4rem,5.2vw,4.4rem)] font-medium leading-[1.02]">
            <SplitWords>{titleOf(sec, { heading: "Voices of", accent: "devotion." }, "text-gold-sheen")}</SplitWords>
          </h2>
          {sec?.description && (
            <p data-reveal="up" data-reveal-delay="0.12" className="mt-5 max-w-xl text-lg text-lilac/90">
              {sec.description}
            </p>
          )}
        </div>
        <div data-reveal="rise3d" className="flex items-center gap-5 rounded-2xl border border-gold/30 bg-white/[0.06] px-7 py-5 backdrop-blur-sm">
          <span className="font-display text-6xl leading-none text-gold-soft">{avg.toFixed(1)}</span>
          <span>
            <Stars rating={Math.round(avg)} size={18} />
            <span className="mt-1.5 block text-sm text-lilac/80">
              from {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </span>
          </span>
        </div>
      </div>

      <div data-reveal="fade" className="relative mt-14 space-y-3">
        <Row items={rowA} />
        {reviews.length > 1 && <Row items={rowB} reverse />}
      </div>
    </RevealScope>
  );
}
