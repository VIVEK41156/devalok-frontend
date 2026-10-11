import type { Metadata } from "next";
import type { ReactNode } from "react";
import CinematicHero from "@/components/home/CinematicHero";
import BrandIntro from "@/components/home/BrandIntro";
import Collections from "@/components/home/Collections";
import GalleryHall3D from "@/components/home/GalleryHall3D";
import SignatureSculptures from "@/components/home/SignatureSculptures";
import CraftStory from "@/components/home/CraftStory";
import GalleryPreview from "@/components/home/GalleryPreview";
import BrandValues from "@/components/home/BrandValues";
import EnquiryCTA from "@/components/home/EnquiryCTA";
import Reviews from "@/components/home/Reviews";
import { getSite } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("home", { absoluteTitle: true });
}

// Section keys managed under "Homepage Sections" in the admin panel.
const SECTIONS: Record<string, () => ReactNode> = {
  hero: () => <CinematicHero />,
  introduction: () => <BrandIntro />,
  collections: () => <Collections />,
  hall: () => <GalleryHall3D />,
  signature: () => <SignatureSculptures />,
  craft: () => <CraftStory />,
  gallery_preview: () => <GalleryPreview />,
  values: () => <BrandValues />,
  reviews: () => <Reviews />,
  cta: () => <EnquiryCTA />,
};
const DEFAULT_ORDER = Object.keys(SECTIONS);

export default async function HomePage() {
  const site = await getSite();
  const sections = site.page("home")?.sections;
  // CMS order and visibility; if the CMS is unreachable, keep the designed order.
  const keys = sections?.length ? sections.filter((s) => s.visible && SECTIONS[s.key]).map((s) => s.key) : DEFAULT_ORDER;
  return <>{keys.map((k) => <div key={k} className="contents">{SECTIONS[k]()}</div>)}</>;
}
