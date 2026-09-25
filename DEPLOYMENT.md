# Wedding Pix — External Hosting Guide

Your app has two parts:
1. **Static frontend** — `out/index.html` + 2 JPG images (botanical borders)
2. **API server** — `api-server.ts` (Express.js, handles uploads/gallery/admin)

The API server now also serves the static frontend, so you only need one deployment.

---

## Option 1: Railway (Recommended — Easiest)

**Cost:** $5/month (includes persistent storage)
**Setup time:** ~10 minutes

### Steps

1. **Push your code to GitHub**
   ```bash
   cd wedding-pix
   git init
   git add -A
   git commit -m "Wedding Pix app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/wedding-pix.git
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app) and sign up (GitHub login)
   - Click **"New Project"** → **"Deploy from GitHub repo"**
   - Select your `wedding-pix` repository
   - Railway auto-detects the Node.js app from `package.json`

3. **Configure the deployment**
   - In Railway, go to **Settings** → **Build & Deploy**
   - Build Command: `npm install`
   - Start Command: `npx tsx api-server.ts`
   - Add a **Volume** (for persistent photo storage):
     - Go to **Volumes** → **Add Volume**
     - Mount path: `/data` (and another for `/public/uploads`)
     - Or mount at the project root if simpler

4. **Set environment variables**
   - Go to **Variables** tab
   - Add: `ADMIN_PASSWORD` = your chosen password (not "admin")

5. **Get your URL**
   - Railway gives you a URL like `wedding-pix-production.up.railway.app`
   - Go to **Settings** → **Domains** to add a custom domain if desired

6. **Test it**
   - Visit the URL → should show the Jessalynn & Dylan home page
   - Try uploading a photo → should appear in the gallery
   - Go to `/#/admin` → log in with your ADMIN_PASSWORD

### Important: Persistent Storage on Railway
Railway's filesystem is ephemeral by default. To keep uploaded photos:
- Add a **Volume** mounted at the project root, OR
- Mount separate volumes at `/data` and `/public/uploads`

Without volumes, uploaded photos will disappear when the app redeploys.

---

## Option 2: Render

**Cost:** $7/month (Starter plan, always-on + persistent disk)
**Free tier:** Available but spins down after 15 min inactivity (not suitable for a live event)

### Steps

1. **Push to GitHub** (same as Railway Step 1)

2. **Deploy on Render**
   - Go to [render.com](https://render.com) and sign up
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repo
   - Settings:
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `npx tsx api-server.ts`
     - Instance Type: **Starter** ($7/month)

3. **Add persistent disk**
   - Go to the service → **Disks** tab
   - Add disk:
     - Name: `wedding-data`
     - Mount Path: `/opt/render/project/src/data`
     - Size: 1 GB
   - Add another disk for uploads:
     - Name: `wedding-uploads`
     - Mount Path: `/opt/render/project/src/public/uploads`
     - Size: 5 GB (photos add up!)

4. **Set environment variables**
   - Go to **Environment** tab
   - Add: `ADMIN_PASSWORD` = your chosen password

5. **One-click alternative:** The `render.yaml` file in this repo enables Render Blueprint deployment. Just visit:
   `https://render.com/deploy?repo=https://github.com/YOUR_USERNAME/wedding-pix`

---

## Option 3: Self-Host on Your Mac mini (Free)

You already have a Mac mini M4 Pro — this is free and gives you full control.

### Steps

1. **Install dependencies**
   ```bash
   cd wedding-pix
   npm install
   ```

2. **Start the server**
   ```bash
   npx tsx api-server.ts
   ```
   The app runs at `http://localhost:3000`

3. **Get a public URL with Cloudflare Tunnel** (recommended, free)
   ```bash
   # Install cloudflared
   brew install cloudflared

   # Run a quick tunnel (gives you a random subdomain)
   cloudflared tunnel --url http://localhost:3000
   ```
   This gives you a URL like `https://random-words-xyz.trycloudflare.com`

   For a stable URL, set up a named tunnel:
   ```bash
   cloudflared tunnel login
   cloudflared tunnel create wedding-pix
   cloudflared tunnel route dns wedding-pix photos.yourdomain.com
   cloudflared tunnel run wedding-pix
   ```

4. **Alternative: ngrok** (simpler but URL changes on restart)
   ```bash
   ngrok http 3000
   ```

5. **Keep it running during the event**
   ```bash
   # Use pm2 to keep it alive
   npm install -g pm2
   pm2 start "npx tsx api-server.ts" --name wedding-pix
   pm2 save
   pm2 startup  # ensures it restarts on boot
   ```

### Caveats
- Your Mac mini must stay awake and online during the event
- Home internet must be stable
- Cloudflare Tunnel is the most reliable free option

---

## Option 4: Vercel (Frontend) + Railway/Render (API)

This splits the app for best performance but is more complex.

1. **Deploy frontend to Vercel**
   - Push `out/` directory to Vercel (drag-and-drop or via CLI)
   - Or import the GitHub repo and set the output directory to `out/`

2. **Deploy API to Railway/Render** (as in Option 1 or 2)

3. **Update API_BASE in `out/index.html`**
   Change line 244 from:
   ```js
   var PLACEHOLDER = "__PORT_3000__";
   var API_BASE = PLACEHOLDER.startsWith("__") ? "" : PLACEHOLDER;
   ```
   To:
   ```js
   var API_BASE = "https://your-api-server.up.railway.app";
   ```

4. **Set environment variables** on the API host (ADMIN_PASSWORD, CORS already enabled)

---

## Quick Comparison

| Option | Cost | Setup Time | Persistent Storage | Best For |
|--------|------|------------|-------------------|----------|
| Railway | $5/mo | 10 min | Volumes (easy) | Easiest full-stack |
| Render | $7/mo | 10 min | Persistent disks | One-click blueprint |
| Mac mini | Free | 15 min | Local filesystem | You already have the hardware |
| Vercel + API | $5-7/mo | 20 min | On API host | Best CDN performance |

---

## After Deployment

1. **Update the QR code** — The QR code on the home page auto-generates from the current URL, so it will automatically point to your deployed URL. No changes needed.

2. **Change the admin password** — Set `ADMIN_PASSWORD` in your hosting environment variables. Don't use "admin" in production.

3. **Test the full flow:**
   - Open the URL on your phone
   - Upload a test photo
   - Check it appears in the gallery
   - Open the slideshow
   - Log into admin and test approve/delete

4. **Print QR codes** — Use the "Show QR Code" button on the home page, screenshot it, and print it on table cards or a welcome sign.

5. **During the event:**
   - Keep the admin dashboard open on your phone to moderate photos
   - The gallery auto-refreshes every 15 seconds
   - The slideshow auto-advances every 5 seconds

---

## File Structure for Deployment

```
wedding-pix/
├── api-server.ts          # Express API + static file server
├── out/
│   ├── index.html         # Branded frontend (vanilla JS)
│   ├── botanical-header.jpg
│   └── botanical-footer.jpg
├── package.json           # Dependencies + start script
├── Procfile               # For Railway/Render
├── render.yaml            # For Render Blueprint
└── .gitignore             # Excludes node_modules, uploads, data
```

The `out/` directory is your static frontend. The API server serves it automatically, so you don't need a separate static host.
