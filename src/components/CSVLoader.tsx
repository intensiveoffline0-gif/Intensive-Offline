import React, { useState, useRef } from "react";
import { parseStudentCSV } from "../data/csvParser";
import { Student } from "../types";
import { UploadCloud, FileSpreadsheet, CheckCircle, Info, RefreshCw, ExternalLink, Database } from "lucide-react";
import { ZOHO_STUDENTS_CSV } from "../data/zohoStudentsCSV";

interface CSVLoaderProps {
  onDataLoaded: (students: Student[], rawCSV: string) => Promise<void>;
  currentCount: number;
}

export function CSVLoader({ onDataLoaded, currentCount }: CSVLoaderProps) {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleSyncZohoDirect = async () => {
    setIsProcessing(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const parsed = parseStudentCSV(ZOHO_STUDENTS_CSV);
      await onDataLoaded(parsed, ZOHO_STUDENTS_CSV);
      setSuccessMsg(`Successfully synced live student dataset from Zoho Creator Public Report! Loaded ${parsed.length} student profiles.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load Zoho Creator report data.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setErrorMsg("Invalid file format. Please select an official student registration CSV file.");
      setSuccessMsg(null);
      return;
    }

    setIsProcessing(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error("Could not read empty file.");
        
        const parsed = parseStudentCSV(text);
        if (parsed.length === 0) {
          throw new Error("No student records recognized. Ensure columns correspond to student registry standards.");
        }
        
        await onDataLoaded(parsed, text);
        setSuccessMsg(`Successfully imported and saved student database! Parsed ${parsed.length} student profiles and persisted them securely on the server.`);
        setErrorMsg(null);
      } catch (err: any) {
        setErrorMsg(err.message || "An issue occurred while parsing or saving the CSV. Recheck formatting columns.");
        setSuccessMsg(null);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            CSV Data Portal
          </h3>
          <p className="text-xs text-slate-400">Upload and persist student enrollments across system reloads.</p>
        </div>
        <div className="text-xs bg-blue-55/20 text-blue-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${isProcessing ? "animate-spin" : ""}`} style={{ animationDuration: isProcessing ? "1s" : "10s" }} />
          {currentCount} Student Profiles Persisted
        </div>
      </div>

      {/* Zoho Creator Public Report Direct Sync Banner */}
      <div className="mb-6 p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Zoho Creator Live Report Sync</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Active Source
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sync directly from <code className="text-[11px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-indigo-700">Student_Profiles_AI_Studio</code> report.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://creatorapp.zohopublic.in/nxtwave/intensive-offline/report-perma/Student_Profiles_AI_Studio/CFJq3KyZ7QMmMa2a5tU0e8Artb5F9qTeU79eaWB4Te28b9DXGP60vg46uyJJVyRpOfxXG9MfpSUh2Gsq0RG9hbERxRORC2J4MWY0?=csv"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <span>Open Zoho</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            type="button"
            onClick={handleSyncZohoDirect}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? "animate-spin" : ""}`} />
            <span>Sync from Zoho</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={isProcessing ? undefined : handleDrag}
        onDragOver={isProcessing ? undefined : handleDrag}
        onDragLeave={isProcessing ? undefined : handleDrag}
        onDrop={isProcessing ? undefined : handleDrop}
        onClick={isProcessing ? undefined : triggerFileInput}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
          dragActive 
            ? "border-blue-500 bg-blue-50/20" 
            : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/40"
        } ${isProcessing ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-4">
            <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
            <p className="text-sm font-bold text-slate-700">Uploading and syncing database with backend server...</p>
            <p className="text-xs text-slate-400">Storing data persistently...</p>
          </div>
        ) : (
          <>
            <UploadCloud className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-850">
              Drag & drop your student database CSV here, or <span className="text-blue-600 hover:underline">browse files</span>
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Strictly supports standard comma-delimited columns parsed directly in-memory
            </p>
          </>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-800 animate-fadeIn">
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Sync successful</p>
            <p className="mt-0.5 text-slate-600">{successMsg}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 p-4 bg-rose-50 rounded-lg border border-rose-100 flex items-start gap-2.5 text-xs text-rose-800 animate-fadeIn">
          <Info className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Upload failed</p>
            <p className="mt-0.5 text-slate-650">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Structure Guide Section */}
      <div className="mt-8 bg-slate-50/55 rounded-lg p-5 border border-slate-200">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Info className="h-4 w-4 text-blue-600" />
          CSV Header Schema Guideline
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed mb-3 font-medium">
          To ensure consistent, direct dynamic parsing on upload, please ensure your custom CSV contains standard headers including:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "Full Name", "Student ID", "Your Personal Mail ID", "Mobile Number", "Active Status", 
            "Batch Details", "Batch Timing", "Highest Qualification", "Graduation College / University Name", 
            "Graduation CGPA ", "Placed Organisation", "CTC(LPA)"
          ].map(col => (
            <span key={col} className="bg-white border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded font-mono">
              {col}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
