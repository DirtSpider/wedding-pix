# Wedding Pix — Guest Photo Sharing App

A full-stack wedding photo-sharing app where guests upload photos/videos via QR code, browse a live gallery, and watch an auto-playing slideshow. No app download required — everything works in the browser.

## Features

- **QR Code Generation** — Display a QR code at tables; guests scan to open the upload page
- **Photo/Video Upload** — Drag-and-drop or file picker; supports JPG, PNG, WebP, HEIC, MP4, MOV (up to 100MB)
- **Live Gallery** — Masonry-layout gallery with lightbox view; auto-refreshes every 15 seconds
- **Slideshow** — Fullscreen auto-rotating slideshow with keyboard controls (arrow keys, F for fullscreen, Esc to exit)
- **Admin Dashboard** — Password-protected moderation page to approve/hide/delete photos
- **Guest Names & Captions** — Optional name and caption with each upload

## Architecture

```
wedding-pix/
├── app/                    # Next.js App Router pages (production frontend)
│   ├── page.tsx            # Landing page with QR code
│   ├── upload/page.tsx     # Guest upload page (drag-drop)
│   ├── gallery/page.tsx    # Masonry gallery with lightbox
│   ├── slideshow/page.tsx  # Fullscreen auto-rotating slideshow
│   └── admin/page.tsx      # Password-protected moderation dashboard
├── lib/
│   ├── api.ts              # API base URL configuration
│   └── storage.ts          # Storage adapter (local filesystem, swappable to S3/Vercel Blob)
├── api-server.ts           # Express API server (upload, list, moderate, delete)
├── preview/
│   └── index.html          # Vanilla JS version (works in restricted preview environments)
├── fix-paths.ts            # Post-build script to fix asset paths for sub-path deployment
├── next.config.ts          # Next.js config (static export)
└── .env.local              # Environment variables (admin password)
```

## Quick Start (Local Development)

### 1. Start the API server

```bash
cd wedding-pix
npm install
npx tsx api-server.ts
```

The API server runs on http://localhost:3000 and serves:
- `POST /api/upload` — Upload photos (multipart form data)
- `GET /api/upload` — List approved photos (JSON)
- `GET /api/upload?admin=true` — List all photos including unapproved
- `PATCH /api/media/:id` — Toggle approval (requires auth)
- `DELETE /api/media/:id` — Delete photo (requires auth)
- `/uploads/*` — Static file serving for uploaded photos

### 2. Run the Next.js frontend (for development)

```bash
# In a separate terminal
npm run dev
```

Visit http://localhost:3001 (Next.js dev server) — API calls proxy to the Express server on port 3000.

### 3. Or use the vanilla JS preview

Open `preview/index.html` in a browser, or serve it with any static file server. Set `API_BASE` in the script to point to your API server.

## Production Deployment (Vercel)

### Option A: Full Vercel deployment

1. Push the code to GitHub
2. Import the repo into Vercel
3. Set environment variables:
   - `ADMIN_PASSWORD` — your admin dashboard password
4. For storage, either:
   - Keep local filesystem (works with Vercel's `/tmp` but is ephemeral)
   - Integrate [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for persistent storage
   - Use S3, Cloudflare R2, or Supabase Storage (update `lib/storage.ts`)

### Option B: Static export + API server

1. Build the static frontend:
   ```bash
   npm run build
   npx tsx fix-paths.ts  # Fix paths for sub-path deployment
   ```
2. Deploy the `out/` directory to any static host (S3, Cloudflare Pages, Netlify)
3. Run `api-server.ts` on a Node.js host (Railway, Render, Fly.io, your own server)
4. Set `API_BASE` in `lib/api.ts` to point to your API server URL

## Admin Dashboard

- URL: `/#/admin` (vanilla JS) or `/admin` (Next.js)
- Default password: `admin` (change in `.env.local` → `ADMIN_PASSWORD`)
- Features: approve/unapprove photos, delete photos, download all photos

## QR Code

The landing page generates a QR code that links to the upload page. Display this QR code at wedding tables or print it on welcome signs. Guests scan with their phone camera to open the upload page — no app download needed.

## Customization

- **Colors**: Edit the CSS variables and Tailwind classes in the page components
- **Upload limits**: Modify `MAX_SIZE` in the API server (default 100MB)
- **Auto-approve**: Set `approved: true` (default) or `false` in `saveMedia()` to require moderation
- **Storage**: Update `lib/storage.ts` to use S3, Vercel Blob, or any object storage
- **Languages**: The vanilla JS version supports any language — just update the text strings

## Tech Stack

- **Frontend**: Next.js 16 + Tailwind CSS (production) / Vanilla JS (preview)
- **Backend**: Express.js + Multer (file uploads)
- **Storage**: Local filesystem (default, swappable to S3/Vercel Blob)
- **QR Code**: qrcode.react (Next.js) / qrcode-generator CDN (vanilla JS)
- **Icons**: lucide-react (Next.js) / inline SVG (vanilla JS)

## License

Made with love for your wedding day. Use freely.
