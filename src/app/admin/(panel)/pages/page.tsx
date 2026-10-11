"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { api, type Page } from "@/lib/admin-api";
import { Card, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, formatDate } from "@/components/admin/ui";
import { useApi } from "@/components/admin/useApi";

const PATHS: Record<string, string> = { home: "/", about: "/about", products: "/products", gallery: "/gallery", contact: "/contact" };

export default function PagesListPage() {
  const list = useApi(() => api.get<{ data: (Page & { sections_count?: number })[] }>("/admin/pages").then((r) => r.data), []);
  return (
    <>
      <PageHeader title="Website Pages" description="Titles, introductions, content and SEO for the five main pages. Page layouts and animations are part of the site design and stay intact." />
      <Card padded={false}>
        {list.loading && !list.data ? (
          <LoadingState />
        ) : list.error ? (
          <div className="p-5">
            <ErrorState message={list.error} onRetry={list.reload} />
          </div>
        ) : !list.data?.length ? (
          <EmptyState title="No pages found" description="Run the database seeder to create the core pages." />
        ) : (
          <ul className="divide-y divide-gold/10">
            {list.data.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-4 hover:bg-lavender/20">
                <Link href={`/admin/pages/${p.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-plum">{p.title}</span>
                    <span className="block text-xs text-mist">
                      {PATHS[p.slug] ?? `/${p.slug}`} · {p.sections_count ?? 0} section(s) · updated {formatDate(p.updated_at)}
                    </span>
                  </span>
                  <StatusBadge status={p.status} />
                  <ChevronRight size={16} className="text-mist" />
                </Link>
                <a href={PATHS[p.slug] ?? "/"} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.title} on the website`} className="rounded-md p-2 text-plum/60 hover:bg-lavender hover:text-plum">
                  <ExternalLink size={16} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
