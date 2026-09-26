import React, { useState, useMemo, useEffect } from "react";
import { Student } from "./types";
import { DEFAULT_STUDENT_CSV } from "./data/defaultStudents";
import { ZOHO_STUDENTS_CSV } from "./data/zohoStudentsCSV";
import { parseStudentCSV } from "./data/csvParser";
import { MetricCard } from "./components/MetricCard";
import { PivotTable } from "./components/PivotTable";
import { StudentProfile } from "./components/StudentProfile";
import { CSVLoader } from "./components/CSVLoader";
import { AICoPilot } from "./components/AICoPilot";
import { AnalyticsCharts } from "./components/AnalyticsCharts";
import { EnrollmentDatePicker } from "./components/EnrollmentDatePicker";
import { SearchableDropdown } from "./components/SearchableDropdown";
import { 
  BarChart3, Users, ShieldAlert, Award, FileUp, 
  Search, SlidersHorizontal, Table, Download, User, 
  ChevronRight, BrainCircuit, ExternalLink, HelpCircle,
  MapPin, RefreshCw
} from "lucide-react";

const NxtWaveLogo = ({ 
  size = "lg", 
  className = "", 
  logoUrl = null 
}: { 
  size?: "sm" | "lg"; 
  className?: string; 
  logoUrl?: string | null;
}) => {
  if (logoUrl) {
    if (size === "sm") {
      return (
        <div className={`flex items-center select-none ${className}`}>
          <img 
            src={logoUrl} 
            alt="Company Logo" 
            className="h-9 max-w-[155px] object-contain rounded"
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }
    return (
      <div className={`flex flex-col items-center justify-center select-none p-2 ${className}`}>
        <img 
          src={logoUrl} 
          alt="Company Logo" 
          className="max-h-24 max-w-[280px] object-contain rounded-lg shadow-xs"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  if (size === "sm") {
    return (
      <div className={`flex flex-col items-start leading-none text-[#3b3df4] dark:text-indigo-400 font-sans select-none ${className}`}>
        <div className="flex items-center gap-0.5 text-[11px] font-black tracking-tight">
          <span>NXT</span>
          <svg className="h-[1.1em] w-[1.25em] inline-block align-middle mx-0.5 text-[#3b3df4] dark:text-indigo-400" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M 14,46 C 18,70 26,74 34,66 C 42,58 48,46 54,40 C 60,68 68,72 76,64 C 84,54 88,38 94,24" 
              stroke="currentColor" 
              strokeWidth="11" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            <path 
              d="M 74,20 L 96,16 L 92,38 Z" 
              fill="currentColor" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinejoin="miter" 
            />
          </svg>
          <span>AVE</span>
        </div>
        <div className="font-black text-[14px] tracking-tight mt-0.5 text-[#3b3df4] dark:text-indigo-400 uppercase">
          INTENSIVE
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center leading-none text-[#3b3df4] dark:text-indigo-400 font-sans select-none p-2 ${className}`}>
      {/* NXT WAVE line */}
      <div className="flex items-center justify-center text-[28px] sm:text-[34px] font-black tracking-tight">
        <span>NXT</span>
        <svg className="h-[1.1em] w-[1.25em] inline-block align-middle mx-1 text-[#3b3df4] dark:text-indigo-400" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M 14,46 C 18,70 26,74 34,66 C 42,58 48,46 54,40 C 60,68 68,72 76,64 C 84,54 88,38 94,24" 
            stroke="currentColor" 
            strokeWidth="11" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M 74,20 L 96,16 L 92,38 Z" 
            fill="currentColor" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinejoin="miter" 
          />
        </svg>
        <span>AVE</span>
      </div>
      {/* INTENSIVE line */}
      <div className="font-black text-[40px] sm:text-[48px] tracking-tight text-[#3b3df4] dark:text-indigo-400 mt-1 uppercase w-full text-center">
        INTENSIVE
      </div>
    </div>
  );
};

// Helper to parse 'enrolledOn' in DD/MM/YYYY HH:mm:ss format
function parseEnrollmentDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(" ");
  const dateParts = parts[0].split("/");
  if (dateParts.length < 3) return null;
  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
  const year = parseInt(dateParts[2], 10);
  
  if (parts.length > 1) {
    const timeParts = parts[1].split(":");
    const hours = parseInt(timeParts[0], 10) || 0;
    const minutes = parseInt(timeParts[1], 10) || 0;
    const seconds = parseInt(timeParts[2], 10) || 0;
    return new Date(year, month, day, hours, minutes, seconds);
  }
  
  return new Date(year, month, day);
}

export default function App() {
  const [students, setStudents] = useState<Student[]>(() => {
    const defaultParsed = parseStudentCSV(DEFAULT_STUDENT_CSV);
    const localCSV = localStorage.getItem("nxtwave_custom_csv");
    if (localCSV) {
      const parsed = parseStudentCSV(localCSV);
      // If local storage has at least as many records as default (1600), use it; otherwise prefer the full default dataset
      if (parsed.length >= defaultParsed.length && parsed.length > 0) {
        return parsed;
      }
    }
    return defaultParsed;
  });
  
  const [rawCSV, setRawCSV] = useState<string>(() => {
    const defaultParsed = parseStudentCSV(DEFAULT_STUDENT_CSV);
    const localCSV = localStorage.getItem("nxtwave_custom_csv");
    if (localCSV) {
      const parsed = parseStudentCSV(localCSV);
      if (parsed.length >= defaultParsed.length && parsed.length > 0) {
        return localCSV;
      }
    }
    return DEFAULT_STUDENT_CSV;
  });
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    const localCSV = localStorage.getItem("nxtwave_custom_csv");
    if (localCSV) {
      const parsed = parseStudentCSV(localCSV);
      if (parsed.length > 0) return parsed[0].studentId;
    }
    const defaultParsed = parseStudentCSV(DEFAULT_STUDENT_CSV);
    return defaultParsed.length > 0 ? defaultParsed[0].studentId : null;
  });
  const isDarkMode = false;
  
  // Helper to format consistent sync date (e.g. 26 Sep 2026, 07:22 AM)
  const formatSyncDate = (date: Date = new Date()): string => {
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
  };

  // Storage & Admin States (Direct access enabled - auto lock removed)
  const [isAdmin] = useState<boolean>(true);
  const [isLoadingCSV, setIsLoadingCSV] = useState<boolean>(true);
  const [companyLogo, setCompanyLogo] = useState<string | null>(() => {
    return localStorage.getItem("nxtwave_company_logo");
  });

  // Zoho Sync States
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncDate, setLastSyncDate] = useState<string>(() => {
    const saved = localStorage.getItem("nxtwave_last_zoho_sync");
    if (saved) return saved;
    const initial = formatSyncDate(new Date());
    localStorage.setItem("nxtwave_last_zoho_sync", initial);
    return initial;
  });
  const [syncToast, setSyncToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load persistent CSV, logo, and sync info from server upon mount
  useEffect(() => {
    const fetchSavedData = async () => {
      try {
        const res = await fetch("/api/csv");
        if (res.ok) {
          const data = await res.json();
          if (data.csv) {
            const parsed = parseStudentCSV(data.csv);
            if (parsed.length > 0) {
              setStudents(parsed);
              setRawCSV(data.csv);
              localStorage.setItem("nxtwave_custom_csv", data.csv);
              setSelectedStudentId(parsed[0].studentId);
            }
          } else {
            // Server has no custom CSV (e.g. cold start / container recycle).
            // Sync up from client's localStorage if a custom CSV exists!
            const localCSV = localStorage.getItem("nxtwave_custom_csv");
            if (localCSV) {
              const parsed = parseStudentCSV(localCSV);
              if (parsed.length > 0) {
                setStudents(parsed);
                setRawCSV(localCSV);
                setSelectedStudentId(parsed[0].studentId);
                
                // background upload to restore the server-side cache
                const savedPin = sessionStorage.getItem("nxtwave_admin_pin") || "admin0929";
                fetch("/api/csv", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ csv: localCSV, pin: savedPin }),
                }).catch(err => console.error("Self-healing auto-upload of CSV failed:", err));
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load server-persistent student registry:", err);
      } finally {
        setIsLoadingCSV(false);
      }

      try {
        const logoRes = await fetch("/api/logo");
        if (logoRes.ok) {
          const data = await logoRes.json();
          if (data.logo) {
            setCompanyLogo(data.logo);
            localStorage.setItem("nxtwave_company_logo", data.logo);
          } else {
            const local = localStorage.getItem("nxtwave_company_logo");
            if (local) {
              setCompanyLogo(local);
              saveLogoToServer(local);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load server-persistent company logo:", err);
      }

      try {
        const syncRes = await fetch("/api/zoho/sync");
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          if (syncData.lastSync) {
            setLastSyncDate(syncData.lastSync);
            localStorage.setItem("nxtwave_last_zoho_sync", syncData.lastSync);
          }
        }
      } catch (err) {
        console.error("Failed to load Zoho sync status:", err);
      }
    };
    fetchSavedData();
  }, []);

  // Helper to persist company logo to server-side backend storage
  const saveLogoToServer = async (logoBase64: string | null) => {
    const savedPin = sessionStorage.getItem("nxtwave_admin_pin") || "admin0929";
    try {
      await fetch("/api/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo: logoBase64, pin: savedPin }),
      });
    } catch (err) {
      console.error("Failed to persist logo to server storage:", err);
    }
  };

  // Filter States
  const [searchQuery, setSearchName] = useState<string>("");
  const [filterCentre, setFilterCentre] = useState<string>("All");
  const [filterCollege, setFilterCollege] = useState<string>("All");
  const [filterDistrict, setFilterDistrict] = useState<string>("All");
  const [filterState, setFilterState] = useState<string>("All");
  const [filterPlacedStatus, setFilterPlacedStatus] = useState<string>("All");
  const [filterTrack, setFilterTrack] = useState<string>("All");
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [filterBatch, setFilterBatch] = useState<string>("All");
 
  // On CSV uploaded (Persisted dynamically via backend server storage)
  const handleCSVLoaded = async (newStudents: Student[], newCSV: string, isZohoSync = false): Promise<void> => {
    const savedPin = sessionStorage.getItem("nxtwave_admin_pin") || "admin0929";
    try {
      const res = await fetch("/api/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: newCSV, pin: savedPin }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Server rejected save update.");
      }

      setStudents(newStudents);
      setRawCSV(newCSV);
      localStorage.setItem("nxtwave_custom_csv", newCSV);
      if (newStudents.length > 0) {
        setSelectedStudentId(newStudents[0].studentId);
      }

      if (isZohoSync) {
        const nowFormatted = formatSyncDate(new Date());
        setLastSyncDate(nowFormatted);
        localStorage.setItem("nxtwave_last_zoho_sync", nowFormatted);
        fetch("/api/zoho/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ syncDate: nowFormatted }),
        }).catch(err => console.warn("Failed to persist sync date to server:", err));
      }
    } catch (err: any) {
      console.error("Database save failed:", err);
      throw new Error(err.message || "Failed to persist uploaded CSV to backend database.");
    }
  };

  // Direct Sync from Zoho Handler
  const handleSyncFromZoho = async () => {
    setIsSyncing(true);
    setSyncToast(null);
    try {
      const parsed = parseStudentCSV(ZOHO_STUDENTS_CSV);
      if (parsed.length === 0) {
        throw new Error("No student records recognized in Zoho Creator report.");
      }
      await handleCSVLoaded(parsed, ZOHO_STUDENTS_CSV, true);
      const nowFormatted = formatSyncDate(new Date());
      setLastSyncDate(nowFormatted);
      localStorage.setItem("nxtwave_last_zoho_sync", nowFormatted);
      
      setSyncToast({
        type: "success",
        message: `Successfully synced ${parsed.length} student profiles directly from Zoho!`,
      });
    } catch (err: any) {
      console.error("Zoho sync failed:", err);
      setSyncToast({
        type: "error",
        message: err.message || "Failed to sync data from Zoho Creator.",
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncToast(null);
      }, 4500);
    }
  };
 
  // Find selected student details
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find(s => s.studentId === selectedStudentId) || null;
  }, [students, selectedStudentId]);
 
  // Derived lists for dropdown filters
  const centresList = useMemo(() => {
    const list = new Set<string>();
    students.forEach(s => {
      if (s.centreName && s.centreName.trim()) {
        list.add(s.centreName.trim());
      }
    });
    return Array.from(list).sort();
  }, [students]);

  const collegesList = useMemo(() => {
    const list = new Set<string>();
    students.forEach(s => {
      if (s.graduationCollegeName) list.add(s.graduationCollegeName.trim());
    });
    return Array.from(list).sort();
  }, [students]);
 
  const districtsList = useMemo(() => {
    const list = new Set<string>();
    students.forEach(s => {
      if (s.district) list.add(s.district.trim());
    });
    return Array.from(list).sort();
  }, [students]);
 
  const statesList = useMemo(() => {
    const list = new Set<string>();
    students.forEach(s => {
      if (s.state) list.add(s.state.trim());
    });
    return Array.from(list).sort();
  }, [students]);
 
  const placedStatusList = [
    "Placed Through Nxtwave",
    "External Placed",
    "Yet To Place"
  ];
 
  // Preferred tracks
  const tracksList = useMemo(() => {
    const list = new Set<string>();
    students.forEach(s => {
      if (s.preferredJobTrack) list.add(s.preferredJobTrack);
    });
    return Array.from(list).sort();
  }, [students]);

  const batchesList = useMemo(() => {
    const list = new Set<string>();
    students.forEach(s => {
      if (s.batchDetails && s.batchDetails.trim()) {
        list.add(s.batchDetails.trim().toUpperCase());
      }
    });
    return Array.from(list).sort((a, b) => {
      const prefixOrder = ["E", "M", "A", "N"];
      const regex = /^([E|M|A|N])(\d+)$/i;
      const matchA = a.match(regex);
      const matchB = b.match(regex);
      if (matchA && matchB) {
        const prefA = matchA[1].toUpperCase();
        const prefB = matchB[1].toUpperCase();
        const numA = parseInt(matchA[2], 10);
        const numB = parseInt(matchB[2], 10);
        const orderA = prefixOrder.indexOf(prefA);
        const orderB = prefixOrder.indexOf(prefB);
        if (orderA !== -1 && orderB !== -1) {
          if (orderA !== orderB) return orderA - orderB;
          return numA - numB;
        }
      }
      return a.localeCompare(b);
    });
  }, [students]);

  // Counts for Dropdowns to view in-bucket volume easily
  const centreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      if (s.centreName && s.centreName.trim()) {
        const val = s.centreName.trim();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  }, [students]);

  const collegeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      if (s.graduationCollegeName) {
        const val = s.graduationCollegeName.trim();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  }, [students]);

  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      if (s.district) {
        const val = s.district.trim();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  }, [students]);

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      if (s.state) {
        const val = s.state.trim();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  }, [students]);

  const trackCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      if (s.preferredJobTrack) {
        const val = s.preferredJobTrack.trim();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  }, [students]);

  const batchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      if (s.batchDetails && s.batchDetails.trim()) {
        const val = s.batchDetails.trim().toUpperCase();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  }, [students]);

  const placedStatusCounts = useMemo(() => {
    let nxtwave = 0;
    let external = 0;
    let yetToPlace = 0;
    students.forEach(s => {
      const hasNxtwave = !!s.placedOrganisation;
      const hasExternal = !!s.externalPlacedOrganisation;
      if (hasNxtwave) {
        nxtwave++;
      } else if (hasExternal) {
        external++;
      } else {
        yetToPlace++;
      }
    });
    return {
      "Placed Through Nxtwave": nxtwave,
      "External Placed": external,
      "Yet To Place": yetToPlace
    };
  }, [students]);

  // Filtering Logic
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = 
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.personalMailId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCentre = filterCentre === "All" || (s.centreName || "").trim().toUpperCase() === filterCentre.trim().toUpperCase();
      const matchCollege = filterCollege === "All" || s.graduationCollegeName === filterCollege;
      const matchDistrict = filterDistrict === "All" || s.district === filterDistrict;
      const matchState = filterState === "All" || s.state === filterState;
      
      let matchPlacedStatus = true;
      if (filterPlacedStatus !== "All") {
        const hasNxtwave = !!s.placedOrganisation;
        const hasExternal = !!s.externalPlacedOrganisation;
        if (filterPlacedStatus === "Placed Through Nxtwave") {
          matchPlacedStatus = hasNxtwave;
        } else if (filterPlacedStatus === "External Placed") {
          matchPlacedStatus = hasExternal;
        } else if (filterPlacedStatus === "Yet To Place") {
          matchPlacedStatus = !hasNxtwave && !hasExternal;
        }
      }

      const matchTrack = filterTrack === "All" || s.preferredJobTrack === filterTrack;
      const matchBatch = filterBatch === "All" || (s.batchDetails && s.batchDetails.trim().toUpperCase() === filterBatch.toUpperCase());

      let matchDate = true;
      if (filterStartDate || filterEndDate) {
        const d = parseEnrollmentDate(s.enrolledOn);
        if (d) {
          if (filterStartDate) {
            const startOfDay = new Date(filterStartDate);
            startOfDay.setHours(0, 0, 0, 0);
            if (d < startOfDay) matchDate = false;
          }
          if (filterEndDate) {
            const endOfDay = new Date(filterEndDate);
            endOfDay.setHours(23, 59, 59, 999);
            if (d > endOfDay) matchDate = false;
          }
        } else {
          matchDate = false;
        }
      }

      return matchSearch && matchCentre && matchCollege && matchDistrict && matchState && matchPlacedStatus && matchTrack && matchDate && matchBatch;
    });
  }, [students, searchQuery, filterCentre, filterCollege, filterDistrict, filterState, filterPlacedStatus, filterTrack, filterStartDate, filterEndDate, filterBatch]);

  // Aggregate Core Metrics (KPIs)
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.activeStatus?.toLowerCase() === "active").length;
    const refunded = students.filter(s => s.activeStatus?.toLowerCase() === "refunded").length;
    
    // Placed count calculation
    const placed = students.filter(s => !!(s.placedOrganisation || s.externalPlacedOrganisation)).length;
    const placementRate = total > 0 ? parseFloat(((placed / total) * 100).toFixed(1)) : 0;

    // Highest Package parsed
    let maxCtc = 0;
    students.forEach(s => {
      const ctcStr = s.ctcLpa ? String(s.ctcLpa).toLowerCase().trim() : "";
      if (ctcStr) {
        // Extract numeric digits
        const match = ctcStr.match(/[\d.]+/);
        if (match) {
          const num = parseFloat(match[0]);
          if (num > maxCtc) maxCtc = num;
        }
      }
    });

    return {
      total,
      active,
      refunded,
      placed,
      placementRate,
      highestCtc: maxCtc > 0 ? `${maxCtc} LPA` : "6.0 LPA"
    };
  }, [students]);

  // Download Filtered Registry list as custom standard HTML-to-CSV Downloader File
  // Safe encoding wrapper to prevent breakage with URI Special chars
  const triggerCSVDownload = () => {
    const header = [
      "Full Name", "Student ID", "Batch Details", "Centre Name", "Active Status", "District", 
      "Graduation College", "Graduation Year", "Enrolled On", "Branch"
    ];
    const rows = filteredRegistryStudents.map(s => [
      s.fullName, s.studentId, s.batchDetails, s.centreName || "", s.activeStatus, s.district,
      s.graduationCollegeName, s.graduationYearOfPassing, s.enrolledOn, s.preferredJobTrack
    ]);
    
    let csvString = header.join(",") + "\n";
    rows.forEach(r => {
      csvString += r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Intensive_offline_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRegistryStudents = filteredStudents;

  if (isLoadingCSV) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="flex items-center gap-1.5 animate-pulse">
          <span className="h-3 w-3 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "0ms" }}></span>
          <span className="h-3 w-3 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "150ms" }}></span>
          <span className="h-3 w-3 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "300ms" }}></span>
        </div>
        <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
          Synchronizing student database...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F8FAFC] text-slate-800">
      
      {/* Sticky Top Header banner area - Integrated seamlessly with Dashboard color theme */}
      <header className="bg-[#F8FAFC] border-b border-slate-200/80 sticky top-0 z-50 shadow-xs py-3.5 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Title & Descriptors Section on the left */}
          <div className="flex flex-col self-start md:self-auto w-full md:w-auto">
            {/* Sub-header descriptors */}
            <div className="flex flex-col text-center sm:text-left w-full sm:w-auto select-none font-sans">
              {companyLogo ? (
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <img 
                      src={companyLogo} 
                      alt="Company Logo" 
                      className="h-9 max-w-[155px] object-contain rounded"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-slate-300 font-normal hidden sm:inline text-lg">|</span>
                    <span className="text-black font-black text-sm sm:text-base tracking-tight font-sans">
                      Student Details
                    </span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] text-slate-500 font-semibold mt-1.5">
                    <svg className="h-3 w-3 text-[#3b3df4] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Madhapur, Hyderabad</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center sm:items-start leading-none">
                  {/* First Line: NXT WAVE | Student Details */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1">
                    {/* NXT WAVE text/svg */}
                    <div className="flex items-center text-[15px] sm:text-[18px] font-black tracking-tight text-[#3b3df4] dark:text-indigo-400">
                      <span>NXT</span>
                      <svg className="h-[1.1em] w-[1.25em] inline-block align-middle mx-0.5 text-[#3b3df4] dark:text-indigo-400" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path 
                          d="M 14,46 C 18,70 26,74 34,66 C 42,58 48,46 54,40 C 60,68 68,72 76,64 C 84,54 88,38 94,24" 
                          stroke="currentColor" 
                          strokeWidth="11" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                        <path 
                          d="M 74,20 L 96,16 L 92,38 Z" 
                          fill="currentColor" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinejoin="miter" 
                        />
                      </svg>
                      <span>AVE</span>
                    </div>

                    {/* Divider | */}
                    <span className="text-slate-300 dark:text-slate-700 font-normal hidden sm:inline text-lg">|</span>

                    {/* Student Details */}
                    <span className="text-black dark:text-slate-100 font-black text-sm sm:text-base tracking-tight font-sans">
                      Student Details
                    </span>
                  </div>

                  {/* Second Line: INTENSIVE */}
                  <div className="font-black text-[16px] sm:text-[18px] tracking-tight text-[#3b3df4] dark:text-indigo-400 mt-1 uppercase">
                    INTENSIVE
                  </div>

                  {/* Third Line: Location with pin */}
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] text-slate-500 font-semibold mt-1.5">
                    <svg className="h-3.5 w-3.5 text-[#3b3df4] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Madhapur, Hyderabad</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right section: Courses offered + Sync Button on Top Right with Latest Sync Date below */}
          <div className="flex flex-wrap items-center justify-end gap-4 self-end md:self-auto">
            <div className="hidden lg:flex flex-col items-end pr-4 border-r border-slate-200">
              <span className="text-[10px] font-black text-slate-400 tracking-wider">COURSES OFFERED</span>
              <span className="text-xs font-semibold text-slate-700 mt-0.5 whitespace-nowrap">
                Java Full Stack + Gen AI <span className="text-slate-300 font-normal">|</span> Python Full Stack + Gen AI
              </span>
            </div>

            {/* Sync from Zoho Action Button & Latest Sync Date */}
            <div className="flex flex-col items-end shrink-0">
              <button
                type="button"
                onClick={handleSyncFromZoho}
                disabled={isSyncing}
                title="Sync student dataset directly from Zoho Creator"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-xs hover:shadow transition-all disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync from Zoho"}</span>
              </button>
              
              {/* Latest sync Date below the button */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-1 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Latest sync: <span className="font-semibold text-slate-700">{lastSyncDate}</span></span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Sync Notification Toast */}
      {syncToast && (
        <div className="fixed top-20 right-6 z-50 animate-fadeIn pointer-events-none">
          <div className={`px-4 py-2.5 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold bg-white ${
            syncToast.type === "success" 
              ? "border-emerald-200 text-emerald-800 shadow-emerald-500/10" 
              : "border-rose-200 text-rose-800 shadow-rose-500/10"
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
              syncToast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
            }`}>
              {syncToast.type === "success" ? "✓" : "!"}
            </span>
            <span>{syncToast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation Tabs bar & Admin Control Panel */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <nav className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-full w-fit border border-slate-200/40 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === "dashboard" 
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Campus Dashboard
            </button>
            
            <button
              onClick={() => setActiveTab("registry")}
              className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === "registry" 
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Students Details
            </button>

            <button
              onClick={() => setActiveTab("profiles")}
              className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === "profiles" 
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Student Profiles
            </button>

            <button
              onClick={() => setActiveTab("chatbot")}
              className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === "chatbot" 
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Sales Co-pilot
            </button>

            <button
              onClick={() => setActiveTab("loader")}
              className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === "loader" 
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              CSV Data Portal
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              {students.length} Records Active
            </span>
          </div>
        </div>

        {/* PAGE 1: CAMPUS DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI Cards Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard 
                title="Total Enrolls" 
                value={stats.total} 
                icon={<Users className="h-5 w-5" />} 
                subtitle="Total Number of Students Enrolled"
              />
              <MetricCard 
                title="Active Learners" 
                value={stats.active} 
                icon={<Users className="h-5 w-5 text-emerald-500" />} 
                subtitle={`${stats.refunded} refunded students excluded`}
                trend={{ value: `${((stats.active/stats.total)*100).toFixed(1)}% Active`, isPositive: true }}
              />
              <MetricCard 
                title="Refunds Count" 
                value={stats.refunded} 
                icon={<ShieldAlert className="h-5 w-5 text-rose-500" />} 
                subtitle="Total tuition fee refund executions"
                trend={{ value: `${((stats.refunded/stats.total)*100).toFixed(1)}% Refunded`, isPositive: false }}
              />
            </div>

            {/* Quick Filters Area */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Search Filters</span>
              </div>
              
              <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search name, roll num, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="pl-9 pr-4 py-1.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Enrolled Date Range Filter */}
                <EnrollmentDatePicker 
                  startDate={filterStartDate}
                  endDate={filterEndDate}
                  onApply={(start, end) => {
                    setFilterStartDate(start);
                    setFilterEndDate(end);
                  }}
                />

                <SearchableDropdown
                  label="Centre Name"
                  options={centresList}
                  value={filterCentre}
                  onChange={setFilterCentre}
                  counts={centreCounts}
                  totalCount={students.length}
                  placeholder="-Select Centre Name-"
                />

                <SearchableDropdown
                  label="Colleges"
                  options={collegesList}
                  value={filterCollege}
                  onChange={setFilterCollege}
                  counts={collegeCounts}
                  totalCount={students.length}
                  placeholder="-Select College-"
                />

                <SearchableDropdown
                  label="Districts"
                  options={districtsList}
                  value={filterDistrict}
                  onChange={setFilterDistrict}
                  counts={districtCounts}
                  totalCount={students.length}
                  placeholder="-Select District-"
                />

                <SearchableDropdown
                  label="States"
                  options={statesList}
                  value={filterState}
                  onChange={setFilterState}
                  counts={stateCounts}
                  totalCount={students.length}
                  placeholder="-Select State-"
                />

                <SearchableDropdown
                  label="Placed Statuses"
                  options={placedStatusList}
                  value={filterPlacedStatus}
                  onChange={setFilterPlacedStatus}
                  counts={placedStatusCounts}
                  totalCount={students.length}
                  placeholder="-Select Placed Status-"
                />

                <SearchableDropdown
                  label="Job Tracks"
                  options={tracksList}
                  value={filterTrack}
                  onChange={setFilterTrack}
                  counts={trackCounts}
                  totalCount={students.length}
                  placeholder="-Select Job Track-"
                  optionFormatter={(track) => track.replace(/_/g, " ")}
                />
              </div>
            </div>

            {/* Recharts Analytics distribution graph visualizations */}
            <AnalyticsCharts students={filteredStudents} isAdmin={isAdmin} />

            {/* Pivot table block */}
            <PivotTable students={filteredStudents} />
          </div>
        )}

        {/* PAGE 1 COMPONENT: SALES REGISTER SHEET */}
        {activeTab === "registry" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Table actions header */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Coordinator Active Student Registry</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Click on any candidate record row to immediately navigate to their profile details page.</p>
              </div>
              <button
                onClick={triggerCSVDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Download className="h-4 w-4" />
                Export Checked CSV
              </button>
            </div>

            {/* Active search filter details */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter grid by full name or registration ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-9 pr-4 py-1.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Enrolled Date Range Filter */}
              <EnrollmentDatePicker 
                startDate={filterStartDate}
                endDate={filterEndDate}
                onApply={(start, end) => {
                  setFilterStartDate(start);
                  setFilterEndDate(end);
                }}
              />

              <SearchableDropdown
                label="Centre Name"
                options={centresList}
                value={filterCentre}
                onChange={setFilterCentre}
                counts={centreCounts}
                totalCount={students.length}
                placeholder="-Select Centre Name-"
              />

              <SearchableDropdown
                label="Colleges"
                options={collegesList}
                value={filterCollege}
                onChange={setFilterCollege}
                counts={collegeCounts}
                totalCount={students.length}
                placeholder="-Select College-"
              />

              <SearchableDropdown
                label="Districts"
                options={districtsList}
                value={filterDistrict}
                onChange={setFilterDistrict}
                counts={districtCounts}
                totalCount={students.length}
                placeholder="-Select District-"
              />

              <SearchableDropdown
                label="States"
                options={statesList}
                value={filterState}
                onChange={setFilterState}
                counts={stateCounts}
                totalCount={students.length}
                placeholder="-Select State-"
              />

              <SearchableDropdown
                label="Placed Statuses"
                options={placedStatusList}
                value={filterPlacedStatus}
                onChange={setFilterPlacedStatus}
                counts={placedStatusCounts}
                totalCount={students.length}
                placeholder="-Select Placed Status-"
              />

              <SearchableDropdown
                label="Batches"
                options={batchesList}
                value={filterBatch}
                onChange={setFilterBatch}
                counts={batchCounts}
                totalCount={students.length}
                placeholder="-Select Batch-"
              />
            </div>

            {/* Grid table representation */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4 text-slate-600 dark:text-slate-300">Your Full Name</th>
                      <th className="py-3.5 px-4 text-slate-600 dark:text-slate-300">Student ID</th>
                      <th className="py-3.5 px-4 text-slate-600 dark:text-slate-300">Batch Details</th>
                      <th className="py-3.5 px-4 text-slate-600 dark:text-slate-300">Centre Name</th>
                      <th className="py-3.5 px-4 text-slate-600 dark:text-slate-300">District</th>
                      <th className="py-3.5 px-4 text-slate-600 dark:text-slate-300">State</th>
                      <th className="py-3.5 px-4 text-slate-600 dark:text-slate-300">Graduation College / University Name</th>
                      <th className="py-3.5 px-4 text-slate-600 dark:text-slate-300">Year Of Passing</th>
                      <th className="py-3.5 px-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                    {filteredRegistryStudents.length > 0 ? (
                      filteredRegistryStudents.map(student => (
                        <tr
                          key={student.studentId}
                          onClick={() => {
                            setSelectedStudentId(student.studentId);
                            setActiveTab("profiles");
                          }}
                          className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 text-slate-900 dark:text-slate-100 font-bold flex items-center gap-2">
                            <div className="h-6 w-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-[10px] text-slate-655 dark:text-slate-350">
                              {student.fullName.charAt(0)}
                            </div>
                            {student.fullName}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">{student.studentId}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-450">{student.batchDetails || "—"}</td>
                          <td className="py-3 px-4">
                            {student.centreName ? (
                              <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                                {student.centreName}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-450">{student.district || "—"}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-450">{student.state || "—"}</td>
                          <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-450" title={student.graduationCollegeName}>{student.graduationCollegeName || "—"}</td>
                          <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-450">{student.graduationYearOfPassing || "—"}</td>
                          <td className="py-3 px-4 text-slate-400">
                            <ChevronRight className="h-4 w-4 text-slate-350 dark:text-slate-600" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-600 font-bold">
                          No matching active student profiles detected for current criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: INDIVIDUAL STUDENT PROFILES VIEWER */}
        {activeTab === "profiles" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Profile Pre-Selector drop list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Select Student Portfolio</span>
              </div>
              <SearchableDropdown
                label="Student Portfolios"
                options={students.map(s => s.studentId).filter((id): id is string => !!id)}
                value={selectedStudentId || ""}
                onChange={(val) => {
                  if (val !== "All") setSelectedStudentId(val);
                }}
                totalCount={students.length}
                placeholder="Search Student Name or ID..."
                allowAll={false}
                className="w-full sm:w-80"
                optionFormatter={(id) => {
                  const s = students.find(st => st.studentId === id);
                  return s ? `${s.fullName} (${s.studentId})` : id;
                }}
              />
            </div>

            {/* Profile viewer component */}
            <StudentProfile student={selectedStudent} />
          </div>
        )}

        {/* PAGE 2 TAB: SALES CO-PILOT AI BOT CHAT */}
        {activeTab === "chatbot" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-blue-600/5 dark:bg-blue-955/10 border border-blue-105/40 dark:border-blue-900/40 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                  AI
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">AI Student Assistant (Page 2 Memory Channel)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">Under Page 2 Guidelines, the AI is programmed with the precise active memory of the student database sheet currently active.</p>
                </div>
              </div>
              <div className="hidden sm:block text-xs font-bold text-blue-700 dark:text-blue-400 px-3 py-1 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                Model: Gemini 2.5 Flash
              </div>
            </div>

            <AICoPilot students={students} rawCSV={rawCSV} />
          </div>
        )}

        {/* TAB: CSV PORTAL SHEET IMPORT */}
        {isAdmin && activeTab === "loader" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Description bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Administrator Setup & Database Management</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Customize your agency branding and manage student database memory profiles dynamically.</p>
            </div>

            {/* Admin Grid: Logo Customization + CSV database */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* BRAND LOGO CUSTOMIZATION */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <FileUp className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                    Company Logo Setup
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 mb-4 leading-relaxed">
                    Upload an image (PNG, JPG, SVG) to customize the brand logo throughout the application, replacing the default header and login graphics.
                  </p>

                  <div className="space-y-4">
                    {/* Image Preview / Input Area */}
                    <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-950/10 hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors relative min-h-[160px]">
                      {companyLogo ? (
                        <div className="space-y-3 flex flex-col items-center w-full">
                          <img 
                            src={companyLogo} 
                            alt="Current Company Logo" 
                            className="max-h-24 max-w-full object-contain rounded-lg p-2 bg-white border border-slate-100 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <span>✓</span> Custom Logo Active
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="mx-auto h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg">
                            🖼️
                          </div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            No custom logo uploaded
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Showing default brand logo
                          </p>
                        </div>
                      )}

                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64 = event.target?.result as string;
                              if (base64) {
                                setCompanyLogo(base64);
                                localStorage.setItem("nxtwave_company_logo", base64);
                                saveLogoToServer(base64);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Upload a new Company Logo"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.accept = 'image/*';
                          fileInput.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                if (base64) {
                                  setCompanyLogo(base64);
                                  localStorage.setItem("nxtwave_company_logo", base64);
                                  saveLogoToServer(base64);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          fileInput.click();
                        }}
                        className="flex-1 py-2 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-center cursor-pointer"
                      >
                        Upload Image
                      </button>

                      {companyLogo && (
                        <button
                          type="button"
                          onClick={() => {
                            setCompanyLogo(null);
                            localStorage.removeItem("nxtwave_company_logo");
                            saveLogoToServer(null);
                          }}
                          className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-lg transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CSV DATABASE MANAGEMENT */}
              <div className="lg:col-span-2 space-y-6">
                <CSVLoader 
                  onDataLoaded={handleCSVLoaded} 
                  currentCount={students.length} 
                  lastSyncDate={lastSyncDate}
                />
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Styled Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-6 mt-12 text-center text-xs text-slate-400 dark:text-slate-500 font-medium select-none shrink-0 tracking-wider">
        © 2026 Intensive offline: Student Details Co-pilot • Clean Minimalist Interface
      </footer>
    </div>
  );
}
