"use client";

import { useEffect, useState } from "react";
import { Filter, X } from "lucide-react";
import { api, type Paginated } from "@/lib/admin-api";
import { useApi } from "@/components/admin/useApi";
import { useAuth } from "@/components/admin/AuthProvider";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, Pagination, formatDate } from "@/components/admin/ui";

/** Mirrors ActivityLogResource. */
interface ActivityLog {
  id: number;
  action: string;
  subject_type: string | null;
  subject_id: number | null;
  description: string | null;
  user: { id: number; name: string } | null;
  created_at: string | null;
}

type Tone = "neutral" | "success" | "warning" | "gold" | "info" | "danger";

const PER_PAGE = 30;
const QUICK_FILTERS = ["auth", "sculpture", "category", "media", "page", "menu", "enquiry", "settings", "user"];

function toneFor(action: string): Tone {
  if (action.endsWith(".deleted")) return "danger";
  if (action.endsWith(".created") || action.endsWith(".uploaded")) return "success";
  if (action.startsWith("auth.")) return "neutral";
  if (action.startsWith("settings.") || action.startsWith("user.")) return "gold";
  return "info";
}

/** "App\\Models\\Sculpture" → "Sculpture". */
function subjectLabel(log: ActivityLog) {
  if (!log.subject_type) return null;
  const base = log.subject_type.split("\\").pop() ?? log.subject_type;
  return log.subject_id ? `${base} #${log.subject_id}` : base;
}

export default function ActivityPage() {
  const { user } = useAuth();
  if (!user) return <LoadingState />;
  if (user.role !== "admin") {
    return (
      <>
        <PageHeader title="Activity Logs" />
        <Card>
          <EmptyState title="Administrators only" description="The activity log is limited to administrators. Ask an administrator if you need to review recent changes." />
        </Card>
      </>
    );
  }
  return <ActivityLogList />;
}

function ActivityLogList() {
  const [input, setInput] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);

  // Debounce typing before hitting the API.
  useEffect(() => {
    const next = input.trim().toLowerCase();
    if (next === action) return;
    const t = setTimeout(() => {
      setAction(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [input, action]);

  const { data, error, loading, reload } = useApi(() => api.get<Paginated<ActivityLog>>("/admin/activity-logs", { action, page, per_page: PER_PAGE }), [action, page]);
  const rows = data?.data ?? [];

  const applyNow = (value: string) => {
    setInput(value);
    setAction(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader title="Activity Logs" description="A record of sign-ins and every change made in the CMS, newest first. Use it to see who changed what and when." />

      <Card padded={false}>
        <div className="space-y-3 border-b border-gold/15 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative flex-1 sm:max-w-sm">
              <span className="sr-only">Filter by action</span>
              <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
              <input
                type="search"
                value={input}
                maxLength={60}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Filter by action, e.g. sculpture or auth.login"
                className="w-full rounded-md border border-plum/20 bg-white py-2.5 pl-9 pr-3 text-sm text-plum outline-none transition placeholder:text-mist/70 focus:border-gold focus:ring-2 focus:ring-gold/25"
              />
            </label>
            {action && (
              <Button variant="ghost" icon={<X size={16} />} onClick={() => applyNow("")}>
                Clear filter
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick filters">
            {QUICK_FILTERS.map((f) => {
              const active = action === f;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={active}
                  onClick={() => applyNow(active ? "" : f)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${active ? "bg-lavender text-plum ring-1 ring-inset ring-lilac" : "bg-plum/5 text-plum/70 hover:bg-lavender/60 hover:text-plum"}`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {loading && !data ? (
          <LoadingState label="Loading activity…" />
        ) : error ? (
          <div className="p-5">
            <ErrorState message={error} onRetry={reload} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title={action ? "No matching activity" : "No activity yet"}
            description={action ? `Nothing recorded with an action starting “${action}”.` : "Sign-ins and changes will be recorded here."}
            action={
              action ? (
                <Button variant="outline" onClick={() => applyNow("")}>
                  Clear filter
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-gold/15 text-xs uppercase tracking-wider text-mist">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Time
                    </th>
                    <th scope="col" className="px-3 py-3 font-semibold">
                      User
                    </th>
                    <th scope="col" className="px-3 py-3 font-semibold">
                      Action
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {rows.map((log) => {
                    const subject = subjectLabel(log);
                    return (
                      <tr key={log.id} className="align-top">
                        <td className="whitespace-nowrap px-5 py-3 text-plum/70">{formatDate(log.created_at)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-plum">{log.user?.name ?? <span className="italic text-mist">System / removed user</span>}</td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <Badge tone={toneFor(log.action)}>{log.action}</Badge>
                        </td>
                        <td className="px-5 py-3 text-plum/85">
                          <span className="break-words">{log.description || <span className="text-mist">—</span>}</span>
                          {subject && <span className="mt-0.5 block text-xs text-mist">{subject}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data && <Pagination meta={data.meta} onPage={setPage} />}
          </>
        )}
      </Card>
    </>
  );
}
