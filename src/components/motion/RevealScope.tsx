"use client";

import { useRef, type ElementType, type ReactNode, type ComponentPropsWithoutRef } from "react";
import { gsap, useGSAP, MOTION_OK, DESKTOP_MOTION } from "@/lib/gsap";

type Props<T extends ElementType> = {
  as?: T;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">;

/**
 * Animates descendants marked with data-reveal as they scroll into view:
 *   data-reveal="up" | "fade" | "mask" (clip-path wipe for images) | "rise3d" (tilts up out of depth)
 *   | "words" (heading wrapped in <SplitWords>; words rise one by one)
 *   data-reveal-delay="0.2"
 * Content stays fully visible when motion is reduced or JS is unavailable.
 */
export default function RevealScope<T extends ElementType = "div">({ as, children, ...rest }: Props<T>) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const items = gsap.utils.toArray<HTMLElement>("[data-reveal]", ref.current);
        items.forEach((el) => {
          const kind = el.dataset.reveal;
          const delay = Number(el.dataset.revealDelay ?? 0);
          if (kind === "words") {
            // Headings wrapped in <SplitWords>: words rise out of their masks one by one.
            gsap.fromTo(
              el.querySelectorAll("[data-word]"),
              { yPercent: 115, rotate: 3 },
              {
                yPercent: 0,
                rotate: 0,
                duration: 1.15,
                ease: "expo.out",
                stagger: 0.07,
                delay,
                scrollTrigger: { trigger: el, start: "top 90%", once: true },
              },
            );
            return;
          }
          const from: gsap.TweenVars =
            kind === "mask"
              ? { clipPath: "inset(100% 0% 0% 0%)" }
              : kind === "fade"
                ? { autoAlpha: 0 }
                : kind === "rise3d"
                  ? { autoAlpha: 0, y: 90, z: -160, rotateX: -22, transformPerspective: 1200, transformOrigin: "50% 100%" }
                  : { autoAlpha: 0, y: 36 };
          const to: gsap.TweenVars =
            kind === "mask"
              ? { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.out" }
              : kind === "rise3d"
                ? { autoAlpha: 1, y: 0, z: 0, rotateX: 0, duration: 1.3, ease: "expo.out", clearProps: "transform" }
                : { autoAlpha: 1, y: 0, duration: 1.05, ease: "power3.out" };
          gsap.fromTo(el, from, {
            ...to,
            delay,
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });
      });
      // data-parallax="0.12": element drifts by that fraction of its height while in view.
      mm.add(DESKTOP_MOTION, () => {
        gsap.utils.toArray<HTMLElement>("[data-parallax]", ref.current).forEach((el) => {
          const amount = Number(el.dataset.parallax ?? 0.1) * 100;
          gsap.fromTo(
            el,
            { yPercent: -amount / 2 },
            { yPercent: amount / 2, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: 0.5 } },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  );
}
