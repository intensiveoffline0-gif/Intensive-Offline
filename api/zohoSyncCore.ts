import * as fs from "fs";
import * as path from "path";
import { ZOHO_STUDENTS_CSV } from "../src/data/zohoStudentsCSV";

export const ZOHO_DIRECT_CSV_URL = "https://creatorapp.zohopublic.in/nxtwave/intensive-offline/csv/Student_Profiles_AI_Studio/CFJq3KyZ7QMmMa2a5tU0e8Artb5F9qTeU79eaWB4Te28b9DXGP60vg46uyJJVyRpOfxXG9MfpSUh2Gsq0RG9hbERxRORC2J4MWY0";

export const CANONICAL_CSV_HEADERS = [
  "Full Name",
  "User ID",
  "Student ID",
  "Mobile Number",
  "Active Status",
  "Enrolled on",
  "Batch Details",
  "Batch Timing",
  "Gender",
  "Preferred Job Track",
  "Your Personal Mail ID",
  "Permanent Address District",
  "Permanent State",
  "Permanent Address Pincode",
  "Highest Qualification",
  "Graduation Degree Name",
  "Graduation Stream",
  "Graduation College / University Name",
  "Graduation Year of Passing",
  "Graduation CGPA ",
  "Post-Graduation Degree Name",
  "Post-Graduation Stream",
  "Post-Graduation College / University Name",
  "Post Graduation Year of Passing",
  "Post Graduation CGPA / Percentage Obtained",
  "Placed Organisation",
  "External Placed Organisation",
  "Placement Type",
  "Placed Month",
  "CTC(LPA)",
  "Profile Photo",
  "Resume",
  "Instructor Name",
  "Centre Name"
];

export function getFilePath(fileName: string): string {
  const cwdPath = path.join(process.cwd(), fileName);
  if (process.env.VERCEL) {
    const tmpPath = path.join("/tmp", fileName);
    if (fs.existsSync(tmpPath)) return tmpPath;
    if (fs.existsSync(cwdPath)) {
      try {
        fs.copyFileSync(cwdPath, tmpPath);
        return tmpPath;
      } catch (_) {}
    }
    return tmpPath;
  }
  return cwdPath;
}

export function parseServerCSVRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        currentField += "\"";
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

  return rows.map((r) =>
    r.map((v) => {
      let s = v.trim();
      if (s.startsWith("\"") && s.endsWith("\"")) {
        s = s.substring(1, s.length - 1);
      }
      return s.trim();
    })
  );
}

