import RevealScope from "@/components/motion/RevealScope";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import FilterableGallery from "@/components/sculpture/FilterableGallery";
import { getSite } from "@/lib/site";
import { titleOf } from "@/components/ui/SectionTitle";

export default async function GalleryPreview() {
  const sec = (await getSite()).section("home", "gallery_preview");
  return (
    <RevealScope as="section" id="gallery-preview" aria-labelledby="preview-title" className="grain relative bg-parchment py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <SectionHeading
          eyebrow={sec?.eyebrow ?? "The gallery"}
          title={<span id="preview-title">{titleOf(sec, { heading: "Wander the", accent: "collection." })}</span>}
          intro={sec?.description}
        />
        <div className="mt-12">
          <FilterableGallery limit={8} />
        </div>
        <div className="mt-16 flex justify-center">
          <Button href={sec?.ctaUrl || "/gallery"} variant="outline-dark">
            {sec?.ctaLabel || "Enter the full gallery"}
          </Button>
        </div>
      </div>
    </RevealScope>
  );
}
