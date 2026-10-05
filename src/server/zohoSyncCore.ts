import * as fs from "fs";
import * as path from "path";
import { ZOHO_STUDENTS_CSV } from "../data/zohoStudentsCSV";

export const MASTER_ENROLLMENT_REPORT_CSV_URL = "https://creatorapp.zohopublic.in/nxtwave/intensive-offline/csv/Students_Data_Report/y4KgkdzE1CXYTUnwEBs1zantAYKaBw108xs9z3njNj6V2sB3hS7GBuaGjkTVHV8wZqMVzGRNtVQpp3O5sAAmF3dQWYD8T5f6UpNh";
export const STUDENT_PROFILES_REPORT_CSV_URL = "https://creatorapp.zohopublic.in/nxtwave/intensive-offline/csv/Student_Profiles_AI_Studio/CFJq3KyZ7QMmMa2a5tU0e8Artb5F9qTeU79eaWB4Te28b9DXGP60vg46uyJJVyRpOfxXG9MfpSUh2Gsq0RG9hbERxRORC2J4MWY0";

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

export function getFilePath(filename: string): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", filename);
  }
  const localDataDir = path.resolve("./data");
  if (!fs.existsSync(localDataDir)) {
    try {
      fs.mkdirSync(localDataDir, { recursive: true });
    } catch (_) {}
  }
  return path.join(localDataDir, filename);
}

export function escapeCSVValue(val: any): string {
  if (!val) return "";
  const s = String(val).trim();
  if (s.includes(",") || s.includes("\"") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, "\"\"")}"`;
  }
  return s;
}

export function parseCSVRows(csv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = "";
  let insideQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];
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

export function formatCurrentSyncDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, "0");
  return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
}

export function extractPhotoUrl(raw: string): string {
  if (!raw) return "";
  const m = raw.match(/https?:\/\/[^\s"'<>\)]+/i);
  return m ? m[0] : (raw.startsWith("http") ? raw : "");
}

export function getBatchTimingSlot(batchDetails?: string, fallback?: string): string {
  if (!batchDetails) return fallback || "10:30 AM - 01:30 PM";
  const b = batchDetails.trim().toUpperCase();
  if (b.startsWith("E")) return "07:00 AM - 10:00 AM";
  if (b.startsWith("M")) return "10:30 AM - 01:30 PM";
  if (b.startsWith("A")) return "02:30 PM - 05:30 PM";
  if (b.startsWith("N")) return "06:00 PM - 09:00 PM";
  return fallback || "10:30 AM - 01:30 PM";
}

export async function fetchLiveReport(reportUrl: string): Promise<string> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const fetchUrl = `${reportUrl}?_t=${Date.now()}_${attempt}`;
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
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 600 * attempt));
      }
    }
  }
  throw lastError || new Error(`Failed to fetch report from ${reportUrl}`);
}

