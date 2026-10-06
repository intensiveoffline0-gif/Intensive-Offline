import * as fs from "fs";
import * as path from "path";
import { ZOHO_STUDENTS_CSV } from "../../../src/data/zohoStudentsCSV.js";

const photoBufferCache = new Map();
let studentPhotoMap = null;
let studentNameMap = null;

function initPhotoMap() {
  if (studentPhotoMap) return;
  studentPhotoMap = new Map();
  studentNameMap = new Map();
  
  let csv = ZOHO_STUDENTS_CSV;
  try {
    const diskPath = path.join(process.cwd(), "custom_students.csv");
    if (fs.existsSync(diskPath)) {
      const diskCsv = fs.readFileSync(diskPath, "utf8");
      if (diskCsv && diskCsv.length > 100) csv = diskCsv;
    }
  } catch (_) {}

  const lines = csv.split("\n");
  if (lines.length < 2) return;
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
  const idIdx = headers.findIndex(h => h === "student id" || h.includes("student id"));
  const nameIdx = headers.findIndex(h => h === "full name" || h.includes("name"));
  const photoIdx = headers.findIndex(h => h === "profile photo" || h.includes("photo"));
  if (idIdx === -1) return;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = [];
    let cur = "";
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === "\"") { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { cols.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    cols.push(cur.trim());

    const sid = (cols[idIdx] || "").trim().toUpperCase();
    if (!sid) continue;
    if (nameIdx !== -1) {
      const name = (cols[nameIdx] || "").trim();
      if (name) studentNameMap.set(sid, name);
    }
    if (photoIdx !== -1) {
      const photo = (cols[photoIdx] || "").trim();
      if (photo && photo.startsWith("http")) {
        studentPhotoMap.set(sid, photo);
      }
    }
  }
}

function getValidImageContentType(buffer, defaultType = "image/jpeg") {
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xD8) return "image/jpeg";
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return "image/png";
  if (buffer.length >= 3 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return "image/gif";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buffer.toString("utf8", 0, 100).includes("<svg")) return "image/svg+xml";
  return defaultType.startsWith("image/") ? defaultType : "image/jpeg";
}

function generateInitialsSvg(name, id) {
  const initials = (name || "Student")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join("") || name?.charAt(0)?.toUpperCase() || "S";
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <defs>
      <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4f46e5" />
        <stop offset="50%" stop-color="#4338ca" />
        <stop offset="100%" stop-color="#1e1b4b" />
      </linearGradient>
    </defs>
    <rect width="256" height="256" rx="40" fill="url(#avatarGrad)"/>
    <text x="128" y="145" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="82" font-weight="800" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    <text x="128" y="210" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="19" font-weight="600" fill="#c7d2fe" text-anchor="middle">${id || ""}</text>
  </svg>`;
  return Buffer.from(svg);
}

export default async function handler(req, res) {
  try {
    initPhotoMap();
    const studentId = (req.query.studentId || req.query.id || "").trim().toUpperCase();
    if (!studentId) {
      return res.status(400).send("Student ID required");
    }

    const cached = photoBufferCache.get(studentId);
    if (cached) {
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Cache-Control", "public, max-age=86400, immutable");
      return res.send(cached.buffer);
    }

    const photoUrl = studentPhotoMap?.get(studentId);
    if (photoUrl) {
      try {
        const upstream = await fetch(photoUrl);
        if (upstream.ok) {
          const rawContentType = upstream.headers.get("content-type") || "image/jpeg";
          const arr = await upstream.arrayBuffer();
          const buffer = Buffer.from(arr);
          const contentType = getValidImageContentType(buffer, rawContentType.split(";")[0]);

          photoBufferCache.set(studentId, { buffer, contentType });

          res.setHeader("Content-Type", contentType);
          res.setHeader("Cache-Control", "public, max-age=86400, immutable");
          return res.send(buffer);
        }
      } catch (e) {
        console.warn(`Upstream error for ${studentId}:`, e);
      }
    }

    const name = studentNameMap?.get(studentId) || studentId;
    const svg = generateInitialsSvg(name, studentId);
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    return res.send(svg);
  } catch (err) {
    console.error("Vercel photo handler error:", err);
    return res.status(500).send("Error fetching photo");
  }
}
