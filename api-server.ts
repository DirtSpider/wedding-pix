import express from "express";
import multer from "multer";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const DATA_FILE = path.join(process.cwd(), "data", "uploads.json");

type MediaRecord = {
  id: string;
  filename: string;
  originalName: string;
  caption: string;
  guestName: string;
  mimeType: string;
  uploadedAt: string;
  approved: boolean;
};

async function ensureDirs() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
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

async function writeDb(records: MediaRecord[]) {
  await ensureDirs();
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2));
}

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, _file, cb) => {
      const id = crypto.randomUUID();
      cb(null, id);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Serve uploaded files
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
  const filtered = admin ? records : records.filter((r) => r.approved);
  const sorted = filtered.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  res.json({ media: sorted });
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

// Delete media
app.delete("/api/media/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const adminPassword = process.env.ADMIN_PASSWORD || "admin";
  if (authHeader !== `Bearer ${adminPassword}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
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
