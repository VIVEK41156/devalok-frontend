import type { ReactNode } from "react";
import type { PageSection } from "@/data/types";

/**
 * A CMS heading with its optional italic gold accent: "Devotion, *given form.*".
 * Returned as plain nodes (not a component) so <SplitWords> can split the words.
 */
export function titleOf(section: PageSection | undefined, fallback: { heading: string; accent?: string }, accentClass = "text-gold-deep"): ReactNode {
  const heading = section?.heading ?? fallback.heading;
  const accent = section ? section.headingAccent : fallback.accent;
  if (!accent) return heading;
  return [heading, " ", <em key="accent" className={accentClass}>{accent}</em>];
}
