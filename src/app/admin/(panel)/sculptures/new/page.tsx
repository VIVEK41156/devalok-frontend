"use client";

import { api, type Category } from "@/lib/admin-api";
import SculptureForm from "@/components/admin/SculptureForm";
import { EmptyState, ErrorState, LinkButton, LoadingState, PageHeader } from "@/components/admin/ui";
import { useApi } from "@/components/admin/useApi";

export default function NewSculpturePage() {
  const cats = useApi(() => api.get<{ data: Category[] }>("/admin/categories").then((r) => r.data), []);
  return (
    <>
      <PageHeader title="Add sculpture" description="New sculptures start as drafts until you publish them." />
      {cats.loading && !cats.data ? (
        <LoadingState />
      ) : cats.error ? (
        <ErrorState message={cats.error} onRetry={cats.reload} />
      ) : !cats.data?.length ? (
        <EmptyState title="Create a category first" description="Every sculpture belongs to a category." action={<LinkButton href="/admin/categories?new=1">Add category</LinkButton>} />
      ) : (
        <SculptureForm categories={cats.data} />
      )}
    </>
  );
}
