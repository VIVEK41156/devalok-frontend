import RevealScope from "@/components/motion/RevealScope";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import SculptureCard from "@/components/sculpture/SculptureCard";
import { getSite } from "@/lib/site";
import { titleOf } from "@/components/ui/SectionTitle";

// Bento: every row is completely filled at each breakpoint, so the grid stays balanced.
//   lg (4 cols):  [ A A B C ]   sm (2 cols): [ A A ]
//                 [ A A B D ]                [ A A ]
//                 [ E E F G ]                [ B C ]  [ B D ]  [ E E ]  [ F G ]
// Slots are filled in order by the sculptures marked "featured" in the CMS.
const SLOTS: { cls: string; sizes: string; focus?: string }[] = [
  { cls: "sm:col-span-2 sm:row-span-2", sizes: "(min-width: 640px) 50vw, 92vw" },
  { cls: "sm:row-span-2", focus: "50% 30%", sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 92vw" },
  { cls: "", sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 92vw" },
  { cls: "", sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 92vw" },
  { cls: "sm:col-span-2", sizes: "(min-width: 640px) 50vw, 92vw", focus: "50% 20%" },
  { cls: "", sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 92vw" },
  { cls: "", sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 92vw" },
];

export default async function SignatureSculptures() {
  const site = await getSite();
  const sec = site.section("home", "signature");
  const tiles = site.getFeaturedSculptures().slice(0, SLOTS.length).map((s, i) => ({ ...SLOTS[i], s }));
  const sequence = tiles.map((t) => t.s.slug);
  if (!tiles.length) return null;

  return (
    <RevealScope as="section" data-bg="home_signature" aria-labelledby="signature-title" className="grain relative bg-ivory py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow={sec?.eyebrow ?? "Signature sculptures"}
            title={<span id="signature-title">{titleOf(sec, { heading: "Signature sculptures" })}</span>}
          />
          <div data-reveal="up" className="max-w-sm lg:pb-3">
            {sec?.description && <p className="text-mist">{sec.description}</p>}
            <Button href={sec?.ctaUrl || "/gallery"} variant="text" className="mt-4">
              {sec?.ctaLabel || "Full gallery"}
            </Button>
          </div>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-5 [grid-auto-rows:440px] sm:grid-cols-2 sm:[grid-auto-rows:300px] lg:grid-cols-4 lg:[grid-auto-rows:320px]">
          {tiles.map((t, i) => (
            <li key={t.s.id} data-reveal="rise3d" data-reveal-delay={String((i % 4) * 0.08)} className={t.cls}>
              <SculptureCard sculpture={t.s} sequence={sequence} number={i + 1} variant="overlay" sizes={t.sizes} focus={t.focus} />
            </li>
          ))}
        </ul>
      </div>
    </RevealScope>
  );
}
