# Home Tracker

A lightweight, mobile-first shared household shopping list driven by NFC tags.
Stick NFC tags behind cupboard doors. Tap → item lands on the shared list instantly.

## Features

- `/add?item=<slug>` — NFC tag destination: shows item name, quantity picker, one-tap add
- `/list` — shared shopping list with mark-as-bought + undo
- `/quick-add` — free-text add with autocomplete
- `/manage` — CRUD for known items; shows the exact NFC URL to write to each tag
- PWA-ready: add `/list` to your home screen for an app-like experience
- Data stored in [Netlify Blobs](https://docs.netlify.com/blobs/overview/) — no external database needed

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| API | Next.js Route Handlers (serverless via Netlify) |
| Storage | Netlify Blobs |
| Hosting | Netlify |

## Local Development

### Prerequisites

- Node.js 18+
- [Netlify CLI](https://docs.netlify.com/cli/get-started/): `npm install -g netlify-cli`

### Setup

```bash
# Install dependencies
npm install

# Copy env template
cp .env.example .env.local

# Log in to Netlify and link your site (required for Blobs to work locally)
netlify login
netlify link   # select or create your site

# Start dev server (uses `netlify dev` to emulate the full Netlify environment)
npm run dev
```

Open [http://localhost:8888](http://localhost:8888).

> **Why `netlify dev`?** Netlify Blobs requires the Netlify runtime context to work. Running
> `netlify dev` injects this automatically. Plain `next dev` will fail when the API routes
> try to access Blobs.

### Seed sample data

After the dev server is running, hit the seed endpoint once:

```bash
curl -X POST http://localhost:8888/api/seed
```

Or click **"Seed defaults"** on the `/manage` page.

## Deployment to Netlify

### First deploy (new site)

```bash
# Build and deploy
netlify deploy --build --prod
```

Netlify will ask you to create or link a site on first run.

### Via GitHub (recommended for ongoing deploys)

1. Push this repo to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
3. Select your repo
4. Build settings are picked up from `netlify.toml` automatically
5. Click **Deploy**

Every push to `main` triggers a new deploy automatically.

### Environment variables

No environment variables are required for production — Netlify Blobs is zero-config on Netlify.

For local dev outside of `netlify dev`, you can set:

```
NETLIFY_SITE_ID=your-site-id
NETLIFY_AUTH_TOKEN=your-personal-access-token
NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app
```

`NEXT_PUBLIC_SITE_URL` is used to build the NFC URLs shown on the `/manage` page.

## Writing NFC Tags

1. Open `/manage` on your deployed site
2. Find the item you want (or add it)
3. Copy the URL shown (e.g. `https://your-site.netlify.app/add?item=milk`)
4. Use any NFC writing app (e.g. **NFC Tools** on Android/iOS) to write that URL to a tag
5. Stick the tag inside the cupboard that holds that item

### Example NFC URLs

```
https://your-site.netlify.app/add?item=milk
https://your-site.netlify.app/add?item=eggs
https://your-site.netlify.app/add?item=olive-oil
https://your-site.netlify.app/add?item=coffee
https://your-site.netlify.app/add?item=pasta
https://your-site.netlify.app/add?item=rice
https://your-site.netlify.app/add?item=bin-bags
https://your-site.netlify.app/add?item=dishwasher-tablets
https://your-site.netlify.app/add?item=kitchen-roll
```

## Adding Auth Later

The MVP has no authentication — suitable for a trusted household. To add a lightweight PIN:

1. Add a `PIN` environment variable in Netlify
2. Wrap the API routes with a middleware check (`middleware.ts`) that validates a cookie
3. Add a `/login` page that sets the cookie on correct PIN entry
4. All existing routes stay unchanged

For full multi-user auth, drop in [NextAuth.js](https://next-auth.js.org/).

## Project Structure

```
app/
  add/page.tsx          # NFC tap destination
  list/page.tsx         # Shared shopping list
  quick-add/page.tsx    # Free-text add
  manage/page.tsx       # Manage known items
  api/
    items/route.ts      # Known items CRUD
    items/[id]/route.ts
    list/route.ts       # Shopping list CRUD
    list/[id]/route.ts
    seed/route.ts       # Seed sample data
components/
  Nav.tsx               # Bottom navigation bar
lib/
  store.ts              # Netlify Blobs wrapper
  types.ts              # Shared TypeScript types
  seed.ts               # Default household items
```
