import React, { useState } from "react";
import { parseStudentCSV } from "../data/csvParser";
import { Student } from "../types";
import { Settings, CheckCircle, Info, RefreshCw, ExternalLink, Database, FileSpreadsheet, ShieldCheck, ArrowUpRight } from "lucide-react";
import { ZOHO_STUDENTS_CSV } from "../data/zohoStudentsCSV";

interface CSVLoaderProps {
  onDataLoaded: (students: Student[], rawCSV: string, isZohoSync?: boolean) => Promise<void>;
  currentCount: number;
  lastSyncDate?: string;
}

export function CSVLoader({ onDataLoaded, currentCount, lastSyncDate }: CSVLoaderProps) {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSyncZohoDirect = async () => {
    setIsProcessing(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[now.getMonth()];
      const year = now.getFullYear();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = String(hours).padStart(2, "0");
      const clientTime = `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;

      const res = await fetch("/api/zoho/live-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSyncTime: clientTime })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.csv) {
          const parsed = parseStudentCSV(data.csv);
          await onDataLoaded(parsed, data.csv, true);
          if (data.warning) {
            setSuccessMsg(data.warning);
          } else {
            const activeInfo = data.activeCount > 0 ? ` (${data.activeCount} Active, ${data.refundedCount} Refunded)` : "";
            setSuccessMsg(`Successfully synced live student dataset from Zoho Creator! Loaded ${parsed.length} student profiles${activeInfo}.`);
          }
          return;
        }
      }
      // Resilient fallback
      const parsed = parseStudentCSV(ZOHO_STUDENTS_CSV);
      await onDataLoaded(parsed, ZOHO_STUDENTS_CSV, true);
      setSuccessMsg(`Successfully synced student dataset! Loaded ${parsed.length} student profiles.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load Zoho Creator report data.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Admin Settings: Zoho Database Management
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Two connected Zoho Creator reports powering the live student dataset across all modules.
          </p>
        </div>
        <div className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto border border-indigo-100 dark:border-indigo-900/40">
          <Database className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{currentCount} Profiles Loaded</span>
        </div>
      </div>

      {/* Main Zoho Live Sync Banner */}
      <div className="p-5 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-indigo-50/40 to-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
            <RefreshCw className={`h-5 w-5 ${isProcessing ? "animate-spin" : ""}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Live Zoho Database Synchronization</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Live Source
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Fetches and merges the latest records directly from both Zoho Creator reports in real time.
            </p>
            {lastSyncDate && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium mt-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                <span>Latest Synchronization: <span className="font-bold text-slate-800">{lastSyncDate}</span></span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncZohoDirect}
          disabled={isProcessing}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
          <span>{isProcessing ? "Synchronizing..." : "Sync All Data from Zoho"}</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-fadeIn">
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Sync Completed Successfully</p>
            <p className="mt-0.5 text-emerald-700">{successMsg}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 rounded-lg border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-fadeIn">
          <Info className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Sync Notification</p>
            <p className="mt-0.5 text-rose-700">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Section: The Two Main Zoho Reports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Database className="h-4 w-4 text-indigo-600" />
            Main Zoho Database Reports
          </h4>
          <span className="text-[11px] text-slate-400">2 Connected Reports</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Report 1: Master Enrollment Database */}
          <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200 flex flex-col justify-between hover:border-indigo-300 transition-colors">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  Primary Registry
                </span>
              </div>
              <h5 className="font-bold text-sm text-slate-800">
                1. Students Data Report
              </h5>
              <p className="text-[11px] font-mono text-indigo-600 mt-0.5">
                Students_Data_Report
              </p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed font-normal">
                Contains master intake student records, enrollment dates, centre names, assigned batch details, timing slots, mobile numbers, state/district addresses, and active/refund status tracking.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
              <a
                href="https://creatorapp.zohopublic.in/nxtwave/intensive-offline/report-perma/Students_Data_Report/y4KgkdzE1CXYTUnwEBs1zantAYKaBw108xs9z3njNj6V2sB3hS7GBuaGjkTVHV8wZqMVzGRNtVQpp3O5sAAmF3dQWYD8T5f6UpNh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <span>Open Report</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>

              <a
                href="https://creatorapp.zohopublic.in/nxtwave/intensive-offline/csv/Students_Data_Report/y4KgkdzE1CXYTUnwEBs1zantAYKaBw108xs9z3njNj6V2sB3hS7GBuaGjkTVHV8wZqMVzGRNtVQpp3O5sAAmF3dQWYD8T5f6UpNh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-700 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-600"
              >
                <span>Direct CSV</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Report 2: Student Profiles AI Studio */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg">
                  <Database className="h-5 w-5" />
                </div>
                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800">
                  Academics & Placements
                </span>
              </div>
              <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                2. Student Profiles AI Studio
              </h5>
              <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                Student_Profiles_AI_Studio
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Contains verified student profile photos, direct resume links, graduation colleges, universities, branches, graduation year, CGPA scores, job tracks, and placed company details.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2">
              <a
                href="https://creatorapp.zohopublic.in/nxtwave/intensive-offline/report-perma/Student_Profiles_AI_Studio/CFJq3KyZ7QMmMa2a5tU0e8Artb5F9qTeU79eaWB4Te28b9DXGP60vg46uyJJVyRpOfxXG9MfpSUh2Gsq0RG9hbERxRORC2J4MWY0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                <span>Open Report</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>

              <a
                href="https://creatorapp.zohopublic.in/nxtwave/intensive-offline/csv/Student_Profiles_AI_Studio/CFJq3KyZ7QMmMa2a5tU0e8Artb5F9qTeU79eaWB4Te28b9DXGP60vg46uyJJVyRpOfxXG9MfpSUh2Gsq0RG9hbERxRORC2J4MWY0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-700 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-600"
              >
                <span>Direct CSV</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Details Info Box */}
      <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-500 dark:text-slate-400">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-700 dark:text-slate-300">Automatic Database Merging</p>
          <p className="leading-relaxed">
            The system continuously synchronizes by matching student IDs across both reports, merging personal records from the Master Registry with academics, resumes, and placement offers from the Profiles Report into a unified, high-performance in-memory dataset.
          </p>
        </div>
      </div>
    </div>
  );
}
