"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api, type Paginated } from "@/lib/admin-api";
import { useApi } from "@/components/admin/useApi";
import { Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, Pagination, StatusBadge, formatDate } from "@/components/admin/ui";
import EnquiryDetail, { STATUS_OPTIONS, type Enquiry, type EnquiryStatus } from "./EnquiryDetail";

const PER_PAGE = 20;

export default function EnquiriesPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<EnquiryStatus | "">("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Enquiry | null>(null);

  // Debounce typing before hitting the API.
  useEffect(() => {
    const next = search.trim();
    if (next === query) return;
    const t = setTimeout(() => {
      setQuery(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search, query]);

  const { data, error, loading, reload, setData } = useApi(
    () => api.get<Paginated<Enquiry>>("/admin/enquiries", { search: query, status, page, per_page: PER_PAGE }),
    [query, status, page],
  );

  const closeDetail = useCallback(() => setSelected(null), []);

  const onUpdated = useCallback(
    (e: Enquiry) => {
      setSelected(e);
      setData((d) => (d ? { ...d, data: d.data.map((x) => (x.id === e.id ? e : x)) } : d));
    },
    [setData],
  );

  const onDeleted = useCallback(
    (id: number) => {
      setSelected(null);
      // Step back a page if we just emptied the last one.
      const emptiedPage = !!data && data.data.length === 1 && page > 1;
      setData((d) => (d ? { ...d, data: d.data.filter((x) => x.id !== id) } : d));
      if (emptiedPage) setPage((p) => p - 1);
      else void reload();
    },
    [data, page, reload, setData],
  );

  const filtered = !!query || !!status;
  const rows = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Contact Enquiries"
        description="Messages sent through the website contact form. Enquiries are stored here only — no email is sent automatically, so reply from your own mailbox."
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-gold/15 p-4 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search enquiries</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
            <input
              type="search"
              value={search}
              maxLength={100}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or subject"
              className="w-full rounded-md border border-plum/20 bg-white py-2.5 pl-9 pr-3 text-sm text-plum outline-none transition placeholder:text-mist/70 focus:border-gold focus:ring-2 focus:ring-gold/25"
            />
          </label>
          <label className="sm:w-52">
            <span className="sr-only">Filter by status</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as EnquiryStatus | "");
                setPage(1);
              }}
              className="w-full rounded-md border border-plum/20 bg-white px-3 py-2.5 text-sm text-plum outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/25"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && !data ? (
          <LoadingState label="Loading enquiries…" />
        ) : error ? (
          <div className="p-5">
            <ErrorState message={error} onRetry={reload} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title={filtered ? "No matching enquiries" : "No enquiries yet"}
            description={filtered ? "Try a different search or status filter." : "Messages from the website contact form will appear here."}
            action={
              filtered ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setQuery("");
                    setStatus("");
                    setPage(1);
                  }}
                >
                  Clear filters
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
                      Received
                    </th>
                    <th scope="col" className="px-3 py-3 font-semibold">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3 font-semibold">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3 font-semibold">
                      Subject
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {rows.map((e) => (
                    <tr
                      key={e.id}
                      tabIndex={0}
                      onClick={() => setSelected(e)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          setSelected(e);
                        }
                      }}
                      className={`cursor-pointer outline-none transition-colors hover:bg-lavender/40 focus-visible:bg-lavender/50 ${e.status === "new" ? "font-semibold" : ""}`}
                    >
                      <td className="whitespace-nowrap px-5 py-3 text-plum/70">{formatDate(e.created_at)}</td>
                      <td className="px-3 py-3 text-plum">{e.name}</td>
                      <td className="max-w-[220px] truncate px-3 py-3 text-plum/80">{e.email}</td>
                      <td className="max-w-[280px] px-3 py-3 text-plum/80">
                        <span className="block truncate">{e.subject?.trim() || <span className="italic text-mist">(No subject)</span>}</span>
                        {e.sculpture && <span className="block truncate text-xs font-normal text-mist">About {e.sculpture.title}</span>}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={e.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && <Pagination meta={data.meta} onPage={setPage} />}
          </>
        )}
      </Card>

      {selected && <EnquiryDetail key={selected.id} enquiry={selected} onClose={closeDetail} onUpdated={onUpdated} onDeleted={onDeleted} />}
    </>
  );
}
