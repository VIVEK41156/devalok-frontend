"use client";

import { useSearchParams } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import FilterableGallery from "./FilterableGallery";

/** Reads ?category= so collection links land on a pre-filtered gallery. */
export default function GalleryFromParams() {
  const param = useSearchParams().get("category");
  const { isCategoryId } = useSite();
  const initial = isCategoryId(param) ? param : "all";
  return <FilterableGallery key={initial} initialFilter={initial} syncUrl />;
}
