// api/zohoSyncCore.ts
import * as fs from "fs";
import * as path from "path";

// src/data/zohoStudentsCSV.ts
import { ZOHO_STUDENTS_CSV } from "../../src/data/zohoStudentsCSV.js";

// api/zohoSyncCore.ts
function getFilePath(fileName) {
  const cwdPath = path.join(process.cwd(), fileName);
  if (process.env.VERCEL) {
    const tmpPath = path.join("/tmp", fileName);
    if (fs.existsSync(tmpPath)) return tmpPath;
    if (fs.existsSync(cwdPath)) {
      try {
        fs.copyFileSync(cwdPath, tmpPath);
        return tmpPath;
      } catch (_) {
      }
    }
    return tmpPath;
  }
  return cwdPath;
}
function parseServerCSVRows(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      currentRow.push(currentField);
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }
  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  return rows.map(
    (r) => r.map((v) => {
      let s = v.trim();
      if (s.startsWith('"') && s.endsWith('"')) {
        s = s.substring(1, s.length - 1);
      }
      return s.trim();
    })
  );
}
function escapeCSVValue(val) {
  if (val === null || val === void 0) return "";
  const s = String(val).trim();
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
async function getCsvDataset() {
  const filePath = getFilePath("custom_students.csv");
  if (fs.existsSync(filePath)) {
    try {
      const data = await fs.promises.readFile(filePath, "utf8");
      if (data && data.trim().length > 100) return data;
    } catch (_) {
    }
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
      const tsCode = `export const ZOHO_STUDENTS_CSV = ${JSON.stringify(csv)};
`;
      await fs.promises.writeFile(tsPath, tsCode, "utf8");
    }
  } catch (_) {
  }
}
async function updateStudentPlacement(studentId, updates) {
  const csv = await getCsvDataset();
  const rows = parseServerCSVRows(csv);
  if (rows.length < 2) throw new Error("Dataset is empty");
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const idColIdx = headers.findIndex((h) => h === "student id" || h === "student_id" || h === "id");
  if (idColIdx === -1) throw new Error("Could not find Student ID column");
  const placedOrgIdx = headers.findIndex((h) => h === "placed organisation" || h === "placed organization");
  const extPlacedOrgIdx = headers.findIndex((h) => h === "external placed organisation" || h === "external placed organization");
  const placementTypeIdx = headers.findIndex((h) => h === "placement type");
  const placedMonthIdx = headers.findIndex((h) => h === "placed month");
  const ctcIdx = headers.findIndex((h) => h.includes("ctc"));
  let targetFound = false;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[idColIdx]?.trim().toLowerCase() === studentId.trim().toLowerCase()) {
      targetFound = true;
      if (updates.placedOrganisation !== void 0 && placedOrgIdx !== -1) {
        row[placedOrgIdx] = updates.placedOrganisation;
      }
      if (updates.externalPlacedOrganisation !== void 0 && extPlacedOrgIdx !== -1) {
        row[extPlacedOrgIdx] = updates.externalPlacedOrganisation;
      }
      if (updates.placementType !== void 0 && placementTypeIdx !== -1) {
        row[placementTypeIdx] = updates.placementType;
      }
      if (updates.placedMonth !== void 0 && placedMonthIdx !== -1) {
        row[placedMonthIdx] = updates.placedMonth;
      }
      if (updates.ctcLpa !== void 0 && ctcIdx !== -1) {
        row[ctcLpaIdx(ctcIdx, row)] = updates.ctcLpa;
      }
      break;
    }
  }
  function ctcLpaIdx(idx, r) {
    return idx !== -1 ? idx : r.length - 1;
  }
  if (!targetFound) {
    throw new Error(`Student with ID "${studentId}" was not found in database.`);
  }
  const updatedCSV = rows.map((row) => row.map(escapeCSVValue).join(",")).join("\n");
  await persistCsvDataset(updatedCSV);
  return { success: true, studentId, updatedCount: 1 };
}

// api/students/update-placement.ts
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (_) {
      }
    }
    const {
      studentId,
      placedOrganisation,
      externalPlacedOrganisation,
      placementType,
      placedMonth,
      ctcLpa
    } = body || {};
    if (!studentId) {
      return res.status(400).json({ error: "Missing required parameter 'studentId'" });
    }
    const result = await updateStudentPlacement(studentId, {
      placedOrganisation,
      externalPlacedOrganisation,
      placementType,
      placedMonth,
      ctcLpa
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("[API /api/students/update-placement Error]:", error);
    return res.status(500).json({
      error: error.message || "Failed to update student placement details"
    });
  }
}
export {
  handler as default
};
