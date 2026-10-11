# Devalok Sculptures — Website + CMS

Premium gallery website for [devaloksculptures.in](https://devaloksculptures.in) (a showcase and enquiry site, not a shop) with a secure content-management system.

| Part | Stack | Folder |
|---|---|---|
| Public website + admin UI | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · GSAP · Framer Motion · Lucide | repo root (`src/`) |
| API + CMS backend | Laravel 12 · Sanctum (SPA cookie auth) · MySQL/MariaDB | `backend/` |

Deployment: see **[DEPLOYMENT.md](DEPLOYMENT.md)** (Hostinger).

## Run locally

**Backend** (needs PHP 8.2+, Composer, MySQL/MariaDB):
```bash
cd backend
composer install
cp .env.example .env && php artisan key:generate   # then set DB_* in .env
php artisan migrate
php artisan db:seed            # imports the current site content (no user accounts)
php artisan storage:link
php artisan devalok:create-admin     # prompts for email, name and password
php artisan serve --port=8125
```

**Frontend**:
```bash
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL=http://localhost:8125/api/v1, NEXT_PUBLIC_SITE_URL=http://localhost:3210
npm install
npm run dev -- -p 3210         # site: http://localhost:3210  ·  admin: http://localhost:3210/admin
```
For local cookie auth, the backend's `.env` must have `FRONTEND_URLS=http://localhost:3210` and `SANCTUM_STATEFUL_DOMAINS=localhost:3210`.

**Tests / checks**
```bash
cd backend && php artisan test          # 24 feature tests: auth, roles, CRUD, uploads, drafts, contact, CORS-safe URLs
npx tsc --noEmit && npx eslint src && npm run build
```

## Public website

| Route | Content (all from the CMS) |
|---|---|
| `/` | Sections managed in **Homepage Sections** (order + visibility): hero collection presentation, brand intro, collections, 3D Hall of Devotion, signature grid, craft story, gallery preview, values, enquiry banner. Featured sculptures fill the hero, hall and grid. |
| `/products` | Published categories with their published sculptures |
| `/gallery` | Featured spotlight + filterable collection (`?category=<slug>`) |
| `/about` | About page intro/content, values, vision & mission |
| `/contact` | Contact details from Site Settings; the form stores enquiries via the API |

Drafts, unpublished categories and private settings never leave the API. Public data is fetched once per render from `GET /api/v1/site`, cached ~1 minute (tag `cms`) and refreshed immediately when an admin saves (`src/app/admin/actions.ts`, which verifies the admin session first).

## Admin panel (`/admin`)

Dashboard (live stats) · Sculptures · Categories · Gallery & Media · Website Pages · Homepage Sections · Navigation Menus · Site Settings* · Contact Enquiries · SEO Settings · Admin Users* · Activity Logs*  (*admin role only, enforced by the API)

- Roles: **Admin** (everything) and **Editor** (content only). Permissions are checked by Laravel on every request; the UI only hides what a role can't use.
- Images: JPEG/PNG/WebP only, ≤ 8 MB, content-sniffed and re-encoded with GD (strips metadata and payloads), resized to ≤ 2400 px, random file names, stored via Laravel Storage. Images in use can't be deleted.

## What each admin screen changes on the website

Every save is live on the next page load (Laravel tells the website to refresh; visitors' browsers re-check at least every 30 s).

| Admin screen | Operation | Where it appears |
|---|---|---|
| Sculptures | Add / edit / delete, publish ↔ draft, featured, order, images, details, credits | Gallery, Products, home gallery preview, sculpture viewer. **Featured** pieces fill the home hero, 3D hall and signature grid. Drafts disappear everywhere. |
| Categories | Add / edit / delete (with reassignment), publish, reorder, cover, tagline, description | Products page sections, header Products dropdown, top bar badges, home collections panels and hero slides, gallery filters, footer |
| Gallery & Media | Upload, alt text, caption, replace file, delete unused | Wherever the image is used (alt text is used by screen readers and search engines) |
| Website Pages | Title, intro, main content, featured image, SEO, social image | Page headers (Products, Gallery, About, Contact), About text, browser titles and search snippets |
| Homepage Sections | Eyebrow, heading + gold accent, description, button, image*, visibility, order | The matching homepage section; hidden sections are removed; order changes the homepage order. *Images are used by Introduction and Enquiry banner. |
| Navigation Menus | Add / edit / delete / reorder / hide items | Header (desktop + mobile) and footer links |
| Site Settings | Logo, favicon, contact details, WhatsApp, social links, footer text, vision/mission, SEO defaults | Footer, Contact page, top bar icons, browser tab icon, About/home vision & mission, default SEO |
| Contact Enquiries | View, change status, delete | Admin only (submissions come from the website's Contact form) |
| Reviews | Add / edit / delete, stars, photo, publish, order, sample flag | Animated “Kind words” section on the homepage (below Our values); average rating is calculated automatically |
| SMTP / Email (admin) | Mail address + app password → **Configure** sends a test email | Every contact-form enquiry is emailed to the configured recipient(s) with Reply-To set to the visitor |
| SEO Settings | Overview of missing titles/descriptions | Links to the page/category/sculpture editors |
| Admin Users / Activity Logs | Accounts, roles, audit trail | Admin only |

Not editable by design: the header uses the horizontal logo lockup (`public/images/brand/logo-horizontal.png`); the Settings logo is used in the footer. Sculpture SEO fields are stored for future individual sculpture pages (today sculptures open in the viewer, not on their own URL).

## Code map

- `backend/app/Http/Controllers/Api/V1/` — public API, auth, and `Admin/*` CRUD controllers
- `backend/routes/api.php` — all endpoints (`/api/v1/...`)
- `backend/database/migrations/` — schema; `backend/database/seeders/CmsSeeder.php` + `data/catalog.json` + `assets/` — initial content
- `src/lib/cms.ts` — server-side, cached CMS fetch + mapping to frontend types
- `src/lib/admin-api.ts` — browser API client for the admin (CSRF, errors, types)
- `src/components/admin/` — admin shell, UI kit, media picker, forms
- `src/components/motion/RevealScope.tsx` — scroll reveals (`data-reveal="up|fade|mask|rise3d|words"`)

## Content to confirm with the client

- **Marble uses reference images**: openly licensed museum photographs, badged "Reference image" and credited. Replace them with Devalok's own work (edit the sculpture, swap images, clear the credit fields).
- Material/finish for Hoysala-style Venugopala, Seated Radha Krishna, Panchamukha Ganapati and Sri Venkateswara was inferred from photos.
- Eight pieces use small crops of the old site's banners; upload original photos.
- WhatsApp and social links are empty until verified values are entered in Site Settings.
- Contact enquiries are always stored in the CMS and, once **Admin → SMTP / Email** is configured, also emailed to the business.
- The six reviews are **samples** (tagged “Sample” on the site); replace them with real client reviews before launch.
