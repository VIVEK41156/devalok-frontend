import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import RevealScope from "@/components/motion/RevealScope";
import SculptureCard from "@/components/sculpture/SculptureCard";
import CategoryTabs from "@/components/sculpture/CategoryTabs";
import EnquiryCTA from "@/components/home/EnquiryCTA";
import { getSite } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { titleOf } from "@/components/ui/SectionTitle";
import SplitWords from "@/components/motion/SplitWords";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("products");
}

export default async function ProductsPage() {
  const site = await getSite();
  const page = site.page("products");
  const hero = site.section("products", "hero");
  const categories = site.getCategories();
  const getSculptures = site.getSculptures;
  return (
    <>
      <PageHero
        eyebrow={hero?.eyebrow ?? "Our collections"}
        title={titleOf(hero, { heading: page?.title ?? "Our collections" }, "text-gold-sheen")}
        intro={page?.intro}
        image={page?.featuredImage ? { src: page.featuredImage.src, alt: "" } : { src: "/images/sculptures/radha-krishna-wood.jpg", alt: "", position: "50% 20%" }}
      >
        <ul className="mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((c, i) => (
            <li key={c.id} data-reveal="rise3d" data-reveal-delay={String(0.2 + i * 0.08)}>
              <a href={`#${c.slug}`} className="group block">
                <span className="relative block aspect-[4/5] overflow-hidden ring-1 ring-gold/30 transition group-hover:ring-gold">
                  <Image src={c.coverImage} alt="" fill sizes="(min-width: 640px) 180px, 45vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <span className="absolute inset-0 bg-gradient-to-t from-plum-deep/90 to-transparent" />
                  <span className="absolute bottom-3 left-3 right-3">
                    <span className="block font-display text-xs italic text-gold-soft">0{i + 1}</span>
                    <span className="block font-display text-lg leading-tight text-ivory">{c.name}</span>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </PageHero>

      <CategoryTabs categories={categories} />

      {categories.map((c, i) => {
        const items = getSculptures(c.id);
        const sequence = items.map((s) => s.slug);
        const reversed = i % 2 === 1;
        const hasReference = items.some((s) => s.reference);
        return (
          <RevealScope
            as="section"
            key={c.id}
            id={c.slug}
            aria-labelledby={`${c.slug}-title`}
            data-bg={i % 2 === 0 ? "products_a" : "products_b"}
            className={`grain relative scroll-mt-16 py-20 sm:py-28 ${i % 2 === 0 ? "bg-ivory" : "bg-lavender"}`}
          >
            <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
              <div className={`grid items-center gap-10 lg:grid-cols-12 lg:gap-14 ${reversed ? "lg:[direction:rtl]" : ""}`}>
                <div className="relative aspect-[16/10] overflow-hidden bg-plum-deep [direction:ltr] lg:col-span-7">
                  <div data-reveal="mask" className="absolute inset-0">
                    <div data-parallax="0.12" className="absolute -inset-y-[8%] inset-x-0">
                      <Image src={c.coverImage} alt="" fill sizes="(min-width: 1024px) 58vw, 92vw" className="object-cover object-[50%_30%]" />
                    </div>
                  </div>
                  <span aria-hidden className="absolute inset-4 border border-gold/50" />
                  <span className="absolute bottom-6 left-6 bg-plum-deep/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-soft backdrop-blur">
                    {items.length} pieces
                  </span>
                </div>
                <div className="[direction:ltr] lg:col-span-5">
                  <p data-reveal="up" className="font-display text-7xl italic leading-none text-gold/80">
                    0{i + 1}
                  </p>
                  <h2 id={`${c.slug}-title`} data-reveal="words" data-reveal-delay="0.06" className="mt-4 font-display text-5xl leading-none text-plum sm:text-6xl">
                    <SplitWords>{c.name}</SplitWords>
                  </h2>
                  <p data-reveal="up" data-reveal-delay="0.1" className="mt-3 font-display text-xl italic text-gold-deep">
                    {c.tagline}
                  </p>
                  <span data-reveal="fade" aria-hidden className="gold-rule mt-5">
                    <span className="block h-1.5 w-1.5 rotate-45 bg-gold" />
                  </span>
                  <p data-reveal="up" data-reveal-delay="0.14" className="mt-5 leading-relaxed text-mist">
                    {c.description}
                  </p>
                  {hasReference && (
                    <p data-reveal="up" data-reveal-delay="0.16" className="mt-5 flex gap-2 border-l-2 border-gold/60 bg-white/50 px-4 py-3 text-xs leading-relaxed text-plum/70">
                      <Info size={14} className="mt-0.5 shrink-0 text-gold-deep" />
                      Pieces marked &ldquo;Reference image&rdquo; use openly licensed museum photographs as stand-ins until Devalok&rsquo;s own photographs are added.
                    </p>
                  )}
                  <Link
                    data-reveal="up"
                    data-reveal-delay="0.18"
                    href={`/gallery?category=${c.id}`}
                    className="group mt-7 inline-flex items-center gap-3 border border-plum/25 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-plum transition-colors hover:border-gold hover:bg-gold hover:text-plum-deep"
                  >
                    View in gallery <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              <ul className="mt-16 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
                {items.map((s, j) => (
                  <li key={s.id} data-reveal="rise3d" data-reveal-delay={String((j % 4) * 0.08)}>
                    <SculptureCard sculpture={s} sequence={sequence} aspect="aspect-[4/5]" sizes="(min-width: 1024px) 23vw, (min-width: 640px) 45vw, 92vw" />
                  </li>
                ))}
              </ul>
            </div>
          </RevealScope>
        );
      })}

      <EnquiryCTA />
    </>
  );
}
