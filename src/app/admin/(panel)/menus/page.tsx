"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CornerDownRight, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/admin-api";
import { saveErrors, useApi } from "@/components/admin/useApi";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, Toggle, useConfirm, useToast } from "@/components/admin/ui";
import { refreshPublicSite } from "@/app/admin/actions";
import MenuForm, { LOCATION_LABEL, menuBody, type MenuItem, type MenuLocation } from "./MenuForm";

interface Row {
  item: MenuItem;
  depth: number;
  siblings: MenuItem[];
  index: number;
}

const byOrder = (a: MenuItem, b: MenuItem) => a.sort_order - b.sort_order || a.id - b.id;

/** Flattens one location's items into display order: each parent followed by its children. */
function buildRows(items: MenuItem[]): Row[] {
  const ids = new Set(items.map((i) => i.id));
  const rows: Row[] = [];
  const seen = new Set<number>();
  const walk = (list: MenuItem[], depth: number) => {
    list.forEach((item, index) => {
      if (seen.has(item.id)) return;
      seen.add(item.id);
      rows.push({ item, depth, siblings: list, index });
      const kids = items.filter((c) => c.parent_id === item.id).sort(byOrder);
      if (kids.length) walk(kids, depth + 1);
    });
  };
  // Items whose parent lives in the other menu are shown at the top level here.
  walk(items.filter((i) => i.parent_id === null || !ids.has(i.parent_id)).sort(byOrder), 0);
  return rows;
}

function firstError(e: unknown) {
  const { fields, message } = saveErrors(e);
  return Object.values(fields)[0] ?? message;
}

async function refreshSite() {
  try {
    await refreshPublicSite();
  } catch {
    // The public cache still expires on its own.
  }
}

