import { Student } from "../types";

export function parseCSVRows(csvText: string): string[][] {
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

export function parseCSVLine(line: string): string[] {
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

function normalizeName(name: string): string {
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeMobile(mobile: string): string {
  const digits = (mobile || "").replace(/[^0-9]/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
}

function normalizeEmail(email: string): string {
  const e = (email || "").toLowerCase().trim();
  return e.includes("@") ? e : "";
}

function namesMatch(a: string, b: string): boolean {
  const normA = normalizeName(a);
  const normB = normalizeName(b);
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  if (normA.includes(normB) || normB.includes(normA)) return true;
  return false;
}

export function deduplicateStudents(studentList: Student[]): Student[] {
  const deduped: Student[] = [];

  for (const s of studentList) {
    const sId = (s.studentId || "").trim().toLowerCase();
    const sEmail = normalizeEmail(s.personalMailId);
    const sMobile = normalizeMobile(s.mobileNumber);
    const sName = s.fullName || "";

    const existingIdx = deduped.findIndex(d => {
      const dId = (d.studentId || "").trim().toLowerCase();
      const dEmail = normalizeEmail(d.personalMailId);
      const dMobile = normalizeMobile(d.mobileNumber);
      const dName = d.fullName || "";

      // 1. Exact Student ID match
      if (sId && dId && sId === dId) return true;
      // 2. Email match AND Names match
      if (sEmail && dEmail && sEmail === dEmail && namesMatch(sName, dName)) return true;
      // 3. Mobile match AND Names match
      if (sMobile && dMobile && sMobile === dMobile && namesMatch(sName, dName)) return true;
      return false;
    });

    if (existingIdx === -1) {
      deduped.push({ ...s });
    } else {
      const existing = deduped[existingIdx];
      // Check if candidate s has the newer permanent roll number (e.g. I26K over I26A)
      const sIsK = (s.studentId || "").toUpperCase().includes("K");
      const existingIsK = (existing.studentId || "").toUpperCase().includes("K");

      if (sIsK && !existingIsK) {
        existing.studentId = s.studentId;
        existing.userId = s.userId || s.studentId;
      }

      // Merge non-empty values
      (Object.keys(s) as (keyof Student)[]).forEach(k => {
        if (s[k] && (!existing[k] || (sIsK && !existingIsK))) {
          (existing as any)[k] = s[k];
        }
      });
    }
  }

  return deduped;
}

export function getBatchTimingSlot(batchDetails?: string, fallback?: string): string {
  if (!batchDetails) return fallback || "";
  const b = batchDetails.trim().toUpperCase();
  if (b.startsWith("E")) return "07:00 AM - 10:00 AM";
  if (b.startsWith("M")) return "10:30 AM - 01:30 PM";
  if (b.startsWith("A")) return "02:30 PM - 05:30 PM";
  if (b.startsWith("N")) return "06:00 PM - 09:00 PM";
  return fallback || "10:30 AM - 01:30 PM";
}

export function parseStudentCSV(csvText: string): Student[] {
  if (!csvText) return [];
  const rows = parseCSVRows(csvText);
  if (rows.length === 0) return [];

  const rawHeaders = rows[0];
  const headers = rawHeaders.map(h => normalizeHeader(h));

  const students: Student[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    if (values.length === 0 || (values.length === 1 && values[0] === "")) continue;

    const row: any = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] !== undefined ? values[idx] : "";
    });

    const s: Student = {
      fullName: row["full name"] || "",
      userId: row["user id"] || "",
      studentId: row["student id"] || "",
      mobileNumber: row["mobile number"] || "",
      activeStatus: (row["active status"] || "").trim().toLowerCase() === "refunded" ? "Refunded" : "Active",
      enrolledOn: row["enrolled on"] || "",
      batchDetails: row["batch details"] || "",
      gender: row["gender"] || "",
      batchTiming: getBatchTimingSlot(row["batch details"], row["batch timing"]),
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
      profilePhoto: row["profile photo"] || row["photo"] || "",
      resume: row["resume"] || row["your resume"] || "",
      instructorName: row["instructor name"] || "",
      centreName: row["centre name"] || row["center name"] || row["centre"] || row["center"] || ""
    };

    students.push(s);
  }

  // Deduplicate students (merges old temporary roll numbers into permanent ones)
  const deduped = deduplicateStudents(students);

  // Sort students by studentId in ascending order
  deduped.sort((a, b) => {
    const idA = a.studentId || "";
    const idB = b.studentId || "";
    return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: "base" });
  });

  return deduped;
}
