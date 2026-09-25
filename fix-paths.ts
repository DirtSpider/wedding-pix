import { promises as fs } from "fs";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "out");

async function fixPaths() {
  // Fix HTML files
  const htmlFiles = await findFiles(OUT_DIR, ".html");
  for (const file of htmlFiles) {
    let content = await fs.readFile(file, "utf-8");
    content = content.replace(/href="\/_next\//g, 'href="./_next/');
    content = content.replace(/src="\/_next\//g, 'src="./_next/');
    // Fix page navigation links (Next.js generates href="/page" in data)
    content = content.replace(/href="\/upload"/g, 'href="./upload.html"');
    content = content.replace(/href="\/gallery"/g, 'href="./gallery.html"');
    content = content.replace(/href="\/slideshow"/g, 'href="./slideshow.html"');
    content = content.replace(/href="\/admin"/g, 'href="./admin.html"');
    content = content.replace(/href="\/""/g, 'href="./index.html"');
    // Fix Next.js router data paths
    content = content.replace(/"\/_next\//g, '"./_next/');
    content = content.replace(/"\/upload"/g, '"./upload.html"');
    content = content.replace(/"\/gallery"/g, '"./gallery.html"');
    content = content.replace(/"\/slideshow"/g, '"./slideshow.html"');
    content = content.replace(/"\/admin"/g, '"./admin.html"');
    await fs.writeFile(file, content);
  }

  // Fix JS files — replace absolute /_next/ paths with relative ./_next/
  const jsFiles = await findFiles(path.join(OUT_DIR, "_next"), ".js");
  for (const file of jsFiles) {
    let content = await fs.readFile(file, "utf-8");
    // Only replace in string contexts, not in code logic
    content = content.replace(/"\/_next\//g, '"./_next/');
    content = content.replace(/'\/_next\//g, "'./_next/");
    await fs.writeFile(file, content);
  }

  console.log(`Fixed paths in ${htmlFiles.length} HTML and ${jsFiles.length} JS files`);
}

async function findFiles(dir: string, ext: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findFiles(fullPath, ext)));
    } else if (entry.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

fixPaths().catch(console.error);
