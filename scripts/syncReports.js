import fs from "fs";
import path from "path";

export const MASTER_ENROLLMENT_REPORT_CSV_URL = "https://creatorapp.zohopublic.in/nxtwave/intensive-offline/csv/Students_Data_Report/y4KgkdzE1CXYTUnwEBs1zantAYKaBw108xs9z3njNj6V2sB3hS7GBuaGjkTVHV8wZqMVzGRNtVQpp3O5sAAmF3dQWYD8T5f6UpNh";
export const STUDENT_PROFILES_REPORT_CSV_URL = "https://creatorapp.zohopublic.in/nxtwave/intensive-offline/csv/Student_Profiles_AI_Studio/CFJq3KyZ7QMmMa2a5tU0e8Artb5F9qTeU79eaWB4Te28b9DXGP60vg46uyJJVyRpOfxXG9MfpSUh2Gsq0RG9hbERxRORC2J4MWY0";
export const STUDENT_PROFILES_REPORT_JSON_URL = "https://creatorapp.zohopublic.in/nxtwave/intensive-offline/json/Student_Profiles_AI_Studio/CFJq3KyZ7QMmMa2a5tU0e8Artb5F9qTeU79eaWB4Te28b9DXGP60vg46uyJJVyRpOfxXG9MfpSUh2Gsq0RG9hbERxRORC2J4MWY0";
export const ZOHO_PROFILES_PERMA_KEY = "CFJq3KyZ7QMmMa2a5tU0e8Artb5F9qTeU79eaWB4Te28b9DXGP60vg46uyJJVyRpOfxXG9MfpSUh2Gsq0RG9hbERxRORC2J4MWY0";

