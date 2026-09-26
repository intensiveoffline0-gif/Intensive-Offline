import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable JSON request body parsing up to 10MB to support large student datasets
app.use(express.json({ limit: "10mb" }));

// Enable URL-encoded request body parsing (with extended support) up to 10MB for Zoho Creator webhook form-POSTs
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Enable raw text parsing for text/csv and text/plain to support raw webhook payloads from Zoho Creator
app.use(express.text({ type: ["text/csv", "text/plain"], limit: "10mb" }));

// Lazy initializer for Gemini client to prevent crashes if key is initially absent
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in your Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Resilient helper to call Gemini with automatic retries, exponential backoff, and model fallbacks
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    model: string;
    contents: string;
    config: any;
  },
  retries = 3,
  delayMs = 1000
): Promise<any> {
  const modelsToTry = [params.model, "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[AI] Attempting generation with model "${model}" (attempt ${attempt}/${retries})...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`[AI Warning] Attempt ${attempt} with model ${model} failed: ${errMsg}`);
        
        // Skip retrying if key is invalid or argument is wrong
        if (errMsg.includes("400") || errMsg.includes("INVALID_ARGUMENT") || errMsg.includes("API key")) {
          throw err;
        }

        // Wait with exponential backoff before the next attempt
        if (attempt < retries) {
          const waitTime = delayMs * Math.pow(2, attempt - 1);
          console.log(`[AI] Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }
    console.log(`[AI] Model "${model}" failed all ${retries} attempts. Trying fallback model...`);
  }

  throw lastError;
}

const CSV_FILE_PATH = path.join(process.cwd(), "custom_students.csv");
const LOGO_FILE_PATH = path.join(process.cwd(), "custom_logo.txt");
const SYNC_INFO_FILE_PATH = path.join(process.cwd(), "zoho_sync_info.json");

// GET endpoint to fetch latest Zoho sync timestamp
app.get("/api/zoho/sync", async (req, res) => {
  try {
    if (fs.existsSync(SYNC_INFO_FILE_PATH)) {
      const data = await fs.promises.readFile(SYNC_INFO_FILE_PATH, "utf8");
      return res.json(JSON.parse(data));
    }
    return res.json({ lastSync: null });
  } catch (error: any) {
    return res.json({ lastSync: null });
  }
});

// POST endpoint to update latest Zoho sync timestamp
app.post("/api/zoho/sync", async (req, res) => {
  try {
    const { syncDate } = req.body || {};
    const info = {
      lastSync: syncDate || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "Zoho Creator Live Report"
    };
    await fs.promises.writeFile(SYNC_INFO_FILE_PATH, JSON.stringify(info, null, 2), "utf8");
    return res.json({ success: true, ...info });
  } catch (error: any) {
    console.error("Error saving Zoho sync info:", error);
    return res.status(500).json({ error: "Failed to persist Zoho sync date" });
  }
});

// GET endpoint to fetch persisted logo if it exists
app.get("/api/logo", async (req, res) => {
  try {
    if (fs.existsSync(LOGO_FILE_PATH)) {
      const data = await fs.promises.readFile(LOGO_FILE_PATH, "utf8");
      return res.json({ logo: data });
    }
    return res.json({ logo: null });
  } catch (error: any) {
    console.error("Error reading custom logo:", error);
    return res.status(500).json({ error: "Failed to read persistent logo" });
  }
});

// POST endpoint to update/reset persisted logo
app.post("/api/logo", async (req, res) => {
  try {
    const { logo, pin } = req.body;
    const expectedPin = process.env.ADMIN_PIN || "admin0929";
    if (pin !== "admin0929" && pin !== process.env.ADMIN_PIN) {
      return res.status(401).json({ error: "Unauthorized: Invalid Admin PIN." });
    }
    if (logo === null || logo === "") {
      if (fs.existsSync(LOGO_FILE_PATH)) {
        await fs.promises.unlink(LOGO_FILE_PATH);
      }
      console.log("Persisted logo successfully cleared.");
      return res.json({ success: true, logo: null });
    }
    if (typeof logo !== "string") {
      return res.status(400).json({ error: "Invalid payload: 'logo' must be a raw base64 string." });
    }
    await fs.promises.writeFile(LOGO_FILE_PATH, logo, "utf8");
    console.log(`Persisted logo update successfully saved. Size: ${logo.length} bytes`);
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error writing custom logo:", error);
    return res.status(500).json({ error: "Failed to persist uploaded logo to server storage." });
  }
});

// GET endpoint to fetch persisted CSV if it exists
app.get("/api/csv", async (req, res) => {
  try {
    if (fs.existsSync(CSV_FILE_PATH)) {
      const data = await fs.promises.readFile(CSV_FILE_PATH, "utf8");
      return res.json({ csv: data, source: "persistent" });
    }
    return res.json({ csv: "", source: "fallback" });
  } catch (error: any) {
    console.error("Error reading custom CSV:", error);
    return res.status(500).json({ error: "Failed to read persistent CSV" });
  }
});

// POST endpoint to update persisted CSV or upsert individual student profiles
const CANONICAL_HEADERS_STR = "Full Name,User ID,Student ID,Mobile Number,Active Status,Enrolled on,Batch Details,Batch Timing,Gender,Preferred Job Track,Your Personal Mail ID,Permanent Address District,Permanent State,Permanent Address Pincode,Highest Qualification,Graduation Degree Name,Graduation Stream,Graduation College / University Name,Graduation Year of Passing,Graduation CGPA ,Post-Graduation Degree Name,Post-Graduation Stream,Post-Graduation College / University Name,Post Graduation Year of Passing,Post Graduation CGPA / Percentage Obtained,Placed Organisation,External Placed Organisation,Placement Type,Placed Month,CTC(LPA)";

function getFieldByHeader(payload: any, header: string): string {
  const normHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  // Try exact match or normalized match in payload keys
  for (const key of Object.keys(payload)) {
    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normHeader === normKey) {
      return String(payload[key] ?? "");
    }
  }
  
  // Specific fallbacks for common names
  if (normHeader === "yourpersonalmailid" || normHeader === "personalmailid") {
    if (payload.email) return String(payload.email);
    if (payload.mail) return String(payload.mail);
  }
  if (normHeader === "district" && payload.permanentaddressdistrict) {
    return String(payload.permanentaddressdistrict);
  }
  if (normHeader === "permanentaddressdistrict" && payload.district) {
    return String(payload.district);
  }
  if (normHeader === "state" && payload.permanentstate) {
    return String(payload.permanentstate);
  }
  if (normHeader === "permanentstate" && payload.state) {
    return String(payload.state);
  }
  if (normHeader === "pincode" && payload.permanentaddresspincode) {
    return String(payload.permanentaddresspincode);
  }
  if (normHeader === "permanentaddresspincode" && payload.pincode) {
    return String(payload.pincode);
  }
  if (normHeader === "graduationcollegename" || normHeader === "graduationcollegeuniversityname") {
    if (payload.graduationcollege) return String(payload.graduationcollege);
  }
  if (normHeader === "postgraduationcollegename" || normHeader === "postgraduationcollegeuniversityname") {
    if (payload.postgraduationcollege) return String(payload.postgraduationcollege);
  }
  
  return "";
}

function escapeCSVValue(val: string): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

app.post("/api/csv", async (req, res) => {
  try {
    let csv = "";
    let pin = "";

    // 1. Extract Admin PIN from multiple sources (Query, Headers, or Body)
    if (req.query.pin) {
      pin = String(req.query.pin);
    } else if (req.headers["x-admin-pin"]) {
      pin = String(req.headers["x-admin-pin"]);
    } else if (req.headers["authorization"]) {
      const auth = String(req.headers["authorization"]);
      pin = auth.startsWith("Bearer ") ? auth.substring(7) : auth;
    }

    // 2. Normalize and check if payload is a single student or array of students (webhook)
    let isSingleStudentUpsert = false;
    let studentsToUpsert: any[] = [];

    // If body is a string, check if it's JSON
    if (typeof req.body === "string") {
      const trimmedBody = req.body.trim();
      if (trimmedBody.startsWith("{") || trimmedBody.startsWith("[")) {
        try {
          req.body = JSON.parse(trimmedBody);
        } catch (e) {
          // treat as raw CSV text
        }
      }
    }

    // Unwrap Zoho Creator standard data key if nested
    if (req.body && req.body.data && typeof req.body.data === "object" && !Array.isArray(req.body.data)) {
      if (req.body.pin && !pin) pin = req.body.pin;
      req.body = req.body.data;
    }

    if (typeof req.body === "string") {
      csv = req.body;
    } else if (req.body && typeof req.body === "object") {
      if (req.body.csv) {
        csv = req.body.csv;
        if (req.body.pin && !pin) pin = req.body.pin;
      } else if (Array.isArray(req.body)) {
        studentsToUpsert = req.body;
        isSingleStudentUpsert = true;
      } else {
        // Check if object represents a student record
        const keys = Object.keys(req.body).map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ""));
        const hasStudentKeys = keys.some(k => k.includes("studentid") || k.includes("userid") || k.includes("fullname") || k.includes("personalmail"));
        if (hasStudentKeys) {
          studentsToUpsert = [req.body];
          isSingleStudentUpsert = true;
        } else if (req.body.student || req.body.record) {
          const nested = req.body.student || req.body.record;
          if (typeof nested === "object") {
            studentsToUpsert = Array.isArray(nested) ? nested : [nested];
            isSingleStudentUpsert = true;
          }
        }
      }
    }

    // 3. Validation - Webhooks bypass PIN check if upserting valid student record(s) to ensure seamless updates from Zoho
    const expectedPin = process.env.ADMIN_PIN || "admin0929";
    const isWebhook = isSingleStudentUpsert && studentsToUpsert.length > 0;
    if (!isWebhook && pin !== "admin0929" && pin !== expectedPin) {
      console.warn(`[CSV Upload] Unauthorized access attempt with invalid PIN: "${pin}"`);
      return res.status(401).json({ error: "Unauthorized: Invalid Admin PIN or Authentication Header." });
    }

    // 4. Handle Single/Multiple Student Upserts (Webhook Flow)
    if (isWebhook) {
      let existingCsvStr = "";
      if (fs.existsSync(CSV_FILE_PATH)) {
        existingCsvStr = await fs.promises.readFile(CSV_FILE_PATH, "utf8");
      }
      
      if (!existingCsvStr || existingCsvStr.trim() === "") {
        existingCsvStr = CANONICAL_HEADERS_STR;
      }
      
      let rows = parseCSVRows(existingCsvStr);
      if (rows.length === 0) {
        rows = [CANONICAL_HEADERS_STR.split(",")];
      }
      
      const headers = rows[0].map(h => h.trim());
      const studentIdColIndex = headers.findIndex(h => h.toLowerCase().replace(/[^a-z0-9]/g, "") === "studentid");
      
      if (studentIdColIndex === -1) {
        return res.status(400).json({ error: "Invalid CSV format on server: 'Student ID' column not found." });
      }
      
      let upsertCount = 0;
      let insertCount = 0;
      
      for (const payload of studentsToUpsert) {
        const incomingStudentId = getFieldByHeader(payload, "Student ID");
        if (!incomingStudentId || incomingStudentId.trim() === "") {
          console.warn("[CSV Webhook] Skipped student with empty or missing Student ID in payload.");
          continue;
        }
        
        let existingRowIndex = -1;
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][studentIdColIndex] && rows[i][studentIdColIndex].trim().toUpperCase() === incomingStudentId.trim().toUpperCase()) {
            existingRowIndex = i;
            break;
          }
        }
        
        if (existingRowIndex !== -1) {
          const existingRow = rows[existingRowIndex];
          const newRow = headers.map((header, colIdx) => {
            const payloadVal = getFieldByHeader(payload, header);
            if (payloadVal !== undefined && payloadVal !== null && payloadVal.trim() !== "") {
              return payloadVal.trim();
            }
            return existingRow[colIdx] !== undefined ? existingRow[colIdx] : "";
          });
          rows[existingRowIndex] = newRow;
          upsertCount++;
        } else {
          const newRow = headers.map(header => {
            const payloadVal = getFieldByHeader(payload, header);
            return payloadVal !== undefined && payloadVal !== null ? payloadVal.trim() : "";
          });
          rows.push(newRow);
          insertCount++;
        }
      }
      
      const updatedCSV = rows.map(row => row.map(escapeCSVValue).join(",")).join("\n");
      await fs.promises.writeFile(CSV_FILE_PATH, updatedCSV, "utf8");
      console.log(`[CSV Webhook] Real-time upsert successful. Updated: ${upsertCount}, Inserted: ${insertCount}. Total records: ${rows.length - 1}`);
      
      return res.json({ 
        success: true, 
        message: `Successfully upserted student database. Updated: ${upsertCount}, Inserted: ${insertCount}.`,
        count: rows.length - 1 
      });
    }

    // 5. Handle standard Full CSV Overwrite
    if (!csv || typeof csv !== "string" || csv.trim() === "") {
      console.warn("[CSV Upload] Rejected empty or invalid CSV payload.");
      return res.status(400).json({ error: "Invalid payload: CSV content is empty or missing." });
    }

    await fs.promises.writeFile(CSV_FILE_PATH, csv, "utf8");
    console.log(`[CSV Upload] Persisted CSV successfully updated. Size: ${csv.length} bytes.`);
    return res.json({ success: true, count: csv.split("\n").filter(Boolean).length - 1 });
  } catch (error: any) {
    console.error("[CSV Upload] Error processing CSV payload:", error);
    return res.status(500).json({ error: "Failed to process or persist CSV payload to server storage." });
  }
});

// Helper to parse CSV rows safely respecting quotes and newlines inside quoted fields
function parseCSVRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
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
  
  return rows.map(row => row.map(v => {
    let s = v.trim();
    if (s.startsWith('"') && s.endsWith('"')) {
      s = s.substring(1, s.length - 1);
    }
    return s.trim();
  }));
}

// Helper to parse CSV lines safely respecting quotes
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(v => {
    let s = v.trim();
    if (s.startsWith('"') && s.endsWith('"')) {
      s = s.substring(1, s.length - 1);
    }
    return s.trim();
  });
}

const normalizeHeader = (h: string) => h.toLowerCase().trim().replace(/['"“”]/g, "").replace(/\s+/g, " ");

// Helper to parse incoming raw student CSV text into structured objects
function parseStudentCSVForAI(csvText: string): any[] {
  if (!csvText) return [];
  const rows = parseCSVRows(csvText);
  if (rows.length === 0) return [];

  const rawHeaders = rows[0];
  const headers = rawHeaders.map(h => normalizeHeader(h));

  const students: any[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    if (values.length === 0 || (values.length === 1 && values[0] === "")) continue;

    const row: any = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] !== undefined ? values[idx] : "";
    });

    const s = {
      fullName: row["full name"] || "",
      userId: row["user id"] || "",
      studentId: row["student id"] || "",
      mobileNumber: row["mobile number"] || "",
      activeStatus: row["active status"] || "",
      enrolledOn: row["enrolled on"] || "",
      batchDetails: row["batch details"] || "",
      gender: row["gender"] || "",
      batchTiming: row["batch timing"] || "",
      preferredJobTrack: row["preferred job track"] || "",
      personalMailId: row["your personal mail id"] || row["personal mail id"] || row["email"] || "",
      district: row["permanent address district"] || row["district"] || "",
      state: row["permanent state"] || row["state"] || "",
      pincode: row["permanent address pincode"] || row["pincode"] || "",
      highestQualification: row["highest qualification"] || "",
      graduationDegreeName: row["graduation degree name"] || "",
      graduationStream: row["graduation stream"] || "",
      graduationCollegeName: row["graduation college / university name"] || row["graduation college"] || "",
      graduationYearOfPassing: row["graduation year of passing"] || "",
      graduationCgpa: row["graduation cgpa"] || row["graduation cgpa "] || "",
      postGraduationDegreeName: row["post-graduation degree name"] || row["post graduation degree name"] || "",
      postGraduationStream: row["post-graduation stream"] || row["post graduation stream"] || "",
      postGraduationCollegeName: row["post-graduation college / university name"] || row["post graduation college"] || "",
      postGraduationYearOfPassing: row["post graduation year of passing"] || "",
      postGraduationCgpa: row["post graduation cgpa / percentage obtained"] || row["post graduation cgpa"] || "",
      placedOrganisation: row["placed organisation"] || row["placed organization"] || "",
      externalPlacedOrganisation: row["external placed organisation"] || row["external placed organization"] || "",
      placementType: row["placement type"] || "",
      placedMonth: row["placed month"] || "",
      ctcLpa: row["ctc(lpa)"] || row["ctclpa"] || row["ctc lpa"] || "",
    };

    students.push(s);
  }

  return students;
}

// Generate a highly compact summary CSV containing only essential statistical and grouping dimensions
function compressStudentsToCSV(students: any[]): string {
  const headers = [
    "Student ID",
    "Full Name",
    "Active Status",
    "Batch Details",
    "Gender",
    "Batch Timing",
    "Preferred Job Track",
    "Permanent Address District",
    "Permanent State",
    "Highest Qualification",
    "Graduation Stream",
    "Placed Organisation",
    "CTC(LPA)"
  ];
  
  const rows = students.map(s => {
    return [
      s.studentId || "",
      s.fullName || "",
      s.activeStatus || "",
      s.batchDetails || "",
      s.gender || "",
      s.batchTiming || "",
      s.preferredJobTrack || "",
      s.district || "",
      s.state || "",
      s.highestQualification || "",
      s.graduationStream || "",
      s.placedOrganisation || s.externalPlacedOrganisation || "",
      s.ctcLpa || ""
    ].map(val => {
      const clean = String(val).replace(/"/g, '""').trim();
      return clean.includes(",") || clean.includes('"') ? `"${clean}"` : clean;
    }).join(",");
  });
  
  return [headers.join(","), ...rows].join("\n");
}

// Format detailed student profile into clean text block
function formatDetailedStudent(s: any): string {
  return `
STUDENT ID: ${s.studentId}
FULL NAME: ${s.fullName}
USER ID: ${s.userId}
MOBILE NUMBER: ${s.mobileNumber}
EMAIL: ${s.personalMailId}
ACTIVE STATUS: ${s.activeStatus}
ENROLLED ON: ${s.enrolledOn}
BATCH DETAILS: ${s.batchDetails}
BATCH TIMING: ${s.batchTiming}
GENDER: ${s.gender}
PREFERRED JOB TRACK: ${s.preferredJobTrack}
DISTRICT: ${s.district}
STATE: ${s.state}
PINCODE: ${s.pincode}
HIGHEST QUALIFICATION: ${s.highestQualification}
GRADUATION:
- Degree: ${s.graduationDegreeName}
- Stream: ${s.graduationStream}
- College: ${s.graduationCollegeName}
- Passing Year: ${s.graduationYearOfPassing}
- CGPA: ${s.graduationCgpa}
POST-GRADUATION:
- Degree: ${s.postGraduationDegreeName}
- Stream: ${s.postGraduationStream}
- College: ${s.postGraduationCollegeName}
- Passing Year: ${s.postGraduationYearOfPassing}
- CGPA: ${s.postGraduationCgpa}
PLACEMENT DETAILS:
- Organisation: ${s.placedOrganisation}
- External Placed Organisation: ${s.externalPlacedOrganisation}
- Placement Type: ${s.placementType}
- Placed Month: ${s.placedMonth}
- CTC (LPA): ${s.ctcLpa}
----------------------------------------`;
}

// Find matches based on name, ID, contact info, or college mentioned in user query
function getMentionedStudents(students: any[], query: string): any[] {
  const queryLower = query.toLowerCase().trim();
  if (queryLower.length < 3) return [];

  return students.filter(s => {
    const id = (s.studentId || "").toLowerCase();
    const name = (s.fullName || "").toLowerCase();
    const email = (s.personalMailId || "").toLowerCase();
    const mobile = (s.mobileNumber || "").toLowerCase();
    const gradCollege = (s.graduationCollegeName || "").toLowerCase();
    const pgCollege = (s.postGraduationCollegeName || "").toLowerCase();
    
    // Direct matches
    if (id && queryLower.includes(id)) return true;
    if (email && queryLower.includes(email)) return true;
    if (mobile && mobile.length > 5 && queryLower.includes(mobile)) return true;
    if (name && queryLower.includes(name)) return true;
    
    // Part matches for name (e.g. Konduri, Vishesh)
    const nameParts = name.split(/\s+/).filter(part => part.length > 2);
    if (nameParts.length > 0 && nameParts.every(part => queryLower.includes(part))) {
      return true;
    }

    // Matching exact college substrings if referenced specifically in the query
    if (gradCollege && gradCollege.length > 8 && queryLower.includes(gradCollege)) return true;
    if (pgCollege && pgCollege.length > 8 && queryLower.includes(pgCollege)) return true;
    
    return false;
  });
}

// API endpoint for AI query answering
app.post("/api/ai/ask", async (req, res) => {
  try {
    const { question, studentCSV } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Missing required parameter 'question'." });
    }

    if (!studentCSV) {
      return res.status(400).json({ error: "No student data found in memory. Please ensure the student sheet is loaded." });
    }

    let ai;
    try {
      ai = getGeminiClient();
    } catch (err: any) {
      return res.status(500).json({
        error: err.message || "Gemini Client configuration issue. Ensure your API key is correctly added."
      });
    }

    // 1. Parse full dataset in-memory
    const allStudents = parseStudentCSVForAI(studentCSV);

    // 2. Locate any explicitly mentioned students
    const matchedStudents = getMentionedStudents(allStudents, question);

    // 3. Generate a highly optimized summary CSV to save ~85% of token budget
    const compressedCSV = compressStudentsToCSV(allStudents);

    // 4. If matching individual student(s) found, compile their exhaustive fields
    let detailedProfilesText = "";
    if (matchedStudents.length > 0 && matchedStudents.length <= 15) {
      detailedProfilesText = `
### DETAILED TARGET STUDENT RECORD(S) FOUND
Below are the fully detailed student profiles matching the specific student(s) requested or referenced:
${matchedStudents.map(s => formatDetailedStudent(s)).join("\n")}
`;
    } else if (matchedStudents.length > 15) {
      detailedProfilesText = `
### TARGET MATCHES INFO
There were ${matchedStudents.length} students matching your search criteria. Please refer to the database summary below to analyze them.
`;
    }

    // Convert question to answer based on custom context compilation
    const systemInstruction = `You are a helpful, professional, and knowledgeable student coordinator and database assistant for 'Intensive offline: Student Details'.
The sales and coordinate teams will ask you various questions about the loaded student database, such as counts, qualifications, placement details, contact info, home states, timing slots, or specific student profiles.

Below is the current active student database loaded in memory, formatted as a highly optimized, compact summary CSV:
--- DATABASE SUMMARY START ---
${compressedCSV}
--- DATABASE SUMMARY END ---
${detailedProfilesText}

Please analyze the database summary and target student records above to answer the user's question directly, clearly, and precisely.
- Be extremely polite, professional, and concise.
- If they ask for numeric counts, give them the exact numbers (or list the students if requested).
- If they ask for specific people, list their names, student IDs, batch details, and active status as relevant.
- Ensure all statistics (like top placed packages or total active students) are strictly calculated under-the-hood from the provided data only. Do not invent any records.
- If some details are not available or left blank, explain that clearly ("In placement details, blank means not placed yet").`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: question,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for higher accuracy in factual lookups
      },
    });

    const answer = response.text || "I was unable to formulate an answer. Please try rephrasing your question.";
    return res.json({ answer });

  } catch (error: any) {
    console.error("Error in AI ask route:", error);
    return res.status(500).json({
      error: error.message || "An error occurred while communicating with the AI service."
    });
  }
});

// Configure Vite or serve static production build
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on harbor port http://0.0.0.0:${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
