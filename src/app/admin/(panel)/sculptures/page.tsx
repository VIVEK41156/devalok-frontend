"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, FilePlus2, Pencil, Search, Star, Trash2 } from "lucide-react";
import { api, ApiError, type Category, type Paginated, type Sculpture } from "@/lib/admin-api";
import { refreshPublicSite } from "@/app/admin/actions";
import { Badge, Button, Card, EmptyState, ErrorState, LinkButton, LoadingState, PageHeader, Pagination, StatusBadge, formatDate, useConfirm, useToast } from "@/components/admin/ui";
import { Thumb } from "@/components/admin/MediaPicker";
import { useApi } from "@/components/admin/useApi";

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function SculpturesPage() {
  const params = useSearchParams();
  const confirm = useConfirm();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [sort, setSort] = useState("order");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);

  const categories = useApi(() => api.get<{ data: Category[] }>("/admin/categories").then((r) => r.data), []);
  const list = useApi(
    () => api.get<Paginated<Sculpture>>("/admin/sculptures", { search: q, category_id: categoryId, status, sort, page, per_page: 15 }),
    [q, categoryId, status, sort, page],
  );

  const setStatusOf = async (s: Sculpture, next: "draft" | "published") => {
    try {
      await api.put(`/admin/sculptures/${s.id}`, {
        title: s.title,
        category_id: s.category_id,
        status: next,
        cover_media_id: s.cover_media_id,
        is_featured: s.is_featured,
        sort_order: s.sort_order,
      });
      await refreshPublicSite();
      toast({ tone: "success", message: next === "published" ? `“${s.title}” is now live.` : `“${s.title}” moved to drafts.` });
      await list.reload();
    } catch (e) {
      toast({ tone: "error", message: e instanceof ApiError ? e.message : "Could not update status." });
    }
  };

  const remove = async (s: Sculpture) => {
    const ok = await confirm({
      title: "Delete sculpture?",
      message: (
        <>
          <strong>{s.title}</strong> will be removed from the website and the CMS. Its images stay in the media library. This cannot be undone.
        </>
      ),
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.del(`/admin/sculptures/${s.id}`);
      await refreshPublicSite();
      toast({ tone: "success", message: "Sculpture deleted." });
      await list.reload();
    } catch (e) {
      toast({ tone: "error", message: e instanceof ApiError ? e.message : "Delete failed." });
    }
  };

  const reset = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Sculptures"
        description="Create, edit and publish the pieces shown on the website. Drafts are never visible to the public."
        actions={
          <LinkButton href="/admin/sculptures/new" icon={<FilePlus2 size={16} />}>
            Add sculpture
          </LinkButton>
        }
      />
      <Card padded={false}>
        <div className="grid gap-3 border-b border-gold/15 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_200px_160px_170px]">
          <label className="relative">
            <span className="sr-only">Search sculptures</span>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
            <input
              value={search}
              onChange={(e) => reset(() => setSearch(e.target.value))}
              placeholder="Search by title"
              className="w-full rounded-md border border-plum/20 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
            />
          </label>
          <select aria-label="Filter by category" value={categoryId} onChange={(e) => reset(() => setCategoryId(e.target.value))} className="rounded-md border border-plum/20 bg-white px-3 py-2.5 text-sm">
            <option value="">All categories</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select aria-label="Filter by status" value={status} onChange={(e) => reset(() => setStatus(e.target.value))} className="rounded-md border border-plum/20 bg-white px-3 py-2.5 text-sm">
            <option value="">Any status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select aria-label="Sort" value={sort} onChange={(e) => reset(() => setSort(e.target.value))} className="rounded-md border border-plum/20 bg-white px-3 py-2.5 text-sm">
            <option value="order">Display order</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="updated">Recently updated</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>

        {list.loading && !list.data ? (
          <LoadingState />
        ) : list.error ? (
          <div className="p-5">
            <ErrorState message={list.error} onRetry={list.reload} />
          </div>
        ) : !list.data?.data.length ? (
          <EmptyState
            title={q || categoryId || status ? "No sculptures match these filters" : "No sculptures yet"}
            action={<LinkButton href="/admin/sculptures/new">Add sculpture</LinkButton>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-parchment/60 text-left text-xs uppercase tracking-wider text-mist">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Sculpture</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Updated</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {list.data.data.map((s) => (
                    <tr key={s.id} className="hover:bg-lavender/20">
                      <td className="px-4 py-3">
                        <Link href={`/admin/sculptures/${s.id}`} className="flex items-center gap-3">
                          <Thumb media={s.cover} className="h-14 w-11 shrink-0 rounded" />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 font-semibold text-plum hover:underline">
                              {s.title}
                              {s.is_featured && <Star size={13} className="fill-gold text-gold" aria-label="Featured" />}
                            </span>
                            <span className="block text-xs text-mist">/{s.slug}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-plum/80">{s.category?.name ?? <Badge tone="danger">None</Badge>}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-plum/80">{s.sort_order}</td>
                      <td className="px-4 py-3 text-xs text-mist">{formatDate(s.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            aria-label={s.status === "published" ? `Unpublish ${s.title}` : `Publish ${s.title}`}
                            title={s.status === "published" ? "Unpublish" : "Publish"}
                            icon={s.status === "published" ? <EyeOff size={16} /> : <Eye size={16} />}
                            onClick={() => void setStatusOf(s, s.status === "published" ? "draft" : "published")}
                          />
                          <LinkButton href={`/admin/sculptures/${s.id}`} variant="ghost" icon={<Pencil size={16} />}>
                            <span className="sr-only">Edit {s.title}</span>
                          </LinkButton>
                          <Button variant="ghost" aria-label={`Delete ${s.title}`} title="Delete" icon={<Trash2 size={16} className="text-red-700" />} onClick={() => void remove(s)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={list.data.meta} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
