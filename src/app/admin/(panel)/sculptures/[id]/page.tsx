"use client";

import { useParams } from "next/navigation";
import { api, type Category, type Sculpture } from "@/lib/admin-api";
import SculptureForm from "@/components/admin/SculptureForm";
import { ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/admin/ui";
import { useApi } from "@/components/admin/useApi";

export default function EditSculpturePage() {
  const { id } = useParams<{ id: string }>();
  const data = useApi(
    () =>
      Promise.all([
        api.get<{ data: Sculpture }>(`/admin/sculptures/${encodeURIComponent(id)}`).then((r) => r.data),
        api.get<{ data: Category[] }>("/admin/categories").then((r) => r.data),
      ]),
    [id],
  );
  const [sculpture, categories] = data.data ?? [null, []];

  return (
    <>
      <PageHeader title={sculpture ? sculpture.title : "Edit sculpture"} description={sculpture ? <span className="inline-flex items-center gap-2">/{sculpture.slug} <StatusBadge status={sculpture.status} /></span> : undefined} />
      {data.loading && !data.data ? (
        <LoadingState />
      ) : data.error ? (
        <ErrorState message={data.error} onRetry={data.reload} />
      ) : sculpture ? (
        <SculptureForm key={sculpture.id + (sculpture.updated_at ?? "")} sculpture={sculpture} categories={categories} />
      ) : null}
    </>
  );
}
