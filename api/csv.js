import * as fs from "fs";
import * as path from "path";
import { ZOHO_STUDENTS_CSV } from "../src/data/zohoStudentsCSV.js";

function getFilePath(filename) {
  return path.join(process.cwd(), filename);
}

function parseServerCSVRows(csvText) {
  const rows = [];
  let currentRow = [];
  let currentVal = "";
  let insideQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    if (char === "\"" && insideQuotes && nextChar === "\"") {
      currentVal += "\"";
      i++;
    } else if (char === "\"") {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentVal.trim());
      if (currentRow.length > 1 || currentRow[0] !== "") {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    rows.push(currentRow);
  }
  return rows;
}

async function getCsvDataset() {
  const filePath = getFilePath("custom_students.csv");
  if (fs.existsSync(filePath)) {
    try {
      const data = await fs.promises.readFile(filePath, "utf8");
      if (data && data.trim().length > 100) return data;
    } catch (_) {}
  }
  return ZOHO_STUDENTS_CSV;
}

async function persistCsvDataset(csv) {
  const filePath = getFilePath("custom_students.csv");
  try {
    await fs.promises.writeFile(filePath, csv, "utf8");
  } catch (err) {
    console.error("Failed writing to custom_students.csv:", err);
  }
  try {
    const tsPath = path.join(process.cwd(), "src/data/zohoStudentsCSV.ts");
    if (fs.existsSync(path.dirname(tsPath))) {
      await fs.promises.writeFile(tsPath, `export const ZOHO_STUDENTS_CSV = ${JSON.stringify(csv)};\n`, "utf8");
    }
    const jsPath = path.join(process.cwd(), "src/data/zohoStudentsCSV.js");
    if (fs.existsSync(path.dirname(jsPath))) {
      await fs.promises.writeFile(jsPath, `export const ZOHO_STUDENTS_CSV = ${JSON.stringify(csv)};\n`, "utf8");
    }
  } catch (_) {}
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method === "GET") {
    try {
      const csv = await getCsvDataset();
      const rows = parseServerCSVRows(csv);
      const count = Math.max(0, rows.length - 1);
      return res.status(200).json({ csv, count });
    } catch (err) {
      console.error("[API /api/csv GET Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to retrieve student data" });
    }
  }
  if (req.method === "POST") {
    try {
      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch (_) {}
      }
      const csv = typeof body === "string" ? body : body?.csv;
      const pin = body?.pin || "";
      const expectedPin = process.env.ADMIN_PIN || "admin0929";
      if (pin && pin !== expectedPin) {
        return res.status(401).json({ error: "Invalid Admin PIN. Authentication required." });
      }
      if (!csv || typeof csv !== "string" || csv.trim().length === 0) {
        return res.status(400).json({ error: "CSV content cannot be empty." });
      }
      await persistCsvDataset(csv);
      const rows = parseServerCSVRows(csv);
      const count = Math.max(0, rows.length - 1);
      return res.status(200).json({
        success: true,
        message: "Student CSV successfully updated.",
        count
      });
    } catch (err) {
      console.error("[API /api/csv POST Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to save CSV" });
    }
  }
  return res.status(405).json({ error: "Method Not Allowed" });
}
