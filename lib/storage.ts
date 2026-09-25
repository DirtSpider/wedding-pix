import { promises as fs } from "fs";
import path from "path";

export type MediaRecord = {
  id: string;
  filename: string;
  originalName: string;
  caption: string;
  guestName: string;
  mimeType: string;
  uploadedAt: string;
  approved: boolean;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "uploads.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
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

export async function saveMedia(
  file: File,
  caption: string,
  guestName: string
): Promise<MediaRecord> {
  await ensureDirs();

  const id = crypto.randomUUID();
  const ext = path.extname(file.name) || "";
  const filename = `${id}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  const record: MediaRecord = {
    id,
    filename,
    originalName: file.name,
    caption,
    guestName,
    mimeType: file.type,
    uploadedAt: new Date().toISOString(),
    approved: true, // auto-approve for v1; set false for moderation mode
  };

  const records = await readDb();
  records.push(record);
  await writeDb(records);

  return record;
}

export async function listMedia(approvedOnly = true): Promise<MediaRecord[]> {
  const records = await readDb();
  const filtered = approvedOnly
    ? records.filter((r) => r.approved)
    : records;
  return filtered.sort((a, b) =>
    b.uploadedAt.localeCompare(a.uploadedAt)
  );
}

export async function toggleApproval(id: string): Promise<MediaRecord | null> {
  const records = await readDb();
  const record = records.find((r) => r.id === id);
  if (!record) return null;
  record.approved = !record.approved;
  await writeDb(records);
  return record;
}

export async function deleteMedia(id: string): Promise<boolean> {
  const records = await readDb();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return false;

  const record = records[idx];
  const filepath = path.join(UPLOAD_DIR, record.filename);
  try {
    await fs.unlink(filepath);
  } catch {
    // file may not exist, continue
  }

  records.splice(idx, 1);
  await writeDb(records);
  return true;
}
