"use client";

import { api, type Page } from "@/lib/admin-api";
import SectionsEditor from "@/components/admin/SectionsEditor";
import { EmptyState, ErrorState, LinkButton, LoadingState, PageHeader } from "@/components/admin/ui";
import { useApi } from "@/components/admin/useApi";

/** Homepage Sections: the "home" page's sections, edited in place. */
export default function HomepageSectionsPage() {
  const res = useApi(async () => {
    const pages = await api.get<{ data: Page[] }>("/admin/pages");
    const home = pages.data.find((p) => p.slug === "home");
    return home ? (await api.get<{ data: Page }>(`/admin/pages/${home.id}`)).data : null;
  }, []);

  return (
    <>
      <PageHeader
        title="Homepage Sections"
        description="Edit the text, buttons, visibility and order of each homepage section: hero, introduction, collections, 3D hall, signature pieces, craft story, gallery preview, values and enquiry banner. Sculptures shown in the hero, hall and signature grid are the ones marked Featured."
        actions={
          <LinkButton href="/" variant="outline">
            View homepage
          </LinkButton>
        }
      />
      {res.loading && !res.data ? (
        <LoadingState />
      ) : res.error ? (
        <ErrorState message={res.error} onRetry={res.reload} />
      ) : !res.data ? (
        <EmptyState title="Home page not found" description="Run the database seeder to create the core pages." />
      ) : (
        <SectionsEditor key={res.data.id} page={res.data} />
      )}
    </>
  );
}
