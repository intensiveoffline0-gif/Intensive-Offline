import fs from "fs";
import path from "path";

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

export function escapeCSVValue(val) {
  if (!val) return "";
  const s = String(val).trim();
  if (s.includes(",") || s.includes("\"") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, "\"\"")}"`;
  }
  return s;
}

export function parseCSVRows(csv) {
  const rows = [];
  let currentRow = [];
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

export async function fetchWithRetry(url, maxRetries = 3) {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${url}?_t=${Date.now()}_${attempt}`, {
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
      });
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 100) return text;
      }
    } catch (e) {
      lastErr = e;
    }
    await new Promise(r => setTimeout(r, 600 * attempt));
  }
  throw lastErr || new Error(`Failed to fetch report from ${url}`);
}

export async function mergeZohoReports() {
  console.log("[Zoho Sync] Fetching both master enrollments and profile submissions reports...");
  const [enrollCsv, profCsv] = await Promise.all([
    fetchWithRetry(MASTER_ENROLLMENT_REPORT_CSV_URL),
    fetchWithRetry(STUDENT_PROFILES_REPORT_CSV_URL)
  ]);

  const enrollRows = parseCSVRows(enrollCsv);
  const profRows = parseCSVRows(profCsv);

  const enrollHeaders = enrollRows[0].map(h => h.trim().toLowerCase());
  const profHeaders = profRows[0].map(h => h.trim().toLowerCase());

  const getEnrollVal = (row, col) => {
    const idx = enrollHeaders.findIndex(h => h.includes(col.toLowerCase()));
    return idx !== -1 ? (row[idx] || "").trim() : "";
  };
  const getProfVal = (row, col) => {
    const idx = profHeaders.findIndex(h => h.includes(col.toLowerCase()));
    return idx !== -1 ? (row[idx] || "").trim() : "";
  };

  const extractPhotoUrl = (raw) => {
    if (!raw) return "";
    const m = raw.match(/https?:\/\/[^\s"'<>\)]+/i);
    return m ? m[0] : (raw.startsWith("http") ? raw : "");
  };

  // Build profile lookup map
  const profMap = new Map();
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

  const finalRecords = [];
  const seenIds = new Set();
  let totalActive = 0;
  let totalRefunded = 0;
  let changedProgramCount = 0;

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
    if (stLower === "active") totalActive++;
    else if (stLower === "refunded") totalRefunded++;
    else if (stLower.includes("changed") || stLower.includes("program")) changedProgramCount++;

    const pr = profMap.get(sid);

    const record = {
      "Full Name": (pr ? getProfVal(pr, "your full name") : "") || fullName,
      "User ID": (pr ? getProfVal(pr, "instructor name") : "") || sid,
      "Student ID": sid,
      "Mobile Number": mobile || (pr ? getProfVal(pr, "register mobile number") : ""),
      "Active Status": masterStatus,
      "Enrolled on": enrolledOn || (pr ? getProfVal(pr, "orientation day") : ""),
      "Batch Details": batch || (pr ? getProfVal(pr, "batch details") : ""),
      "Batch Timing": "9:00 AM - 1:00 PM",
      "Gender": gender || "",
      "Preferred Job Track": track || (pr ? getProfVal(pr, "graduation stream") : ""),
      "Your Personal Mail ID": email || (pr ? getProfVal(pr, "your personal mail id") : ""),
      "Permanent Address District": pr ? getProfVal(pr, "permanent address district") : "",
      "Permanent State": state || (pr ? getProfVal(pr, "permanent state") : ""),
      "Permanent Address Pincode": "",
      "Highest Qualification": pr ? getProfVal(pr, "graduation degree name") : "",
      "Graduation Degree Name": pr ? getProfVal(pr, "graduation degree name") : "",
      "Graduation Stream": pr ? getProfVal(pr, "graduation stream") : "",
      "Graduation College / University Name": pr ? getProfVal(pr, "graduation college / university name") : "",
      "Graduation Year of Passing": pr ? getProfVal(pr, "graduation year of passing") : "",
      "Graduation CGPA ": pr ? getProfVal(pr, "graduation cgpa / percentage obtained") : "",
      "Post-Graduation Degree Name": "",
      "Post-Graduation Stream": "",
      "Post-Graduation College / University Name": "",
      "Post Graduation Year of Passing": "",
      "Post Graduation CGPA / Percentage Obtained": "",
      "Placed Organisation": pr ? getProfVal(pr, "placed organisation") : "",
      "External Placed Organisation": pr ? getProfVal(pr, "external placed organisation") : "",
      "Placement Type": pr ? getProfVal(pr, "placed through") : "",
      "Placed Month": "",
      "CTC(LPA)": "",
      "Profile Photo": pr ? extractPhotoUrl(getProfVal(pr, "profile photo")) : "",
      "Resume": pr ? extractPhotoUrl(getProfVal(pr, "your resume")) : "",
      "Instructor Name": pr ? getProfVal(pr, "instructor name") : "",
      "Centre Name": centre || (pr ? getProfVal(pr, "centre name") : "")
    };

    finalRecords.push(record);
  }

  // Also include any profiles in profMap that may not be in enrollRows (if any)
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
      "Batch Timing": "9:00 AM - 1:00 PM",
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

  // Sort by Student ID numerically/alphabetically
  finalRecords.sort((a, b) => (a["Student ID"] || "").localeCompare(b["Student ID"] || "", undefined, { numeric: true, sensitivity: "base" }));

  const headerLine = CANONICAL_CSV_HEADERS.join(",");
  const rowLines = finalRecords.map(rec => CANONICAL_CSV_HEADERS.map(h => escapeCSVValue(rec[h] || "")).join(","));
  const csvContent = [headerLine, ...rowLines].join("\n");

  return {
    totalEnrolls: finalRecords.length,
    activeLearners: totalActive,
    refundsCount: totalRefunded,
    changedProgramCount,
    csv: csvContent
  };
}

// If run directly
if (process.argv[1]?.endsWith("syncReports.js")) {
  mergeZohoReports().then(res => {
    console.log("[Merge Result]:");
    console.log("- Total Enrolls:", res.totalEnrolls);
    console.log("- Active Learners:", res.activeLearners);
    console.log("- Refunds Count:", res.refundsCount);
    console.log("- Changed Program:", res.changedProgramCount);
    console.log("- CSV length:", res.csv.length);

    // Save to disk CSV_FILE_PATH so server immediately loads it
    const dataDir = path.resolve("./data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, "students_dataset.csv"), res.csv, "utf8");
    console.log("Successfully wrote data/students_dataset.csv!");

    // Update src/data/zohoStudentsCSV.ts
    const exportFileContent = `// Auto-generated bundled snapshot of Master Enrolls & Profiles Zoho report\nexport const ZOHO_STUDENTS_CSV = ${JSON.stringify(res.csv)};\n`;
    fs.writeFileSync(path.resolve("./src/data/zohoStudentsCSV.ts"), exportFileContent, "utf8");
    console.log("Successfully updated src/data/zohoStudentsCSV.ts!");
  }).catch(err => {
    console.error("Error merging reports:", err);
  });
}
