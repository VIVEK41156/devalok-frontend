import RevealScope from "@/components/motion/RevealScope";
import SectionHeading from "@/components/ui/SectionHeading";
import { getSite } from "@/lib/site";
import { titleOf } from "@/components/ui/SectionTitle";

export default async function BrandValues({ tone = "lavender" }: { tone?: "lavender" | "ivory" }) {
  const site = await getSite();
  const sec = site.section("home", "values");
  // The value cards are the "value_*" sections of the About page in the CMS.
  const values = (site.page("about")?.sections ?? [])
    .filter((s) => s.key.startsWith("value_") && s.visible)
    .map((s) => ({ numeral: s.eyebrow ?? "", title: s.heading ?? "", text: s.description ?? "" }));
  if (!values.length) return null;
  return (
    <RevealScope
      as="section"
      aria-labelledby="values-title"
      data-bg="values"
      className={`relative overflow-hidden py-24 sm:py-32 ${tone === "lavender" ? "bg-lavender" : "bg-ivory"}`}
    >
      <svg aria-hidden viewBox="0 0 400 400" className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] text-gold/30" fill="none">
        <circle cx="200" cy="200" r="198" stroke="currentColor" />
        <circle cx="200" cy="200" r="150" stroke="currentColor" strokeDasharray="2 6" />
        <circle cx="200" cy="200" r="100" stroke="currentColor" />
      </svg>
      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
        <SectionHeading
          align="center"
          eyebrow={sec?.eyebrow ?? "What guides our hands"}
          title={<span id="values-title">{titleOf(sec, { heading: "Our values" })}</span>}
        />
        <ul className="mt-16 grid gap-px overflow-hidden border border-gold/30 bg-gold/30 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <li key={`${v.title}-${i}`} data-reveal="rise3d" data-reveal-delay={String(i * 0.1)} className="group relative bg-ivory/80 p-8 transition-colors duration-500 hover:bg-ivory sm:p-10">
              <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-700 group-hover:scale-x-100" />
              <span className="font-display text-5xl italic text-gold">{v.numeral}</span>
              <h3 className="mt-6 font-display text-3xl text-plum">{v.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mist">{v.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </RevealScope>
  );
}
