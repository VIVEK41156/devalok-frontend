import type { Metadata } from "next";
import { Suspense } from "react";
import PageHero from "@/components/ui/PageHero";
import RevealScope from "@/components/motion/RevealScope";
import FilterableGallery from "@/components/sculpture/FilterableGallery";
import GalleryFromParams from "@/components/sculpture/GalleryFromParams";
import FeaturedSpotlight from "@/components/sculpture/FeaturedSpotlight";
import EnquiryCTA from "@/components/home/EnquiryCTA";
import { getSite } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { titleOf } from "@/components/ui/SectionTitle";
import SplitWords from "@/components/motion/SplitWords";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("gallery");
}

export default async function GalleryPage() {
  const site = await getSite();
  const page = site.page("gallery");
  const hero = site.section("gallery", "hero");
  const featured = site.getFeaturedSculptures();
  const spotlight = featured.find((s) => s.cutout) ?? featured[0];
  return (
    <>
      <PageHero
        eyebrow={hero?.eyebrow ?? "The gallery"}
        title={titleOf(hero, { heading: page?.title ?? "Gallery" }, "text-gold-sheen")}
        intro={page?.intro}
        image={page?.featuredImage ? { src: page.featuredImage.src, alt: "" } : { src: "/images/sculptures/panchamukha-ganapati.jpg", alt: "", position: "50% 40%" }}
      />

      {spotlight && <FeaturedSpotlight sculpture={spotlight} />}

      <RevealScope as="section" aria-labelledby="all-title" className="grain bg-ivory py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <h2 id="all-title" data-reveal="words" className="font-display text-4xl text-plum sm:text-5xl">
            <SplitWords>The full collection</SplitWords>
          </h2>
          <div className="mt-8">
            <Suspense fallback={<FilterableGallery syncUrl />}>
              <GalleryFromParams />
            </Suspense>
          </div>
        </div>
      </RevealScope>

      <EnquiryCTA />
    </>
  );
}