export async function syncWithZohoLive(clientSyncTime?: string): Promise<{
  success: boolean;
  count: number;
  totalEnrolls: number;
  activeCount: number;
  refundedCount: number;
  newCount: number;
  updatedCount: number;
  lastSync: string;
  latestStudent: string;
  csv: string;
  warning?: string;
}> {
  let enrollCsvText = "";
  let profCsvText = "";
  let fetchWarning = "";

  try {
    const [resEnroll, resProf] = await Promise.all([
      fetchLiveReport(MASTER_ENROLLMENT_REPORT_CSV_URL),
      fetchLiveReport(STUDENT_PROFILES_REPORT_CSV_URL)
    ]);
    enrollCsvText = resEnroll;
    profCsvText = resProf;
  } catch (err: any) {
    console.warn("[Zoho Sync Network Issue]:", err?.message || err);
    fetchWarning = "Zoho Creator connection was temporarily interrupted. Retained current database records.";
  }

  const csvPath = getFilePath("students_dataset.csv");
  let baseCsv = ZOHO_STUDENTS_CSV;
  if (fs.existsSync(csvPath)) {
    try {
      const diskData = await fs.promises.readFile(csvPath, "utf8");
      if (diskData && diskData.trim().length > 100) baseCsv = diskData;
    } catch (_) {}
  }

  if (!enrollCsvText || !profCsvText) {
    const parsedRows = parseCSVRows(baseCsv);
    const count = Math.max(0, parsedRows.length - 1);
    const formattedDate = clientSyncTime || formatCurrentSyncDate(new Date());

    let activeCount = 0;
    let refundedCount = 0;
    for (let i = 1; i < parsedRows.length; i++) {
      const st = (parsedRows[i][4] || "").toLowerCase();
      if (st === "active") activeCount++;
      if (st === "refunded") refundedCount++;
    }

    return {
      success: true,
      count,
      totalEnrolls: count,
      activeCount,
      refundedCount,
      newCount: 0,
      updatedCount: 0,
      lastSync: formattedDate,
      latestStudent: "",
      csv: baseCsv,
      warning: fetchWarning
    };
  }

  const enrollRows = parseCSVRows(enrollCsvText);
  const profRows = parseCSVRows(profCsvText);

  const enrollHeaders = enrollRows[0].map(h => h.trim().toLowerCase());
  const profHeaders = profRows[0].map(h => h.trim().toLowerCase());

  const getEnrollVal = (row: string[], col: string) => {
    const idx = enrollHeaders.findIndex(h => h.includes(col.toLowerCase()));
    return idx !== -1 ? (row[idx] || "").trim() : "";
  };
  const getProfVal = (row: string[], col: string) => {
    const idx = profHeaders.findIndex(h => h.includes(col.toLowerCase()));
    return idx !== -1 ? (row[idx] || "").trim() : "";
  };

  const profMap = new Map<string, string[]>();
  for (let i = 1; i < profRows.length; i++) {
    const r = profRows[i];
    if (!r || r.length <= 1) continue;
    const idName = getProfVal(r, "id - student name");
    const m = idName.match(/\b(I\d{2}[A-Za-z]\d{3,4})\b/i);
    const sid = m ? m[1].toUpperCase() : (idName.split("-")[0] || idName).trim().toUpperCase();
    if (sid) {
      profMap.set(sid, r);
    }
  }

  const parsedRows = parseCSVRows(baseCsv);
  const rawHeaders = parsedRows[0] || [];
  const normalizedHeaders = rawHeaders.map(h => h.trim().toLowerCase());

  const existingMap = new Map<string, Record<string, string>>();
  for (let i = 1; i < parsedRows.length; i++) {
    const vals = parsedRows[i];
    if (vals.length === 0 || (vals.length === 1 && !vals[0])) continue;
    const rowObj: Record<string, string> = {};
    normalizedHeaders.forEach((h, idx) => {
      const canonicalHeader = CANONICAL_CSV_HEADERS.find(ch => ch.toLowerCase() === h) || h;
      rowObj[canonicalHeader] = vals[idx] || "";
    });
    const studentId = (rowObj["Student ID"] || `row_${i}`).trim().toUpperCase();
    existingMap.set(studentId, rowObj);
  }

  const finalRecords: Record<string, string>[] = [];
  const seenIds = new Set<string>();
  let totalActive = 0;
  let totalRefunded = 0;
  let updatedCount = 0;
  let newCount = 0;

  for (let i = 1; i < enrollRows.length; i++) {
    const er = enrollRows[i];
    if (!er || er.length <= 1) continue;

    const rawSid = getEnrollVal(er, "student id");
    const sid = rawSid.toUpperCase();
    if (!sid || seenIds.has(sid)) continue;
    seenIds.add(sid);

    const masterStatus = getEnrollVal(er, "active status") || "Active";
    const fullName = getEnrollVal(er, "full name");
    const mobile = getEnrollVal(er, "mobile number");
    const email = getEnrollVal(er, "email");
    const batch = getEnrollVal(er, "batch details");
    const centre = getEnrollVal(er, "centre name");
    const enrolledOn = getEnrollVal(er, "enrolled on");
    const gender = getEnrollVal(er, "gender");
    const state = getEnrollVal(er, "state");
    const track = getEnrollVal(er, "preferred job track");

    const stLower = masterStatus.toLowerCase();
    if (stLower === "refunded") {
      totalRefunded++;
    } else {
      totalActive++;
    }

    const pr = profMap.get(sid);
    const existing = existingMap.get(sid);

    if (existing) updatedCount++;
    else newCount++;

    const photo = pr ? extractPhotoUrl(getProfVal(pr, "profile photo")) : (existing?.["Profile Photo"] || "");
    const resume = pr ? extractPhotoUrl(getProfVal(pr, "your resume")) : (existing?.["Resume"] || "");

    const studentRow: Record<string, string> = {
      "Full Name": (pr ? getProfVal(pr, "your full name") : "") || fullName || existing?.["Full Name"] || "",
      "User ID": (pr ? getProfVal(pr, "instructor name") : "") || sid || existing?.["User ID"] || "",
      "Student ID": sid,
      "Mobile Number": mobile || (pr ? getProfVal(pr, "register mobile number") : "") || existing?.["Mobile Number"] || "",
      "Active Status": masterStatus,
      "Enrolled on": enrolledOn || (pr ? getProfVal(pr, "orientation day") : "") || existing?.["Enrolled on"] || "",
      "Batch Details": batch || (pr ? getProfVal(pr, "batch details") : "") || existing?.["Batch Details"] || "",
      "Batch Timing": getBatchTimingSlot(batch || (pr ? getProfVal(pr, "batch details") : ""), existing?.["Batch Timing"]),
      "Gender": gender || existing?.["Gender"] || "",
      "Preferred Job Track": track || (pr ? getProfVal(pr, "graduation stream") : "") || existing?.["Preferred Job Track"] || "",
      "Your Personal Mail ID": email || (pr ? getProfVal(pr, "your personal mail id") : "") || existing?.["Your Personal Mail ID"] || "",
      "Permanent Address District": (pr ? getProfVal(pr, "permanent address district") : "") || existing?.["Permanent Address District"] || "",
      "Permanent State": (pr ? getProfVal(pr, "permanent state") : "") || state || existing?.["Permanent State"] || "",
      "Permanent Address Pincode": existing?.["Permanent Address Pincode"] || "",
      "Highest Qualification": (pr ? getProfVal(pr, "graduation degree name") : "") || existing?.["Highest Qualification"] || "",
      "Graduation Degree Name": (pr ? getProfVal(pr, "graduation degree name") : "") || existing?.["Graduation Degree Name"] || "",
      "Graduation Stream": (pr ? getProfVal(pr, "graduation stream") : "") || existing?.["Graduation Stream"] || "",
      "Graduation College / University Name": (pr ? getProfVal(pr, "graduation college / university name") : "") || existing?.["Graduation College / University Name"] || "",
      "Graduation Year of Passing": (pr ? getProfVal(pr, "graduation year of passing") : "") || existing?.["Graduation Year of Passing"] || "",
      "Graduation CGPA ": (pr ? getProfVal(pr, "graduation cgpa / percentage obtained") : "") || existing?.["Graduation CGPA "] || "",
      "Post-Graduation Degree Name": existing?.["Post-Graduation Degree Name"] || "",
      "Post-Graduation Stream": existing?.["Post-Graduation Stream"] || "",
      "Post-Graduation College / University Name": existing?.["Post-Graduation College / University Name"] || "",
      "Post Graduation Year of Passing": existing?.["Post Graduation Year of Passing"] || "",
      "Post Graduation CGPA / Percentage Obtained": existing?.["Post Graduation CGPA / Percentage Obtained"] || "",
      "Placed Organisation": (pr ? getProfVal(pr, "placed organisation") : "") || existing?.["Placed Organisation"] || "",
      "External Placed Organisation": (pr ? getProfVal(pr, "external placed organisation") : "") || existing?.["External Placed Organisation"] || "",
      "Placement Type": (pr ? getProfVal(pr, "placed through") : "") || existing?.["Placement Type"] || "",
      "Placed Month": existing?.["Placed Month"] || "",
      "CTC(LPA)": existing?.["CTC(LPA)"] || "",
      "Profile Photo": photo,
      "Resume": resume,
      "Instructor Name": (pr ? getProfVal(pr, "instructor name") : "") || existing?.["Instructor Name"] || "",
      "Centre Name": centre || (pr ? getProfVal(pr, "centre name") : "") || existing?.["Centre Name"] || ""
    };

    finalRecords.push(studentRow);
  }

  for (let i = 1; i < profRows.length; i++) {
    const pr = profRows[i];
    if (!pr || pr.length <= 1) continue;
    const idName = getProfVal(pr, "id - student name");
    const m = idName.match(/\b(I\d{2}[A-Za-z]\d{3,4})\b/i);
    const sid = m ? m[1].toUpperCase() : (idName.split("-")[0] || idName).trim().toUpperCase();
    if (!sid || seenIds.has(sid)) continue;
    seenIds.add(sid);

    const st = getProfVal(pr, "active status") || "Active";
    if (st.toLowerCase() === "active") totalActive++;
    else if (st.toLowerCase() === "refunded") totalRefunded++;

    finalRecords.push({
      "Full Name": getProfVal(pr, "your full name"),
      "User ID": getProfVal(pr, "instructor name") || sid,
      "Student ID": sid,
      "Mobile Number": getProfVal(pr, "register mobile number"),
      "Active Status": st,
      "Enrolled on": getProfVal(pr, "orientation day"),
      "Batch Details": getProfVal(pr, "batch details"),
      "Batch Timing": getBatchTimingSlot(getProfVal(pr, "batch details")),
      "Gender": "",
      "Preferred Job Track": getProfVal(pr, "graduation stream"),
      "Your Personal Mail ID": getProfVal(pr, "your personal mail id"),
      "Permanent Address District": getProfVal(pr, "permanent address district"),
      "Permanent State": getProfVal(pr, "permanent state"),
      "Permanent Address Pincode": "",
      "Highest Qualification": getProfVal(pr, "graduation degree name"),
      "Graduation Degree Name": getProfVal(pr, "graduation degree name"),
      "Graduation Stream": getProfVal(pr, "graduation stream"),
      "Graduation College / University Name": getProfVal(pr, "graduation college / university name"),
      "Graduation Year of Passing": getProfVal(pr, "graduation year of passing"),
      "Graduation CGPA ": getProfVal(pr, "graduation cgpa / percentage obtained"),
      "Post-Graduation Degree Name": "",
      "Post-Graduation Stream": "",
      "Post-Graduation College / University Name": "",
      "Post Graduation Year of Passing": "",
      "Post Graduation CGPA / Percentage Obtained": "",
      "Placed Organisation": getProfVal(pr, "placed organisation"),
      "External Placed Organisation": getProfVal(pr, "external placed organisation"),
      "Placement Type": getProfVal(pr, "placed through"),
      "Placed Month": "",
      "CTC(LPA)": "",
      "Profile Photo": extractPhotoUrl(getProfVal(pr, "profile photo")),
      "Resume": extractPhotoUrl(getProfVal(pr, "your resume")),
      "Instructor Name": getProfVal(pr, "instructor name"),
      "Centre Name": getProfVal(pr, "centre name")
    });
  }

  finalRecords.sort((a, b) => (a["Student ID"] || "").localeCompare(b["Student ID"] || "", undefined, { numeric: true, sensitivity: "base" }));

  const headerLine = CANONICAL_CSV_HEADERS.join(",");
  const rowLines = finalRecords.map(rec => CANONICAL_CSV_HEADERS.map(h => escapeCSVValue(rec[h] || "")).join(","));
  const updatedCsv = [headerLine, ...rowLines].join("\n");

  try {
    await fs.promises.writeFile(csvPath, updatedCsv, "utf8");
  } catch (_) {}

  const formattedDate = clientSyncTime || formatCurrentSyncDate(new Date());
  const latestStudentName = getEnrollVal(enrollRows[1], "full name") || getEnrollVal(enrollRows[1], "student id");

  const syncInfo = {
    lastSync: formattedDate,
    updatedAt: new Date().toISOString(),
    source: "Zoho Creator Master Enrollments & Profiles Report",
    totalCount: finalRecords.length,
    activeCount: totalActive,
    refundedCount: totalRefunded,
    newCount,
    updatedCount,
    latestStudent: latestStudentName
  };

  const syncInfoPath = getFilePath("zoho_sync_info.json");
  try {
    await fs.promises.writeFile(syncInfoPath, JSON.stringify(syncInfo, null, 2), "utf8");
  } catch (_) {}

  return {
    success: true,
    count: finalRecords.length,
    totalEnrolls: finalRecords.length,
    activeCount: totalActive,
    refundedCount: totalRefunded,
    newCount,
    updatedCount,
    lastSync: formattedDate,
    latestStudent: latestStudentName,
    csv: updatedCsv
  };
}

export async function getSyncInfo() {
  const syncInfoPath = getFilePath("zoho_sync_info.json");
  if (fs.existsSync(syncInfoPath)) {
    try {
      const data = JSON.parse(await fs.promises.readFile(syncInfoPath, "utf8"));
      return data;
    } catch (_) {}
  }
  return {
    lastSync: formatCurrentSyncDate(new Date()),
    updatedAt: new Date().toISOString(),
    source: "Zoho Creator Master Enrollments Report",
    totalCount: 1768,
    activeCount: 1725,
    refundedCount: 42
  };
}

export async function persistSyncInfo(info: any) {
  const syncInfoPath = getFilePath("zoho_sync_info.json");
  await fs.promises.writeFile(syncInfoPath, JSON.stringify(info, null, 2), "utf8");
}