export default function MenusPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const [location, setLocation] = useState<MenuLocation>("header");
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  // Both menus load together so the parent picker and tab counts cover everything.
  const { data, error, loading, reload } = useApi(() => api.get<{ data: MenuItem[] }>("/admin/menu-items"), []);
  const all = useMemo(() => data?.data ?? [], [data]);
  const rows = useMemo(() => buildRows(all.filter((i) => i.location === location)), [all, location]);
  const counts = useMemo(() => ({ header: all.filter((i) => i.location === "header").length, footer: all.filter((i) => i.location === "footer").length }), [all]);

  const closeForm = useCallback(() => setEditing(null), []);

  const afterChange = async (message: string) => {
    toast({ tone: "success", message });
    await reload();
    await refreshSite();
  };

  const onSaved = async (message: string) => {
    setEditing(null);
    await afterChange(message);
  };

  const move = async (row: Row, dir: -1 | 1) => {
    const j = row.index + dir;
    if (j < 0 || j >= row.siblings.length) return;
    const list = [...row.siblings];
    const a = list[row.index];
    const b = list[j];
    let updates: [MenuItem, number][];
    const unique = new Set(list.map((i) => i.sort_order)).size === list.length;
    if (unique) {
      updates = [
        [a, b.sort_order],
        [b, a.sort_order],
      ];
    } else {
      // Duplicate sort orders: renumber this group so the swap is unambiguous.
      list[row.index] = b;
      list[j] = a;
      const step = list.length * 10 <= 1000 ? 10 : 1;
      updates = list.map((it, k): [MenuItem, number] => [it, k * step]).filter(([it, order]) => it.sort_order !== order);
    }
    setBusy(true);
    try {
      await Promise.all(updates.map(([it, order]) => api.put(`/admin/menu-items/${it.id}`, menuBody(it, { sort_order: order }))));
      await afterChange(`Moved “${a.label}” ${dir < 0 ? "up" : "down"}.`);
    } catch (e) {
      toast({ tone: "error", message: firstError(e) });
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (item: MenuItem, next: boolean) => {
    setBusy(true);
    try {
      await api.put(`/admin/menu-items/${item.id}`, menuBody(item, { is_active: next }));
      await afterChange(next ? `“${item.label}” is now visible.` : `“${item.label}” is now hidden.`);
    } catch (e) {
      toast({ tone: "error", message: firstError(e) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: MenuItem) => {
    const kids = all.filter((i) => i.parent_id === item.id).length;
    const ok = await confirm({
      title: "Delete menu item?",
      message: (
        <>
          “{item.label}” will be removed from the {LOCATION_LABEL[item.location].toLowerCase()} menu.
          {kids > 0 && (
            <strong className="mt-2 block text-red-800">
              Its {kids} sub-item{kids === 1 ? "" : "s"} will be deleted too.
            </strong>
          )}
        </>
      ),
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.del(`/admin/menu-items/${item.id}`);
      await afterChange(`Removed “${item.label}”.`);
    } catch (e) {
      toast({ tone: "error", message: firstError(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Navigation Menus"
        description="Edit the links in the website header and footer. The primary navigation is Home, About Us, Products, Gallery, Contact Us. Changes go live as soon as you save."
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setEditing("new")} disabled={loading && !data}>
            Add menu item
          </Button>
        }
      />

      <Card padded={false}>
        <div role="tablist" aria-label="Menu location" className="flex gap-1 border-b border-gold/15 px-3 pt-3">
          {(["header", "footer"] as const).map((loc) => {
            const selected = loc === location;
            return (
              <button
                key={loc}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setLocation(loc)}
                className={`-mb-px flex items-center gap-2 rounded-t-md border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${selected ? "border-gold bg-lavender/70 text-plum" : "border-transparent text-plum/60 hover:bg-lavender/40 hover:text-plum"}`}
              >
                {LOCATION_LABEL[loc]} menu
                {data && <span className="rounded-full bg-white/80 px-2 text-xs text-mist ring-1 ring-plum/10">{counts[loc]}</span>}
              </button>
            );
          })}
        </div>

        {loading && !data ? (
          <LoadingState label="Loading menus…" />
        ) : error && !data ? (
          <div className="p-5">
            <ErrorState message={error} onRetry={reload} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title={`The ${LOCATION_LABEL[location].toLowerCase()} menu is empty`}
            description="Add links such as Home, About Us, Products, Gallery and Contact Us."
            action={
              <Button icon={<Plus size={16} />} onClick={() => setEditing("new")}>
                Add menu item
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-gold/15 text-xs uppercase tracking-wider text-mist">
                <tr>
                  <th scope="col" className="w-24 px-5 py-3 font-semibold">
                    Order
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Label
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Link
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Visibility
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {rows.map((row) => {
                  const { item, depth } = row;
                  return (
                    <tr key={item.id} className={`align-middle ${item.is_active ? "" : "bg-parchment/40"}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            aria-label={`Move ${item.label} up`}
                            disabled={busy || row.index === 0}
                            onClick={() => move(row, -1)}
                            className="rounded-md p-1.5 text-plum/60 hover:bg-lavender hover:text-plum disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Move ${item.label} down`}
                            disabled={busy || row.index === row.siblings.length - 1}
                            onClick={() => move(row, 1)}
                            className="rounded-md p-1.5 text-plum/60 hover:bg-lavender hover:text-plum disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2" style={{ paddingLeft: `${Math.min(depth, 3) * 1.5}rem` }}>
                          {depth > 0 && <CornerDownRight size={14} className="shrink-0 text-gold" aria-hidden />}
                          <span className={`font-semibold ${depth === 0 ? "text-plum" : "text-plum/85"}`}>{item.label}</span>
                          {depth > 0 && <Badge>Sub-item</Badge>}
                          {depth > 1 && <Badge tone="warning">Too deep to display</Badge>}
                          {item.open_in_new_tab && (
                            <span title="Opens in a new tab" className="text-mist">
                              <ExternalLink size={13} aria-label="Opens in a new tab" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="max-w-[260px] px-3 py-3">
                        <code className="block truncate rounded bg-parchment/70 px-2 py-0.5 text-xs text-plum/80" title={item.url}>
                          {item.url}
                        </code>
                      </td>
                      <td className="px-3 py-3">
                        <Toggle label={item.is_active ? "Visible" : "Hidden"} checked={item.is_active} onChange={(v) => !busy && toggleActive(item, v)} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" className="px-2.5 py-2" aria-label={`Edit ${item.label}`} icon={<Pencil size={15} />} onClick={() => setEditing(item)} disabled={busy} />
                          <Button
                            variant="ghost"
                            className="px-2.5 py-2 text-red-700 hover:bg-red-50 hover:text-red-800"
                            aria-label={`Delete ${item.label}`}
                            icon={<Trash2 size={15} />}
                            onClick={() => remove(item)}
                            disabled={busy}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <MenuForm
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? null : editing}
          defaultLocation={location}
          items={all}
          onClose={closeForm}
          onSaved={onSaved}
        />
      )}
    </>
  );
}
