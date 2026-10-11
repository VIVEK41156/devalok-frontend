import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RevealScope from "@/components/motion/RevealScope";
import SectionHeading from "@/components/ui/SectionHeading";
import { getSite } from "@/lib/site";
import { titleOf } from "@/components/ui/SectionTitle";

// Desktop: an expanding panel gallery (pure CSS flex-grow, no JS).
// Tablet: balanced 2×2. Mobile: stacked.
export default async function Collections() {
  const site = await getSite();
  const categories = site.getCategories();
  const sec = site.section("home", "collections");
  return (
    <RevealScope as="section" data-bg="home_collections" aria-labelledby="collections-title" className="relative overflow-hidden bg-lavender py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(250,247,240,0.8),transparent_65%)]" />
      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow={sec?.eyebrow ?? "Explore our collections"}
            title={<span id="collections-title">{titleOf(sec, { heading: "Our collections" })}</span>}
          />
          <p data-reveal="up" className="max-w-sm text-mist lg:pb-3">
            {sec?.description}
          </p>
        </div>

        <ul className="acc mt-14 grid gap-4 sm:grid-cols-2 lg:flex lg:h-[600px] lg:gap-3">
          {categories.map((c, i) => (
            <li
              key={c.id}
              data-reveal="rise3d"
              data-reveal-delay={String(i * 0.1)}
              className="group relative h-[420px] overflow-hidden bg-plum-deep transition-[flex-grow] duration-700 ease-[var(--ease-luxe)] sm:h-[460px] lg:h-full lg:flex-1 lg:hover:flex-[2.6] lg:focus-within:flex-[2.6]"
            >
              <Link href={`/products#${c.slug}`} className="absolute inset-0 block" aria-label={`Explore ${c.name}`}>
                <Image
                  src={c.coverImage}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 45vw, (min-width: 640px) 50vw, 92vw"
                  className="object-cover opacity-85 transition duration-[1400ms] ease-[var(--ease-luxe)] group-hover:scale-105 group-hover:opacity-100"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-plum-deep via-plum-deep/35 to-plum-deep/10" />
                <span aria-hidden className="absolute inset-3 border border-gold/0 transition-colors duration-700 group-hover:border-gold/70" />

                {/* Collapsed state: vertical title (desktop only) */}
                <span
                  aria-hidden
                  className="acc-vert absolute bottom-8 left-1/2 hidden origin-center -translate-x-1/2 transition-opacity duration-300 lg:block lg:group-hover:opacity-0 lg:group-focus-within:opacity-0"
                >
                  <span className="block whitespace-nowrap font-display text-3xl text-ivory [writing-mode:vertical-rl] rotate-180">{c.name}</span>
                </span>

                <span className="acc-body absolute inset-x-0 bottom-0 p-7 text-ivory transition-opacity duration-500 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 lg:group-hover:delay-200">
                  <span className="flex items-center justify-between">
                    <span className="font-display text-lg italic text-gold-soft">0{i + 1}</span>
                    <span className="eyebrow text-[10px] text-ivory/60">{site.getSculptures(c.id).length} pieces</span>
                  </span>
                  <span className="mt-3 block font-display text-4xl leading-none lg:text-5xl">{c.name}</span>
                  <span className="mt-2 block text-sm italic text-gold-soft">{c.tagline}</span>
                  <span className="mt-3 block max-w-md text-sm leading-relaxed text-ivory/75">{c.description}</span>
                  <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
                    Explore collection <ArrowUpRight size={15} className="text-gold" />
                  </span>
                </span>
                <span className="absolute left-5 top-5 font-display text-sm italic text-ivory/70 lg:block">0{i + 1}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </RevealScope>
  );
}
