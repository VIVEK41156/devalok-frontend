"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/admin-api";
import { saveErrors } from "@/components/admin/useApi";
import { Button, Modal, SelectField, TextField, Toggle, useToast } from "@/components/admin/ui";

export type MenuLocation = "header" | "footer";

/** Mirrors MenuItemResource (admin view). */
export interface MenuItem {
  id: number;
  label: string;
  url: string;
  open_in_new_tab: boolean;
  location: MenuLocation;
  parent_id: number | null;
  sort_order: number;
  is_active: boolean;
  page_id: number | null;
}

export const LOCATION_LABEL: Record<MenuLocation, string> = { header: "Header", footer: "Footer" };

/** Full request body for POST/PUT — the API validates every field on update too. */
export function menuBody(item: MenuItem, patch: Partial<MenuItem> = {}) {
  const m = { ...item, ...patch };
  return {
    label: m.label,
    url: m.url,
    location: m.location,
    parent_id: m.parent_id ?? null,
    page_id: m.page_id ?? null,
    open_in_new_tab: !!m.open_in_new_tab,
    sort_order: m.sort_order ?? 0,
    is_active: !!m.is_active,
  };
}

export default function MenuForm({
  item,
  defaultLocation,
  items,
  onClose,
  onSaved,
}: {
  /** null = create a new item. */
  item: MenuItem | null;
  defaultLocation: MenuLocation;
  /** Every menu item (both locations) — used for the parent picker. */
  items: MenuItem[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const toast = useToast();
  const [label, setLabel] = useState(item?.label ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [location, setLocation] = useState<MenuLocation>(item?.location ?? defaultLocation);
  const [parentId, setParentId] = useState(item?.parent_id != null ? String(item.parent_id) : "");
  const [sortOrder, setSortOrder] = useState(() => {
    if (item) return String(item.sort_order);
    const roots = items.filter((i) => i.location === defaultLocation && i.parent_id === null);
    const max = roots.reduce((m, i) => Math.max(m, i.sort_order), 0);
    return String(Math.min(1000, roots.length ? max + 10 : 10));
  });
  const [newTab, setNewTab] = useState(item?.open_in_new_tab ?? false);
  const [active, setActive] = useState(item?.is_active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const hasChildren = !!item && items.some((i) => i.parent_id === item.id);
  // The public site renders two levels: top-level links and their sub-links.
  const parentOptions = items
    .filter((i) => i.location === location && i.parent_id === null && i.id !== item?.id)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    const local: Record<string, string> = {};
    if (!label.trim()) local.label = "Please enter a label.";
    if (!url.trim()) local.url = "Please enter a link.";
    const order = sortOrder.trim() === "" ? 0 : Number(sortOrder);
    if (!Number.isInteger(order) || order < 0 || order > 1000) local.sort_order = "Use a whole number between 0 and 1000.";
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    const body = {
      label: label.trim(),
      url: url.trim(),
      location,
      parent_id: parentId ? Number(parentId) : null,
      page_id: item?.page_id ?? null,
      open_in_new_tab: newTab,
      sort_order: order,
      is_active: active,
    };
    setSaving(true);
    try {
      if (item) await api.put(`/admin/menu-items/${item.id}`, body);
      else await api.post("/admin/menu-items", body);
      onSaved(item ? `Updated “${body.label}”.` : `Added “${body.label}”.`);
    } catch (err) {
      const { fields, message } = saveErrors(err);
      setErrors(fields);
      toast({ tone: "error", message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? "Edit menu item" : "Add menu item"}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="menu-item-form" loading={saving}>
            {item ? "Save changes" : "Add item"}
          </Button>
        </>
      }
    >
      <form id="menu-item-form" onSubmit={submit} noValidate className="space-y-4">
        <TextField label="Label" required maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} error={errors.label} placeholder="e.g. Gallery" />
        <TextField
          label="Link"
          required
          maxLength={500}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={errors.url}
          placeholder="/gallery"
          hint="A site path such as /gallery or /products#marble, an #anchor, or a full https://, mailto: or tel: link."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Menu"
            value={location}
            error={errors.location}
            onChange={(e) => {
              setLocation(e.target.value as MenuLocation);
              setParentId("");
            }}
          >
            <option value="header">Header</option>
            <option value="footer">Footer</option>
          </SelectField>
          <TextField
            label="Sort order"
            type="number"
            inputMode="numeric"
            min={0}
            max={1000}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            error={errors.sort_order}
            hint="Lower numbers appear first."
          />
        </div>
        <SelectField
          label="Parent item"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          error={errors.parent_id}
          disabled={hasChildren}
          hint={hasChildren ? "This item has sub-items, so it must stay at the top level." : "Choose a parent to show this link as a sub-item."}
        >
          <option value="">None (top level)</option>
          {parentOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </SelectField>
        <div className="space-y-3 rounded-lg border border-gold/20 bg-white p-4">
          <Toggle label="Visible on the website" checked={active} onChange={setActive} hint="Hidden items stay saved but are not shown." />
          <Toggle label="Open in a new tab" checked={newTab} onChange={setNewTab} hint="Useful for links to other websites." />
        </div>
      </form>
    </Modal>
  );
}
