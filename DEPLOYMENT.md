# Deploying Devalok Sculptures (Hostinger)

Two parts:

| Part | What | Where |
|---|---|---|
| **API + CMS backend** | Laravel 12 app in `backend/` + MySQL | Hostinger (PHP hosting), e.g. `api.devaloksculptures.in` |
| **Website + admin UI** | Next.js 16 app (repo root) | Any Node 20+ host (Hostinger Node.js app, VPS, or Vercel), e.g. `devaloksculptures.in` |

Both should be on the **same parent domain** (`devaloksculptures.in` and `api.devaloksculptures.in`) so the admin session cookie works across them. Use **HTTPS everywhere**.

---

## 1. Backend (Laravel API)

### Requirements
- PHP **8.2+** with extensions: `bcmath ctype curl dom fileinfo gd (with WebP) json mbstring openssl pdo_mysql tokenizer xml zip`
- Composer 2
- MySQL 8 / MariaDB 10.4+

### Database
In hPanel → Databases, create a database and a **dedicated user** with privileges only on that database. Never use a root account in production.

### Upload and install
```bash
cd backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
```

Edit `.env` (never commit it):
```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.devaloksculptures.in

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=<your database>
DB_USERNAME=<dedicated user>
DB_PASSWORD=<strong password>

SESSION_DRIVER=database
SESSION_DOMAIN=.devaloksculptures.in
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

FRONTEND_URLS=https://devaloksculptures.in,https://www.devaloksculptures.in
SANCTUM_STATEFUL_DOMAINS=devaloksculptures.in,www.devaloksculptures.in

LOG_LEVEL=warning

# Instant website refresh after admin saves (same random value as REVALIDATE_SECRET on the frontend)
FRONTEND_REVALIDATE_URL=https://devaloksculptures.in/api/revalidate
FRONTEND_REVALIDATE_SECRET=<long random string>
```

### Web root
Point the (sub)domain's document root to **`backend/public`**, never to `backend/`. This keeps `.env`, `vendor/`, source code and `storage/` outside the web root. If hPanel can't change the root, place the project outside `public_html` and symlink `public_html` → `backend/public`.

### Migrate, seed, storage
```bash
php artisan migrate --force          # creates all tables (safe to re-run; never drops data)
php artisan db:seed --force          # first install only: imports the current site content (skips itself if content exists)
php artisan storage:link             # exposes storage/app/public at /storage
```
Writable directories: `storage/` and `bootstrap/cache/` (755 for directories, 644 for files; the PHP user must own them). `storage/app/public/.htaccess` blocks script execution in the uploads folder.

### First administrator
No admin account is ever seeded. Create one over SSH:
```bash
php artisan devalok:create-admin --email=you@devaloksculptures.in --name="Your Name"
# prompts for the password (min 12 chars, upper + lower case + a number)
```
Run the same command again to reset a forgotten password. Further users (Admin or Editor) are created in **Admin → Admin Users**.

### Optimise
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```
Re-run these after every deploy or `.env` change (`php artisan optimize:clear` first if needed).

---

## 2. Frontend (Next.js)

Environment variables (hosting panel or `.env.production`). These are **public** values only; no secrets go here:
```dotenv
NEXT_PUBLIC_API_BASE_URL=https://api.devaloksculptures.in/api/v1
NEXT_PUBLIC_SITE_URL=https://devaloksculptures.in
# Server-only secret (NOT NEXT_PUBLIC); must equal FRONTEND_REVALIDATE_SECRET in backend/.env
REVALIDATE_SECRET=<same long random string>
```
Build and run:
```bash
npm ci
npm run build      # the API must be reachable during build (pages are prerendered from it)
npm start          # or your host's Node process manager
```
`/storage/*` is proxied to the API by `next.config.ts`, so uploaded images load from the site's own origin.

Public pages are cached for 30 seconds. After every successful admin save, Laravel calls `POST /api/revalidate` on the website (server to server, protected by the shared secret), so changes appear on the next page load. Generate the secret with e.g. `php -r "echo bin2hex(random_bytes(32));"`.

---

## 3. Checklist
- [ ] HTTPS on both domains; HTTP redirects to HTTPS
- [ ] `APP_DEBUG=false`, `APP_ENV=production`
- [ ] Document root is `backend/public`
- [ ] Dedicated DB user, strong password
- [ ] `FRONTEND_URLS` / `SANCTUM_STATEFUL_DOMAINS` list only your real site origins
- [ ] `php artisan storage:link` done; `storage/` and `bootstrap/cache/` writable
- [ ] First admin created with `devalok:create-admin`
- [ ] Sign in at `https://devaloksculptures.in/admin`, upload an image, publish a sculpture, check it on the site
- [ ] Contact form submits and the enquiry appears in **Admin → Contact Enquiries**

Do not change DNS, production credentials or live data without the owner's approval.
