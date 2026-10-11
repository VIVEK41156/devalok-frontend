import Image from "next/image";
import { Phone } from "lucide-react";
import RevealScope from "@/components/motion/RevealScope";
import Button from "@/components/ui/Button";
import { getSite } from "@/lib/site";
import { titleOf } from "@/components/ui/SectionTitle";
import SplitWords from "@/components/motion/SplitWords";

export default async function EnquiryCTA() {
  const site = await getSite();
  const sec = site.section("home", "cta");
  const phone = site.data.settings.phone;
  return (
    <RevealScope as="section" data-bg="cta" aria-labelledby="cta-title" className="grain relative overflow-hidden bg-plum text-ivory">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_60%,rgba(217,197,240,0.25),transparent_55%)]" />
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-12 px-5 py-24 sm:px-8 sm:py-28 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p data-reveal="up" className="eyebrow text-gold-soft">
            {sec?.eyebrow ?? "Begin a conversation"}
          </p>
          <h2 id="cta-title" data-reveal="words" data-reveal-delay="0.05" className="mt-5 font-display text-[clamp(2.6rem,6vw,5.4rem)] font-medium leading-[0.98]">
            <SplitWords>
              {titleOf(sec, { heading: "Discover a piece", accent: "that speaks to you." }, "text-gold-sheen")}
            </SplitWords>
          </h2>
          <p data-reveal="up" data-reveal-delay="0.14" className="mt-6 max-w-lg text-lg leading-relaxed text-ivory/70">
            {sec?.description}
          </p>
          <div data-reveal="up" data-reveal-delay="0.2" className="mt-10 flex flex-wrap items-center gap-4">
            <Button href={sec?.ctaUrl || "/contact"}>{sec?.ctaLabel || "Send an enquiry"}</Button>
            {phone && (
              <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="inline-flex items-center gap-3 px-2 py-4 text-sm tracking-wide text-ivory/80 transition hover:text-gold-soft">
                <Phone size={16} className="text-gold" /> {phone}
              </a>
            )}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm lg:col-span-4 lg:col-start-9">
          <div data-reveal="fade" className="relative aspect-[3/4]">
            <svg aria-hidden viewBox="0 0 300 400" className="absolute inset-0 h-full w-full text-gold/60" fill="none" preserveAspectRatio="none">
              <path d="M10 400 V150 C10 70 70 10 150 10 C230 10 290 70 290 150 V400" stroke="currentColor" />
            </svg>
            <div className="absolute inset-x-[14%] bottom-0 top-[10%] rounded-t-full bg-[radial-gradient(circle_at_50%_35%,rgba(233,221,248,0.45),transparent_70%)]" />
            <div data-reveal="mask" data-reveal-delay="0.15" className="absolute inset-x-[10%] bottom-0 top-[6%]">
              <Image src={sec?.image?.src ?? "/images/cutouts/varaha-stone.webp"} alt={sec?.image?.alt || "Stone relief sculpture of Varaha"} fill sizes="(min-width: 1024px) 26vw, 70vw" className="object-contain object-bottom drop-shadow-[0_25px_30px_rgba(0,0,0,0.5)]" />
            </div>
          </div>
        </div>
      </div>
    </RevealScope>
  );
}