export function escapeCSVValue(val: string): string {
  if (val === null || val === undefined) return "";
  const s = String(val).trim();
  if (s.includes(",") || s.includes("\"") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function formatCurrentSyncDate(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, "0");
  return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
}

export function extractZohoPhotoUrl(rawPhoto: any): string {
  if (!rawPhoto) return "";
  const str = String(rawPhoto).trim();
  if (str.startsWith("http://") || str.startsWith("https://")) return str;
  const match = str.match(/src\s*=\s*['"]([^'"]+)['"]/i) || str.match(/href\s*=\s*['"]([^'"]+)['"]/i);
  let relPath = match ? match[1] : str;
  if (!relPath.startsWith("/")) relPath = "/" + relPath;
  const token = "CFJq3KyZ7QMmMa2a5tU0e8Artb5F9qTeU79eaWB4Te28b9DXGP60vg46uyJJVyRpOfxXG9MfpSUh2Gsq0RG9hbERxRORC2J4MWY0";
  return `https://creatorapp.zohopublic.in/nxtwave/intensive-offline/report/Student_Profiles_AI_Studio/Profile_Photo/download-file/${token}?filepath=${encodeURIComponent(relPath)}`;
}

export function extractZohoResumeUrl(rawResume: any): string {
  if (!rawResume) return "";
  const str = String(rawResume).trim();
  if (str.startsWith("http://") || str.startsWith("https://")) return str;
  const match = str.match(/href\s*=\s*['"]([^'"]+)['"]/i) || str.match(/src\s*=\s*['"]([^'"]+)['"]/i);
  let relPath = match ? match[1] : str;
  if (!relPath.startsWith("/")) relPath = "/" + relPath;
  const token = "CFJq3KyZ7QMmMa2a5tU0e8Artb5F9qTeU79eaWB4Te28b9DXGP60vg46uyJJVyRpOfxXG9MfpSUh2Gsq0RG9hbERxRORC2J4MWY0";
  return `https://creatorapp.zohopublic.in/nxtwave/intensive-offline/report/Student_Profiles_AI_Studio/Your_Resume/download-file/${token}?filepath=${encodeURIComponent(relPath)}`;
}

export async function fetchLiveZohoCsv(): Promise<string> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[Zoho Sync] Requesting direct live CSV from Zoho Creator (attempt ${attempt}/3)...`);
      const fetchUrl = `${ZOHO_DIRECT_CSV_URL}?_t=${Date.now()}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(fetchUrl, {
        signal: controller.signal,
        headers: {
          "Connection": "close",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/csv,text/plain,*/*"
        }
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Zoho Creator responded with HTTP ${res.status}`);
      }

      const csvText = await res.text();
      if (!csvText || csvText.length < 500) {
        throw new Error("Zoho Creator returned an empty or invalid CSV response");
      }

      return csvText;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Zoho Sync] Attempt ${attempt} failed:`, err?.message || err);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw lastError || new Error("Failed to fetch live CSV from Zoho Creator");
}

export async function getCsvDataset(): Promise<string> {
  const filePath = getFilePath("custom_students.csv");
  if (fs.existsSync(filePath)) {
    try {
      const data = await fs.promises.readFile(filePath, "utf8");
      if (data && data.trim().length > 100) return data;
    } catch (_) {}
  }
  return ZOHO_STUDENTS_CSV;
}

export async function persistCsvDataset(csv: string): Promise<void> {
  const filePath = getFilePath("custom_students.csv");
  try {
    await fs.promises.writeFile(filePath, csv, "utf8");
  } catch (err) {
    console.error("Failed writing to custom_students.csv:", err);
  }

  // Also update src/data/zohoStudentsCSV.ts if filesystem allows (dev / AI Studio)
  try {
    const tsPath = path.join(process.cwd(), "src/data/zohoStudentsCSV.ts");
    if (fs.existsSync(path.dirname(tsPath))) {
      const tsCode = `export const ZOHO_STUDENTS_CSV = ${JSON.stringify(csv)};\n`;
      await fs.promises.writeFile(tsPath, tsCode, "utf8");
    }
  } catch (_) {}
}

export async function getSyncInfo(): Promise<{
  lastSync: string;
  updatedAt: string;
  source: string;
  totalCount: number;
  activeCount: number;
  refundedCount: number;
  latestStudent?: string;
}> {
  const infoPath = getFilePath("zoho_sync_info.json");
  if (fs.existsSync(infoPath)) {
    try {
      const data = JSON.parse(await fs.promises.readFile(infoPath, "utf8"));
      return data;
    } catch (_) {}
  }

  const csv = await getCsvDataset();
  const rows = parseServerCSVRows(csv);
  const count = Math.max(0, rows.length - 1);
  return {
    lastSync: formatCurrentSyncDate(new Date()),
    updatedAt: new Date().toISOString(),
    source: "Zoho Creator Live Direct CSV",
    totalCount: count,
    activeCount: count,
    refundedCount: 0
  };
}

export async function persistSyncInfo(info: any): Promise<void> {
  const infoPath = getFilePath("zoho_sync_info.json");
  try {
    await fs.promises.writeFile(infoPath, JSON.stringify(info, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to persist sync info:", err);
  }
}

export async function syncWithZohoLive(clientSyncTime?: string): Promise<{
  success: boolean;
  count: number;
  activeCount: number;
  refundedCount: number;
  newCount: number;
  updatedCount: number;
  lastSync: string;
  latestStudent: string;
  csv: string;
  warning?: string;
}> {
  let liveCsvText = "";
  let fetchWarning = "";

  try {
    liveCsvText = await fetchLiveZohoCsv();
  } catch (err: any) {
    console.warn("[Zoho Sync Network Issue]:", err?.message || err);
    fetchWarning = "Zoho Creator connection was temporarily interrupted. Retained current database records.";
  }

  const baseCsv = await getCsvDataset();

  if (!liveCsvText) {
    const parsedRows = parseServerCSVRows(baseCsv);
    const count = Math.max(0, parsedRows.length - 1);
    const formattedDate = clientSyncTime || formatCurrentSyncDate(new Date());

    return {
      success: true,
      count,
      activeCount: 0,
      refundedCount: 0,
      newCount: 0,
      updatedCount: 0,
      lastSync: formattedDate,
      latestStudent: "",
      csv: baseCsv,
      warning: fetchWarning
    };
  }

  const liveRows = parseServerCSVRows(liveCsvText);
  if (liveRows.length < 2) {
    throw new Error("Zoho Creator CSV contained no student data rows");
  }

  const liveHeaders = liveRows[0].map(h => h.trim().toLowerCase());
  const liveHeaderMap = new Map<string, number>();
  liveHeaders.forEach((h, idx) => liveHeaderMap.set(h, idx));

  const getLiveVal = (row: string[], colName: string) => {
    const idx = liveHeaderMap.get(colName.toLowerCase());
    return idx !== undefined ? (row[idx] || "").trim() : "";
  };

  const parsedRows = parseServerCSVRows(baseCsv);
  const rawHeaders = parsedRows[0] || [];
  const normalizedHeaders = rawHeaders.map(h => h.trim().toLowerCase());

  const existingMap = new Map<string, Record<string, string>>();
  const orderedKeys: string[] = [];

  for (let i = 1; i < parsedRows.length; i++) {
    const vals = parsedRows[i];
    if (vals.length === 0 || (vals.length === 1 && !vals[0])) continue;
    const rowObj: Record<string, string> = {};
    normalizedHeaders.forEach((h, idx) => {
      const canonicalHeader = CANONICAL_CSV_HEADERS.find(ch => ch.toLowerCase() === h) || h;
      rowObj[canonicalHeader] = vals[idx] || "";
    });

    const studentId = (rowObj["Student ID"] || `row_${i}`).trim();
    const key = studentId.toLowerCase();
    existingMap.set(key, rowObj);
    orderedKeys.push(key);
  }

  const finalRecords: Record<string, string>[] = [];
  const seenStudentIds = new Set<string>();
  let updatedCount = 0;
  let newCount = 0;

  for (let i = 1; i < liveRows.length; i++) {
    const r = liveRows[i];
    if (!r || r.length <= 1) continue;

    const idName = getLiveVal(r, "id - student name");
    const idMatch = idName.match(/^([A-Za-z0-9_-]+)/);
    const freshStudentId = idMatch ? idMatch[1] : (idName.split("-")[0] || idName).trim();
    if (!freshStudentId) continue;

    const key = freshStudentId.toLowerCase();
    if (seenStudentIds.has(key)) continue;
    seenStudentIds.add(key);

    const freshRawName = getLiveVal(r, "your full name");
    const freshFullName = freshRawName || (idName.includes("-") ? idName.replace(/^[^-]+-\s*/, "").trim() : "");
    const rawPhoto = getLiveVal(r, "profile photo");
    const photo = extractZohoPhotoUrl(rawPhoto);
    const rawResume = getLiveVal(r, "your resume");
    const resume = extractZohoResumeUrl(rawResume);

    const existing = existingMap.get(key);

    const studentRow: Record<string, string> = {
      "Full Name": freshFullName,
      "User ID": getLiveVal(r, "instructor name") || freshStudentId,
      "Student ID": freshStudentId,
      "Mobile Number": getLiveVal(r, "register mobile number") || existing?.["Mobile Number"] || "",
      "Active Status": getLiveVal(r, "active status") || "Active",
      "Enrolled on": getLiveVal(r, "orientation day") || existing?.["Enrolled on"] || "",
      "Batch Details": getLiveVal(r, "batch details") || existing?.["Batch Details"] || "",
      "Batch Timing": existing?.["Batch Timing"] || "9:00 AM - 1:00 PM",
      "Gender": existing?.["Gender"] || "",
      "Preferred Job Track": getLiveVal(r, "graduation stream") || existing?.["Preferred Job Track"] || "",
      "Your Personal Mail ID": getLiveVal(r, "your personal mail id") || existing?.["Your Personal Mail ID"] || "",
      "Permanent Address District": getLiveVal(r, "permanent address district") || existing?.["Permanent Address District"] || "",
      "Permanent State": getLiveVal(r, "permanent state") || existing?.["Permanent State"] || "",
      "Permanent Address Pincode": existing?.["Permanent Address Pincode"] || "",
      "Highest Qualification": getLiveVal(r, "graduation degree name") || existing?.["Highest Qualification"] || "",
      "Graduation Degree Name": getLiveVal(r, "graduation degree name") || existing?.["Graduation Degree Name"] || "",
      "Graduation Stream": getLiveVal(r, "graduation stream") || existing?.["Graduation Stream"] || "",
      "Graduation College / University Name": getLiveVal(r, "graduation college / university name") || existing?.["Graduation College / University Name"] || "",
      "Graduation Year of Passing": getLiveVal(r, "graduation year of passing") || existing?.["Graduation Year of Passing"] || "",
      "Graduation CGPA ": getLiveVal(r, "graduation cgpa / percentage obtained") || existing?.["Graduation CGPA "] || "",
      "Post-Graduation Degree Name": existing?.["Post-Graduation Degree Name"] || "",
      "Post-Graduation Stream": existing?.["Post-Graduation Stream"] || "",
      "Post-Graduation College / University Name": existing?.["Post-Graduation College / University Name"] || "",
      "Post Graduation Year of Passing": existing?.["Post Graduation Year of Passing"] || "",
      "Post Graduation CGPA / Percentage Obtained": existing?.["Post Graduation CGPA / Percentage Obtained"] || "",
      "Placed Organisation": getLiveVal(r, "placed organisation") || existing?.["Placed Organisation"] || "",
      "External Placed Organisation": getLiveVal(r, "external placed organisation") || existing?.["External Placed Organisation"] || "",
      "Placement Type": getLiveVal(r, "placed through") || existing?.["Placement Type"] || "",
      "Placed Month": existing?.["Placed Month"] || "",
      "CTC(LPA)": existing?.["CTC(LPA)"] || "",
      "Profile Photo": photo || existing?.["Profile Photo"] || "",
      "Resume": resume || existing?.["Resume"] || "",
      "Instructor Name": getLiveVal(r, "instructor name") || existing?.["Instructor Name"] || "",
      "Centre Name": getLiveVal(r, "centre name") || existing?.["Centre Name"] || ""
    };

    if (existing) {
      updatedCount++;
    } else {
      newCount++;
    }

    finalRecords.push(studentRow);
  }

  finalRecords.sort((a, b) => {
    const idA = a["Student ID"] || "";
    const idB = b["Student ID"] || "";
    return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: "base" });
  });

  let activeCount = 0;
  let refundedCount = 0;
  finalRecords.forEach(record => {
    const st = (record["Active Status"] || "").toLowerCase();
    if (st === "active") activeCount++;
    if (st === "refunded") refundedCount++;
  });

  const headerLine = CANONICAL_CSV_HEADERS.join(",");
  const rowLines: string[] = [];
  for (const record of finalRecords) {
    const line = CANONICAL_CSV_HEADERS.map(h => escapeCSVValue(record[h] || "")).join(",");
    rowLines.push(line);
  }
  const updatedCsv = [headerLine, ...rowLines].join("\n");

  await persistCsvDataset(updatedCsv);

  const formattedDate = clientSyncTime || formatCurrentSyncDate(new Date());
  const latestStudentName = getLiveVal(liveRows[1], "your full name") || getLiveVal(liveRows[1], "id - student name");

  const syncInfo = {
    lastSync: formattedDate,
    updatedAt: new Date().toISOString(),
    source: "Zoho Creator Live Direct CSV",
    totalCount: finalRecords.length,
    activeCount,
    refundedCount,
    newCount,
    updatedCount,
    latestStudent: latestStudentName
  };

  await persistSyncInfo(syncInfo);
  console.log(`[Zoho Sync Complete] Total: ${finalRecords.length}, Active: ${activeCount}, Refunded: ${refundedCount}, Updated: ${updatedCount}, New: ${newCount}, LastSync: ${formattedDate}`);

  return {
    success: true,
    count: finalRecords.length,
    activeCount,
    refundedCount,
    newCount,
    updatedCount,
    lastSync: formattedDate,
    latestStudent: latestStudentName,
    csv: updatedCsv,
    warning: fetchWarning
  };
}