export function buildZohoDownloadUrl(recordId, fieldName, rawPath) {
  if (!rawPath || !recordId) return "";
  if (rawPath.startsWith("http")) return rawPath;
  const filename = rawPath.split("/image/")[1] || rawPath.split("/download/")[1] || rawPath.split("/").pop();
  if (!filename) return "";
  return `https://creatorapp.zohopublic.in/nxtwave/intensive-offline/report/Student_Profiles_AI_Studio/${recordId}/${fieldName}/download-file/${ZOHO_PROFILES_PERMA_KEY}?filepath=/${filename}&digestValue=eyJsYW5ndWFnZSI6IiJ9`;
}

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
  console.log("[Zoho Sync] Fetching master enrollments CSV and student profiles report...");
  
  // Fetch enrollments CSV and profiles JSON in parallel
  let enrollCsv = "";
  let profList = [];

  try {
    const [enrollRes, jsonRes] = await Promise.all([
      fetchWithRetry(MASTER_ENROLLMENT_REPORT_CSV_URL),
      fetch(STUDENT_PROFILES_REPORT_JSON_URL).then(r => r.json()).catch(() => null)
    ]);
    enrollCsv = enrollRes;
    if (jsonRes && Array.isArray(jsonRes.Student_Profiles_AI_Studio)) {
      profList = jsonRes.Student_Profiles_AI_Studio;
      console.log(`[Zoho Sync] Successfully fetched ${profList.length} profiles from JSON endpoint.`);
    }
  } catch (err) {
    console.warn("[Zoho Sync] Error during primary fetch:", err);
  }

  // Fallback to CSV if JSON was unavailable
  if (profList.length === 0) {
    console.log("[Zoho Sync] Falling back to Student Profiles CSV...");
    try {
      const profCsv = await fetchWithRetry(STUDENT_PROFILES_REPORT_CSV_URL);
      const profRows = parseCSVRows(profCsv);
      const profHeaders = profRows[0].map(h => h.trim().toLowerCase());
      const getProfVal = (row, col) => {
        const idx = profHeaders.findIndex(h => h.includes(col.toLowerCase()));
        return idx !== -1 ? (row[idx] || "").trim() : "";
      };
      for (let i = 1; i < profRows.length; i++) {
        const r = profRows[i];
        if (!r || r.length <= 1) continue;
        profList.push({
          ID_Student_Name: getProfVal(r, "id - student name"),
          Your_Full_Name: getProfVal(r, "your full name"),
          Profile_Photo: getProfVal(r, "profile photo"),
          Your_Personal_Mail_ID: getProfVal(r, "your personal mail id"),
          Register_Mobile_Number: getProfVal(r, "register mobile number"),
          Batch_Details: getProfVal(r, "batch details"),
          Active_Status: getProfVal(r, "active status"),
          Graduation_College_University_Name1: getProfVal(r, "graduation college / university name"),
          Graduation_Degree_Name: getProfVal(r, "graduation degree name"),
          Graduation_Stream_new: getProfVal(r, "graduation stream"),
          Graduation_Year_of_Passing: getProfVal(r, "graduation year of passing"),
          Graduation_CGPA_Percentage_Obtained: getProfVal(r, "graduation cgpa / percentage obtained"),
          Your_Resume: getProfVal(r, "your resume"),
          Permanent_Address_District: getProfVal(r, "permanent address district"),
          Permanent_State: getProfVal(r, "permanent state"),
          Orientation_Day: getProfVal(r, "orientation day"),
          Placed_Through: getProfVal(r, "placed through"),
          Placed_Organisation: getProfVal(r, "placed organisation"),
          External_Placed_Organisation: getProfVal(r, "external placed organisation"),
          Instructor_Name: getProfVal(r, "instructor name"),
          Centre_Name: getProfVal(r, "centre name")
        });
      }
    } catch (e) {
      console.error("[Zoho Sync] Fallback CSV fetch failed:", e);
    }
  }

  const enrollRows = parseCSVRows(enrollCsv);
  const enrollHeaders = enrollRows[0].map(h => h.trim().toLowerCase());

  const getEnrollVal = (row, col) => {
    const idx = enrollHeaders.findIndex(h => h.includes(col.toLowerCase()));
    return idx !== -1 ? (row[idx] || "").trim() : "";
  };

  // Build profile lookup map
  const profMap = new Map();
  for (const item of profList) {
    const idName = (item.ID_Student_Name || "").trim();
    const m = idName.match(/\b(I\d{2}[A-Za-z]\d{3,4})\b/i);
    const sid = m ? m[1].toUpperCase() : (idName.split("-")[0] || idName).trim().toUpperCase();
    if (sid) {
      profMap.set(sid, item);
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

    const photoUrl = pr ? buildZohoDownloadUrl(pr.ID, "Profile_Photo", pr.Profile_Photo) : "";
    const resumeUrl = pr ? buildZohoDownloadUrl(pr.ID, "Your_Resume", pr.Your_Resume) : "";

    const record = {
      "Full Name": (pr ? pr.Your_Full_Name : "") || fullName,
      "User ID": (pr ? pr.Instructor_Name : "") || sid,
      "Student ID": sid,
      "Mobile Number": mobile || (pr ? pr.Register_Mobile_Number : ""),
      "Active Status": masterStatus,
      "Enrolled on": enrolledOn || (pr ? pr.Orientation_Day : ""),
      "Batch Details": batch || (pr ? pr.Batch_Details : ""),
      "Batch Timing": "9:00 AM - 1:00 PM",
      "Gender": gender || "",
      "Preferred Job Track": track || (pr ? pr.Graduation_Stream_new : ""),
      "Your Personal Mail ID": email || (pr ? pr.Your_Personal_Mail_ID : ""),
      "Permanent Address District": pr ? (pr.Permanent_Address_District || "") : "",
      "Permanent State": (pr ? pr.Permanent_State : "") || state,
      "Permanent Address Pincode": "",
      "Highest Qualification": pr ? (pr.Graduation_Degree_Name || "") : "",
      "Graduation Degree Name": pr ? (pr.Graduation_Degree_Name || "") : "",
      "Graduation Stream": pr ? (pr.Graduation_Stream_new || "") : "",
      "Graduation College / University Name": pr ? (pr.Graduation_College_University_Name1 || "") : "",
      "Graduation Year of Passing": pr ? (pr.Graduation_Year_of_Passing || "") : "",
      "Graduation CGPA ": pr ? (pr.Graduation_CGPA_Percentage_Obtained || "") : "",
      "Post-Graduation Degree Name": "",
      "Post-Graduation Stream": "",
      "Post-Graduation College / University Name": "",
      "Post Graduation Year of Passing": "",
      "Post Graduation CGPA / Percentage Obtained": "",
      "Placed Organisation": pr ? (pr.Placed_Organisation || "") : "",
      "External Placed Organisation": pr ? (pr.External_Placed_Organisation || "") : "",
      "Placement Type": pr ? (pr.Placed_Through || "") : "",
      "Placed Month": "",
      "CTC(LPA)": "",
      "Profile Photo": photoUrl,
      "Resume": resumeUrl,
      "Instructor Name": pr ? (pr.Instructor_Name || "") : "",
      "Centre Name": centre || (pr ? pr.Centre_Name : "")
    };

    finalRecords.push(record);
  }

  // Also include any profiles in profMap that may not be in enrollRows (if any)
  for (const [sid, pr] of profMap.entries()) {
    if (!sid || seenIds.has(sid)) continue;
    seenIds.add(sid);

    const st = pr.Active_Status || "Active";
    if (st.toLowerCase() === "active") totalActive++;
    else if (st.toLowerCase() === "refunded") totalRefunded++;

    const photoUrl = buildZohoDownloadUrl(pr.ID, "Profile_Photo", pr.Profile_Photo);
    const resumeUrl = buildZohoDownloadUrl(pr.ID, "Your_Resume", pr.Your_Resume);

    finalRecords.push({
      "Full Name": pr.Your_Full_Name || "",
      "User ID": pr.Instructor_Name || sid,
      "Student ID": sid,
      "Mobile Number": pr.Register_Mobile_Number || "",
      "Active Status": st,
      "Enrolled on": pr.Orientation_Day || "",
      "Batch Details": pr.Batch_Details || "",
      "Batch Timing": "9:00 AM - 1:00 PM",
      "Gender": "",
      "Preferred Job Track": pr.Graduation_Stream_new || "",
      "Your Personal Mail ID": pr.Your_Personal_Mail_ID || "",
      "Permanent Address District": pr.Permanent_Address_District || "",
      "Permanent State": pr.Permanent_State || "",
      "Permanent Address Pincode": "",
      "Highest Qualification": pr.Graduation_Degree_Name || "",
      "Graduation Degree Name": pr.Graduation_Degree_Name || "",
      "Graduation Stream": pr.Graduation_Stream_new || "",
      "Graduation College / University Name": pr.Graduation_College_University_Name1 || "",
      "Graduation Year of Passing": pr.Graduation_Year_of_Passing || "",
      "Graduation CGPA ": pr.Graduation_CGPA_Percentage_Obtained || "",
      "Post-Graduation Degree Name": "",
      "Post-Graduation Stream": "",
      "Post-Graduation College / University Name": "",
      "Post Graduation Year of Passing": "",
      "Post Graduation CGPA / Percentage Obtained": "",
      "Placed Organisation": pr.Placed_Organisation || "",
      "External Placed Organisation": pr.External_Placed_Organisation || "",
      "Placement Type": pr.Placed_Through || "",
      "Placed Month": "",
      "CTC(LPA)": "",
      "Profile Photo": photoUrl,
      "Resume": resumeUrl,
      "Instructor Name": pr.Instructor_Name || "",
      "Centre Name": pr.Centre_Name || ""
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
