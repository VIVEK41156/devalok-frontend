"use client";

// Browser-side client for the Laravel admin API (Sanctum SPA cookie auth).
// Flow: GET /sanctum/csrf-cookie sets XSRF-TOKEN; every mutating request echoes
// it in X-XSRF-TOKEN. Session cookies are HttpOnly and never touched by JS.

import { API_BASE_URL, API_ORIGIN } from "./api-config";

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;
  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
  /** First message for a field, e.g. err.field("title"). */
  field(name: string): string | undefined {
    return this.errors[name]?.[0];
  }
}

export interface Paginated<T> {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
}

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

let csrfReady: Promise<void> | null = null;
export function ensureCsrf(force = false): Promise<void> {
  if (!csrfReady || force) {
    csrfReady = fetch(`${API_ORIGIN}/sanctum/csrf-cookie`, { credentials: "include" }).then(() => undefined);
  }
  return csrfReady;
}

type Query = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}

/** Called on 401 so the admin shell can send the user back to the login screen. */
let onUnauthenticated: (() => void) | null = null;
export function setUnauthenticatedHandler(fn: (() => void) | null) {
  onUnauthenticated = fn;
}

async function request<T>(method: string, path: string, opts: { query?: Query; body?: unknown; form?: FormData; retry?: boolean } = {}): Promise<T> {
  const mutating = method !== "GET";
  if (mutating) await ensureCsrf();
  const headers: Record<string, string> = { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" };
  const xsrf = readCookie("XSRF-TOKEN");
  if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), { method, headers, body, credentials: "include" });
  } catch {
    throw new ApiError(0, "Could not reach the server. Check that the API is running and try again.");
  }

  // Expired CSRF token: refresh once and retry.
  if (res.status === 419 && opts.retry !== false) {
    await ensureCsrf(true);
    return request<T>(method, path, { ...opts, retry: false });
  }
  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== "/admin/login") onUnauthenticated?.();
    const message =
      res.status === 403
        ? "You don't have permission to do that."
        : res.status === 429
          ? json.message || "Too many attempts. Please wait a moment."
          : json.message || `Request failed (${res.status}).`;
    throw new ApiError(res.status, message, json.errors ?? {});
  }
  return json as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  del: <T>(path: string, body?: unknown) => request<T>("DELETE", path, { body }),
  upload: <T>(path: string, form: FormData) => request<T>("POST", path, { form }),
};

// ── Shared admin types (mirror the Laravel resources) ──────────────────────
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor";
  is_active: boolean;
  last_login_at: string | null;
  created_at: string | null;
}

export interface Media {
  id: number;
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  caption: string | null;
  title?: string | null;
  original_name?: string;
  mime?: string;
  size?: number;
  created_at?: string;
  usage?: { type: string; id: number | null; label: string | null }[];
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  short_name: string;
  tagline: string | null;
  description: string | null;
  parent_id: number | null;
  cover: Media | null;
  cover_media_id: number | null;
  sort_order: number;
  is_published: boolean;
  seo_title: string | null;
  seo_description: string | null;
  sculptures_count?: number;
  updated_at?: string;
}

export interface DetailView {
  label: string;
  x: number;
  y: number;
  zoom: number;
}

export interface Sculpture {
  id: number;
  slug: string;
  title: string;
  category: { id: number; slug: string; name: string } | null;
  category_id: number;
  subject: string | null;
  short_description: string | null;
  description: string | null;
  materials: string | null;
  dimensions: string | null;
  weight: string | null;
  craftsmanship: string | null;
  cover: Media | null;
  cutout: Media | null;
  gallery: Media[];
  cover_media_id: number | null;
  cutout_media_id: number | null;
  gallery_media_ids: number[];
  detail_views: DetailView[];
  reference_credit: string | null;
  reference_license: string | null;
  reference_url: string | null;
  is_featured: boolean;
  status: "draft" | "published";
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string | null;
  created_at: string | null;
}

export interface PageSection {
  id: number;
  key: string;
  label: string | null;
  eyebrow: string | null;
  heading: string | null;
  heading_accent: string | null;
  description: string | null;
  image: Media | null;
  media_id: number | null;
  cta_label: string | null;
  cta_url: string | null;
  is_visible: boolean;
  sort_order: number;
}

export interface Page {
  id: number;
  slug: string;
  title: string;
  intro: string | null;
  content: string | null;
  status: "draft" | "published";
  featured_image?: Media | null;
  featured_media_id: number | null;
  og_media_id: number | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  seo?: { og_image: Media | null };
  sections: PageSection[] | null;
  updated_at: string | null;
}