export async function updateStudentPlacement(
  studentId: string,
  updates: {
    placedOrganisation?: string;
    externalPlacedOrganisation?: string;
    placementType?: string;
    placedMonth?: string;
    ctcLpa?: string;
  }
): Promise<{ success: boolean; studentId: string; updatedCount: number }> {
  const csv = await getCsvDataset();
  const rows = parseServerCSVRows(csv);
  if (rows.length < 2) throw new Error("Dataset is empty");

  const headers = rows[0].map(h => h.trim().toLowerCase());
  const idColIdx = headers.findIndex(h => h === "student id" || h === "student_id" || h === "id");
  if (idColIdx === -1) throw new Error("Could not find Student ID column");

  const placedOrgIdx = headers.findIndex(h => h === "placed organisation" || h === "placed organization");
  const extPlacedOrgIdx = headers.findIndex(h => h === "external placed organisation" || h === "external placed organization");
  const placementTypeIdx = headers.findIndex(h => h === "placement type");
  const placedMonthIdx = headers.findIndex(h => h === "placed month");
  const ctcIdx = headers.findIndex(h => h.includes("ctc"));

  let targetFound = false;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[idColIdx]?.trim().toLowerCase() === studentId.trim().toLowerCase()) {
      targetFound = true;
      if (updates.placedOrganisation !== undefined && placedOrgIdx !== -1) {
        row[placedOrgIdx] = updates.placedOrganisation;
      }
      if (updates.externalPlacedOrganisation !== undefined && extPlacedOrgIdx !== -1) {
        row[extPlacedOrgIdx] = updates.externalPlacedOrganisation;
      }
      if (updates.placementType !== undefined && placementTypeIdx !== -1) {
        row[placementTypeIdx] = updates.placementType;
      }
      if (updates.placedMonth !== undefined && placedMonthIdx !== -1) {
        row[placedMonthIdx] = updates.placedMonth;
      }
      if (updates.ctcLpa !== undefined && ctcIdx !== -1) {
        row[ctcLpaIdx(ctcIdx, row)] = updates.ctcLpa;
      }
      break;
    }
  }

  function ctcLpaIdx(idx: number, r: string[]) {
    return idx !== -1 ? idx : r.length - 1;
  }

  if (!targetFound) {
    throw new Error(`Student with ID "${studentId}" was not found in database.`);
  }

  const updatedCSV = rows.map(row => row.map(escapeCSVValue).join(",")).join("\n");
  await persistCsvDataset(updatedCSV);

  return { success: true, studentId, updatedCount: 1 };
}
