"use client";

import Link from "next/link";
import { FilePlus2, FolderPlus, Images, Inbox, LayoutTemplate, Pencil, Shapes } from "lucide-react";
import { api, type Sculpture } from "@/lib/admin-api";
import { useAuth } from "@/components/admin/AuthProvider";
import { Card, EmptyState, ErrorState, LinkButton, LoadingState, PageHeader, StatusBadge, formatDate } from "@/components/admin/ui";
import { Thumb } from "@/components/admin/MediaPicker";
import { useApi } from "@/components/admin/useApi";

interface Dashboard {
  stats: { published_sculptures: number; draft_sculptures: number; categories: number; gallery_images: number; media_files: number; new_enquiries: number };
  recent_sculptures: Sculpture[];
  recent_activity: { id: number; action: string; description: string | null; user: { name: string } | null; created_at: string }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi(() => api.get<{ data: Dashboard }>("/admin/dashboard").then((r) => r.data), []);

  const stats = data?.stats;
  const tiles = stats
    ? [
        { label: "Published sculptures", value: stats.published_sculptures, href: "/admin/sculptures?status=published", icon: Shapes },
        { label: "Draft sculptures", value: stats.draft_sculptures, href: "/admin/sculptures?status=draft", icon: Pencil },
        { label: "Categories", value: stats.categories, href: "/admin/categories", icon: FolderPlus },
        { label: "Gallery images", value: stats.gallery_images, sub: `${stats.media_files} files in library`, href: "/admin/media", icon: Images },
        { label: "New enquiries", value: stats.new_enquiries, href: "/admin/enquiries?status=new", icon: Inbox, highlight: stats.new_enquiries > 0 },
      ]
    : [];

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name.split(" ")[0] ?? ""}`}
        description="An overview of the Devalok website content. Figures are live from the database."
        actions={
          <>
            <LinkButton href="/admin/sculptures/new" icon={<FilePlus2 size={16} />}>
              Add sculpture
            </LinkButton>
            <LinkButton href="/admin/categories?new=1" variant="outline" icon={<FolderPlus size={16} />}>
              Add category
            </LinkButton>
          </>
        }
      />

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {tiles.map((t) => (
              <li key={t.label}>
                <Link
                  href={t.href}
                  className={`group block rounded-xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${t.highlight ? "border-gold" : "border-gold/25"}`}
                >
                  <span className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lavender text-plum">
                      <t.icon size={18} />
                    </span>
                    {t.highlight && <span className="h-2 w-2 rounded-full bg-gold" aria-hidden />}
                  </span>
                  <span className="mt-4 block font-display text-4xl font-semibold text-plum">{t.value}</span>
                  <span className="mt-1 block text-sm text-mist">{t.label}</span>
                  {t.sub && <span className="block text-xs text-mist/80">{t.sub}</span>}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Card title="Recently updated sculptures" actions={<LinkButton href="/admin/sculptures" variant="ghost">View all</LinkButton>} padded={false}>
              {!data?.recent_sculptures.length ? (
                <EmptyState title="No sculptures yet" action={<LinkButton href="/admin/sculptures/new">Add the first one</LinkButton>} />
              ) : (
                <ul className="divide-y divide-gold/10">
                  {data.recent_sculptures.map((s) => (
                    <li key={s.id}>
                      <Link href={`/admin/sculptures/${s.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-lavender/30">
                        <Thumb media={s.cover} className="h-14 w-12 shrink-0 rounded" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-plum">{s.title}</span>
                          <span className="block text-xs text-mist">
                            {s.category?.name ?? "—"} · updated {formatDate(s.updated_at)}
                          </span>
                        </span>
                        <StatusBadge status={s.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="flex flex-col gap-6">
              <Card title="Quick actions">
                <div className="grid grid-cols-2 gap-3">
                  <LinkButton href="/admin/sculptures/new" variant="outline" icon={<FilePlus2 size={16} />}>
                    Add sculpture
                  </LinkButton>
                  <LinkButton href="/admin/categories?new=1" variant="outline" icon={<FolderPlus size={16} />}>
                    Add category
                  </LinkButton>
                  <LinkButton href="/admin/sections" variant="outline" icon={<LayoutTemplate size={16} />}>
                    Edit homepage
                  </LinkButton>
                  <LinkButton href="/admin/enquiries" variant="outline" icon={<Inbox size={16} />}>
                    View enquiries
                  </LinkButton>
                </div>
              </Card>
              <Card title={user?.role === "admin" ? "Recent activity" : "Your recent activity"} padded={false}>
                {!data?.recent_activity.length ? (
                  <EmptyState title="Nothing logged yet" />
                ) : (
                  <ul className="divide-y divide-gold/10 text-sm">
                    {data.recent_activity.map((a) => (
                      <li key={a.id} className="px-5 py-3">
                        <p className="text-plum">{a.description ?? a.action}</p>
                        <p className="text-xs text-mist">
                          {a.user?.name ?? "System"} · {formatDate(a.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}
