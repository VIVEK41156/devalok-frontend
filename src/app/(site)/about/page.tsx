import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import RevealScope from "@/components/motion/RevealScope";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import BrandValues from "@/components/home/BrandValues";
import EnquiryCTA from "@/components/home/EnquiryCTA";
import { getSite } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { titleOf } from "@/components/ui/SectionTitle";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("about");
}

export default async function AboutPage() {
  const cms = await getSite();
  const categories = cms.getCategories();
  const page = cms.page("about");
  const hero = cms.section("about", "hero");
  const philosophy = cms.section("about", "philosophy");
  const site = cms.data.settings;
  // Main content: paragraphs separated by blank lines (plain text, no HTML).
  const paragraphs = (page?.content ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      <PageHero
        eyebrow={hero?.eyebrow ?? "About Devalok"}
        title={titleOf(hero, { heading: page?.title ?? "About Us" }, "text-gold-sheen")}
        intro={page?.intro}
        image={page?.featuredImage ? { src: page.featuredImage.src, alt: "" } : { src: "/images/cutouts/kanyaka-parameshwari-stone.webp", alt: "", cutout: true }}
      />

      {/* Philosophy */}
      <RevealScope as="section" aria-labelledby="philosophy-title" className="grain relative bg-ivory py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-16 px-5 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow={philosophy?.eyebrow ?? "Our philosophy"}
              title={<span id="philosophy-title">{titleOf(philosophy, { heading: "Our philosophy" })}</span>}
            />
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-plum/80 lg:col-span-6 lg:col-start-7 lg:pt-10">
            {paragraphs.map((p, i) => (
              <p key={i} data-reveal="up" data-reveal-delay={String(i * 0.08)} className={i > 0 ? "text-mist" : undefined}>
                {p}
              </p>
            ))}
            <div data-reveal="up" data-reveal-delay="0.12" className="grid gap-6 border-t border-gold/40 pt-8 sm:grid-cols-2">
              <div>
                <p className="eyebrow text-[10px] text-gold-deep">Vision</p>
                <p className="mt-2 font-display text-2xl leading-snug text-plum">{site.vision}</p>
              </div>
              <div>
                <p className="eyebrow text-[10px] text-gold-deep">Mission</p>
                <p className="mt-2 font-display text-2xl leading-snug text-plum">{site.mission}</p>
              </div>
            </div>
          </div>
        </div>
      </RevealScope>

      {/* Craftsmanship mosaic */}
      <RevealScope as="section" aria-label="Craftsmanship" className="bg-plum py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-4 px-5 sm:px-8 md:grid-cols-12 md:gap-6">
          <figure className="relative col-span-2 aspect-[16/10] overflow-hidden md:col-span-7 md:row-span-2 md:aspect-auto">
            <div data-reveal="mask" className="absolute inset-0">
              <div data-parallax="0.1" className="absolute -inset-y-[6%] inset-x-0">
                <Image src="/images/sculptures/radha-krishna-stone.jpg" alt="Seated Radha Krishna sculpture in the carving workshop" fill sizes="(min-width: 768px) 58vw, 92vw" className="object-cover" />
              </div>
            </div>
            <figcaption className="absolute bottom-0 left-0 bg-plum-deep/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-gold-soft">In the workshop</figcaption>
          </figure>
          <figure className="relative aspect-[3/4] overflow-hidden md:col-span-5 md:aspect-[16/11]">
            <div data-reveal="mask" data-reveal-delay="0.1" className="absolute inset-0">
              <Image src="/images/sculptures/venugopala-wood.jpg" alt="Detail of a hand-carved Krishna" fill sizes="(min-width: 768px) 40vw, 46vw" className="object-cover object-[50%_20%]" />
            </div>
          </figure>
          <figure className="relative aspect-[3/4] overflow-hidden md:col-span-5 md:aspect-[16/11]">
            <div data-reveal="mask" data-reveal-delay="0.2" className="absolute inset-0">
              <Image src="/images/sculptures/panchamukha-ganapati.jpg" alt="Detail of the carved arch of Panchamukha Ganapati" fill sizes="(min-width: 768px) 40vw, 46vw" className="object-cover object-[50%_45%]" />
            </div>
          </figure>
        </div>
      </RevealScope>

      {/* Materials */}
      <RevealScope as="section" aria-labelledby="materials-title" className="grain bg-ivory py-24 sm:py-32">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <SectionHeading
            eyebrow="Materials & categories"
            title={<span id="materials-title">What we work in</span>}
            intro="Our collections are organised by material, each carrying its own tradition and finish."
          />
          <ul className="mt-14 divide-y divide-gold/30 border-y border-gold/30">
            {categories.map((c, i) => (
              <li key={c.id} data-reveal="rise3d" data-reveal-delay={String(i * 0.1)}>
                <Link href={`/gallery?category=${c.id}`} className="group grid items-center gap-4 py-8 sm:grid-cols-12">
                  <span className="font-display text-2xl italic text-gold sm:col-span-1">0{i + 1}</span>
                  <span className="font-display text-4xl text-plum transition-colors group-hover:text-gold-deep sm:col-span-4 sm:text-5xl">{c.name}</span>
                  <span className="text-mist sm:col-span-5">{c.description}</span>
                  <span className="flex justify-end sm:col-span-2">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-plum/20 transition group-hover:border-gold group-hover:bg-gold">
                      <ArrowUpRight size={18} />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div data-reveal="up" className="mt-12">
            <Button href="/gallery" variant="outline-dark">
              Explore the gallery
            </Button>
          </div>
        </div>
      </RevealScope>

      <BrandValues />
      <EnquiryCTA />
    </>
  );
}
