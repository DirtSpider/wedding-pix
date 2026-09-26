import express from "express";
import multer from "multer";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");
const UPLOAD_DIR = path.join(STORAGE_DIR, "uploads");
const DATA_FILE = path.join(STORAGE_DIR, "data", "uploads.json");

type MediaRecord = {
  id: string;
  filename: string;
  originalName: string;
  caption: string;
  guestName: string;
  mimeType: string;
  uploadedAt: string;
  approved: boolean;
  size?: number;
};

async function ensureDirs() {
  await fs.mkdir(path.join(STORAGE_DIR, "data"), { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

async function readDb(): Promise<MediaRecord[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

let writeLock: Promise<void> = Promise.resolve();

async function writeDb(records: MediaRecord[]) {
  writeLock = writeLock.then(async () => {
    await ensureDirs();
    const tmp = DATA_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(records, null, 2));
    await fs.rename(tmp, DATA_FILE);
  }).catch(() => {});
  await writeLock;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const id = crypto.randomUUID();
      const ext = path.extname(file.originalname) || '';
      cb(null, id + ext);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// CORS headers
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Serve uploaded files with correct Content-Type
app.use("/uploads", async (req, res, next) => {
  const filename = path.basename(req.path);
  if (filename && !path.extname(filename)) {
    // No extension — look up mimeType from database
    try {
      const records = await readDb();
      const record = records.find(r => r.filename === filename);
      if (record && record.mimeType) {
        res.setHeader('Content-Type', record.mimeType);
      }
    } catch {}
  }
  next();
});
app.use("/uploads", express.static(UPLOAD_DIR));

// Serve static frontend (vanilla JS version)
const STATIC_DIR = path.join(process.cwd(), "out");
app.use(express.static(STATIC_DIR));

// Upload endpoint
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const record: MediaRecord = {
      id: req.file.filename,
      filename: req.file.filename,
      originalName: req.file.originalname,
      caption: req.body.caption || "",
      guestName: req.body.guestName || "",
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      approved: true,
      size: req.file.size,
    };

    const records = await readDb();
    records.push(record);
    await writeDb(records);

    res.status(201).json({ success: true, media: record });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// List media
app.get("/api/upload", async (req, res) => {
  const admin = req.query.admin === "true";
  const records = await readDb();
  // Enrich with file size if missing
  let needsSave = false;
  for (const r of records) {
    if (!r.size) {
      try {
        const stat = await fs.stat(path.join(UPLOAD_DIR, r.filename));
        r.size = stat.size;
        needsSave = true;
      } catch {}
    }
  }
  if (needsSave) await writeDb(records);
  const filtered = admin ? records : records.filter((r) => r.approved);
  const sorted = filtered.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  res.json({ media: sorted });
});

// Auth check
app.post("/api/auth", (req, res) => {
  const { password } = req.body || {};
  const adminPassword = process.env.ADMIN_PASSWORD || "admin";
  if (password === adminPassword) {
    res.json({ success: true, token: adminPassword });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// Toggle approval
app.patch("/api/media/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const adminPassword = process.env.ADMIN_PASSWORD || "admin";
  if (authHeader !== `Bearer ${adminPassword}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const records = await readDb();
  const record = records.find((r) => r.id === req.params.id);
  if (!record) return res.status(404).json({ error: "Not found" });
  record.approved = !record.approved;
  await writeDb(records);
  res.json({ success: true, media: record });
});

// Storage info endpoint
app.get("/api/storage", async (_req, res) => {
  try {
    const records = await readDb();
    const files = await fs.readdir(UPLOAD_DIR);
    let totalSize = 0;
    for (const f of files) {
      try {
        const stat = await fs.stat(path.join(UPLOAD_DIR, f));
        if (stat.isFile()) totalSize += stat.size;
      } catch {}
    }
    const dbSize = (await fs.readFile(DATA_FILE, 'utf-8').catch(() => '')).length;
    res.json({
      fileCount: records.length,
      filesOnDisk: files.length,
      totalSizeBytes: totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      dbSizeBytes: dbSize,
      uploadDir: UPLOAD_DIR,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read storage info' });
  }
});

// Delete media
app.delete("/api/media/:id", async (req, res) => {
  const records = await readDb();
  const idx = records.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const record = records[idx];
  try {
    await fs.unlink(path.join(UPLOAD_DIR, record.filename));
  } catch {
    // file may not exist
  }
  records.splice(idx, 1);
  await writeDb(records);
  res.json({ success: true });
});

// Catch-all: serve index.html for any non-API route (SPA fallback)
app.get('*path', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Wedding Pix running on port ${PORT}`);
  console.log(`  Frontend: http://localhost:${PORT}`);
  console.log(`  API:      http://localhost:${PORT}/api/upload`);
});
