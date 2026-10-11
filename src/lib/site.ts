import "server-only";
import { createCatalog } from "./catalog";
import { getSiteData } from "./cms";

/** Server components: the cached CMS snapshot plus catalog helpers. */
export async function getSite() {
  return createCatalog(await getSiteData());
}
