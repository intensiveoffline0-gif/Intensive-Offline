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
      profilePhoto: row["profile photo"] || row["photo"] || "",
      resume: row["resume"] || row["your resume"] || "",
      instructorName: row["instructor name"] || "",
      centreName: row["centre name"] || row["center name"] || row["centre"] || row["center"] || ""
    };

    students.push(s);
  }

  // Sort students by studentId in ascending order
  students.sort((a, b) => {
    const idA = a.studentId || "";
    const idB = b.studentId || "";
    return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: "base" });
  });

  return students;
}
