import Image from "next/image";
import RevealScope from "@/components/motion/RevealScope";
import Button from "@/components/ui/Button";
import { getSite } from "@/lib/site";
import { titleOf } from "@/components/ui/SectionTitle";
import SplitWords from "@/components/motion/SplitWords";

export default async function BrandIntro() {
  const site = await getSite();
  const sec = site.section("home", "introduction");
  const { vision, mission } = site.data.settings;
  return (
    <RevealScope as="section" data-bg="home_intro" id="introduction" aria-labelledby="intro-title" className="grain relative overflow-hidden bg-ivory py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-20 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(217,197,240,0.55),transparent_65%)]" />
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10">
        {/* Image composition */}
        <div className="relative lg:col-span-6">
          <div data-reveal="mask" className="relative ml-auto aspect-[4/5] w-[86%] overflow-hidden bg-lavender sm:w-[78%]">
            <div data-parallax="0.12" className="absolute -inset-y-[8%] inset-x-0">
              <Image
                src={sec?.image?.src ?? "/images/sculptures/venugopala-wood.jpg"}
                alt="Hand-carved Hoysala style Krishna playing the flute"
                fill
                sizes="(min-width: 1024px) 40vw, 80vw"
                className="object-cover object-top"
              />
            </div>
          </div>
          <div
            data-reveal="mask"
            data-reveal-delay="0.25"
            className="absolute -bottom-10 left-0 aspect-[3/4] w-[42%] overflow-hidden border-[6px] border-ivory shadow-[0_30px_60px_-25px_rgba(48,35,59,0.45)] sm:w-[36%]"
          >
            <Image
              src="/images/sculptures/radha-krishna-wood.jpg"
              alt="Detail of a carved wooden panel of Radha and Krishna"
              fill
              sizes="(min-width: 1024px) 18vw, 40vw"
              className="object-cover object-[50%_30%]"
            />
          </div>
          <div aria-hidden className="absolute -top-6 left-[8%] hidden h-40 w-40 rounded-full border border-gold/50 sm:block" />
          <p aria-hidden className="absolute -left-2 top-1/3 hidden origin-left -rotate-90 text-[10px] font-semibold uppercase tracking-[0.5em] text-gold-deep/70 lg:block">
            Est. in devotion · Bengaluru
          </p>
        </div>

        {/* Story */}
        <div className="lg:col-span-5 lg:col-start-8">
          <p data-reveal="up" className="eyebrow text-gold-deep">
            {sec?.eyebrow ?? "The House of Devalok"}
          </p>
          <h2 id="intro-title" data-reveal="words" data-reveal-delay="0.05" className="mt-4 font-display text-[clamp(2.4rem,5vw,4.2rem)] font-medium leading-[1.02] text-plum">
            <SplitWords>
              {titleOf(sec, { heading: "Devotion,", accent: "given form." })}
            </SplitWords>
          </h2>
          <span data-reveal="fade" aria-hidden className="gold-rule mt-6">
            <span className="block h-1.5 w-1.5 rotate-45 bg-gold" />
          </span>
          <p data-reveal="up" data-reveal-delay="0.12" className="mt-6 text-lg leading-relaxed text-plum/80">
            {sec?.description ?? site.data.settings.description}
          </p>

          {(vision || mission) && (
            <dl className="mt-10 grid gap-6 border-t border-gold/40 pt-8 sm:grid-cols-2">
              {vision && (
                <div data-reveal="up" data-reveal-delay="0.1">
                  <dt className="eyebrow text-[10px] text-gold-deep">Our Vision</dt>
                  <dd className="mt-2 font-display text-xl leading-snug text-plum">{vision}</dd>
                </div>
              )}
              {mission && (
                <div data-reveal="up" data-reveal-delay="0.2">
                  <dt className="eyebrow text-[10px] text-gold-deep">Our Mission</dt>
                  <dd className="mt-2 font-display text-xl leading-snug text-plum">{mission}</dd>
                </div>
              )}
            </dl>
          )}

          <div data-reveal="up" data-reveal-delay="0.2" className="mt-10">
            <Button href={sec?.ctaUrl || "/about"} variant="outline-dark">
              {sec?.ctaLabel || "Discover our story"}
            </Button>
          </div>
        </div>
      </div>
    </RevealScope>
  );
}
