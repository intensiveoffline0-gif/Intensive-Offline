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
  ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight,
  BrainCircuit, ExternalLink, HelpCircle,
  MapPin, RefreshCw, RotateCcw, X, Settings
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

  // Pagination for Students Details Tab (20 records per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 20;

  // Load persistent CSV, logo, and sync info from server upon mount
  useEffect(() => {
    const fetchSavedData = async () => {
      let loaded = false;
      try {
        const res = await fetch("/api/csv");
        if (res.ok) {
          const data = await res.json();
          if (data && data.csv) {
            const parsed = parseStudentCSV(data.csv);
            if (parsed.length > 0) {
              setStudents(parsed);
              setRawCSV(data.csv);
              localStorage.setItem("nxtwave_custom_csv", data.csv);
              setSelectedStudentId(parsed[0].studentId);
              loaded = true;
            }
          }
        }
      } catch (err) {
        console.warn("Could not reach /api/csv, attempting localStorage recovery:", err);
      }

      if (!loaded) {
        // Sync up from client's localStorage if a custom CSV exists!
        const localCSV = localStorage.getItem("nxtwave_custom_csv");
        if (localCSV) {
          const parsed = parseStudentCSV(localCSV);
          if (parsed.length > 0) {
            setStudents(parsed);
            setRawCSV(localCSV);
            setSelectedStudentId(parsed[0].studentId);
            
            // Background upload to restore server-side cache if available
            const savedPin = sessionStorage.getItem("nxtwave_admin_pin") || "admin0929";
            fetch("/api/csv", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ csv: localCSV, pin: savedPin }),
            }).catch(() => {});
          }
        }
      }
      setIsLoadingCSV(false);

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

  // Track if any search filter is applied
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim() !== "") count++;
    if (filterCentre !== "All") count++;
    if (filterCollege !== "All") count++;
    if (filterDistrict !== "All") count++;
    if (filterState !== "All") count++;
    if (filterPlacedStatus !== "All") count++;
    if (filterTrack !== "All") count++;
    if (filterBatch !== "All") count++;
    if (filterStartDate !== null || filterEndDate !== null) count++;
    return count;
  }, [searchQuery, filterCentre, filterCollege, filterDistrict, filterState, filterPlacedStatus, filterTrack, filterBatch, filterStartDate, filterEndDate]);

  const hasActiveFilters = activeFiltersCount > 0;

  const handleClearAllFilters = () => {
    setSearchName("");
    setFilterCentre("All");
    setFilterCollege("All");
    setFilterDistrict("All");
    setFilterState("All");
    setFilterPlacedStatus("All");
    setFilterTrack("All");
    setFilterBatch("All");
    setFilterStartDate(null);
    setFilterEndDate(null);
  };
 
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

  // Direct Sync from Zoho Handler (Pulls real-time live data directly from Zoho Creator)
  const handleSyncFromZoho = async () => {
    setIsSyncing(true);
    setSyncToast(null);
    try {
      const clientTime = formatSyncDate(new Date());
      let res = await fetch("/api/zoho/live-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSyncTime: clientTime })
      });

      if (!res.ok) {
        // Fallback endpoint
        res = await fetch("/api/zoho/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientSyncTime: clientTime })
        });
      }

      let newCSV = "";
      let totalCount = 0;
      let activeCount = 0;
      let refundedCount = 0;
      let updatedCount = 0;
      let newCount = 0;
      let syncDateStr = clientTime;
      let warningMsg = "";

      if (res.ok) {
        const data = await res.json();
        newCSV = data.csv;
        totalCount = data.count || 0;
        activeCount = data.activeCount || 0;
        refundedCount = data.refundedCount || 0;
        updatedCount = data.updatedCount || 0;
        newCount = data.newCount || 0;
        if (data.lastSync) syncDateStr = data.lastSync;
        if (data.warning) warningMsg = data.warning;
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Unable to sync from Zoho server. Please ensure the latest Vercel code is deployed.");
      }

      if (!newCSV) {
        throw new Error("Received empty dataset from Zoho sync.");
      }

      const parsed = parseStudentCSV(newCSV);
      if (parsed.length === 0) {
        throw new Error("No student records recognized in Zoho Creator report.");
      }

      setStudents(parsed);
      setRawCSV(newCSV);
      localStorage.setItem("nxtwave_custom_csv", newCSV);
      setLastSyncDate(syncDateStr);
      localStorage.setItem("nxtwave_last_zoho_sync", syncDateStr);
      if (parsed.length > 0 && (!selectedStudentId || !parsed.some(s => s.studentId === selectedStudentId))) {
        setSelectedStudentId(parsed[0].studentId);
      }
      
      if (warningMsg) {
        setSyncToast({
          type: "info",
          message: warningMsg,
        });
      } else {
        const activeInfo = activeCount > 0 ? ` (${activeCount} Active, ${refundedCount} Refunded)` : "";
        setSyncToast({
          type: "success",
          message: `Synced with Zoho Creator! ${parsed.length} profiles loaded${activeInfo}.`,
        });
      }
    } catch (err: any) {
      console.error("Zoho live sync failed:", err);
      setSyncToast({
        type: "error",
        message: err.message || "Failed to sync latest values from Zoho Creator.",
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncToast(null);
      }, 6000);
    }
  };
 
  // Find selected student details
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find(s => s.studentId === selectedStudentId) || null;
  }, [students, selectedStudentId]);
 
  // Generic Filter Matching Engine for Cascading/Faceted Filter Logic
  const matchStudentWithFilters = (
    s: Student, 
    criteria: {
      searchQuery?: string;
      centre?: string;
      college?: string;
      district?: string;
      state?: string;
      placedStatus?: string;
      track?: string;
      batch?: string;
      startDate?: Date | null;
      endDate?: Date | null;
    }
  ): boolean => {
    // 1. Text Search query
    if (criteria.searchQuery && criteria.searchQuery.trim()) {
      const q = criteria.searchQuery.toLowerCase().trim();
      const matchSearch = 
        (s.fullName || "").toLowerCase().includes(q) ||
        (s.studentId || "").toLowerCase().includes(q) ||
        (s.personalMailId || "").toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    // 2. Centre Name
    if (criteria.centre && criteria.centre !== "All") {
      if ((s.centreName || "").trim().toUpperCase() !== criteria.centre.trim().toUpperCase()) {
        return false;
      }
    }

    // 3. College
    if (criteria.college && criteria.college !== "All") {
      if ((s.graduationCollegeName || "").trim().toLowerCase() !== criteria.college.trim().toLowerCase()) {
        return false;
      }
    }

    // 4. District
    if (criteria.district && criteria.district !== "All") {
      if ((s.district || "").trim().toLowerCase() !== criteria.district.trim().toLowerCase()) {
        return false;
      }
    }

    // 5. State
    if (criteria.state && criteria.state !== "All") {
      if ((s.state || "").trim().toLowerCase() !== criteria.state.trim().toLowerCase()) {
        return false;
      }
    }

    // 6. Placed Status
    if (criteria.placedStatus && criteria.placedStatus !== "All") {
      const hasNxtwave = !!s.placedOrganisation;
      const hasExternal = !!s.externalPlacedOrganisation;
      if (criteria.placedStatus === "Placed Through Nxtwave" && !hasNxtwave) return false;
      if (criteria.placedStatus === "External Placed" && !hasExternal) return false;
      if (criteria.placedStatus === "Yet To Place" && (hasNxtwave || hasExternal)) return false;
    }

    // 7. Preferred Track
    if (criteria.track && criteria.track !== "All") {
      if ((s.preferredJobTrack || "").trim() !== criteria.track.trim()) {
        return false;
      }
    }

    // 8. Batch Details
    if (criteria.batch && criteria.batch !== "All") {
      if ((s.batchDetails || "").trim().toUpperCase() !== criteria.batch.trim().toUpperCase()) {
        return false;
      }
    }

    // 9. Enrolled Date Range
    if (criteria.startDate || criteria.endDate) {
      const d = parseEnrollmentDate(s.enrolledOn);
      if (!d) return false;
      if (criteria.startDate) {
        const startOfDay = new Date(criteria.startDate);
        startOfDay.setHours(0, 0, 0, 0);
        if (d < startOfDay) return false;
      }
      if (criteria.endDate) {
        const endOfDay = new Date(criteria.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (d > endOfDay) return false;
      }
    }

    return true;
  };

  // 1. Cascading Student Subsets for each filter dropdown
  const studentsForDistrict = useMemo(() => {
    return students.filter(s => matchStudentWithFilters(s, {
      searchQuery,
      centre: filterCentre,
      college: filterCollege,
      state: filterState,
      placedStatus: filterPlacedStatus,
      track: filterTrack,
      batch: filterBatch,
      startDate: filterStartDate,
      endDate: filterEndDate
    }));
  }, [students, searchQuery, filterCentre, filterCollege, filterState, filterPlacedStatus, filterTrack, filterBatch, filterStartDate, filterEndDate]);

  const studentsForState = useMemo(() => {
    return students.filter(s => matchStudentWithFilters(s, {
      searchQuery,
      centre: filterCentre,
      college: filterCollege,
      district: filterDistrict,
      placedStatus: filterPlacedStatus,
      track: filterTrack,
      batch: filterBatch,
      startDate: filterStartDate,
      endDate: filterEndDate
    }));
  }, [students, searchQuery, filterCentre, filterCollege, filterDistrict, filterPlacedStatus, filterTrack, filterBatch, filterStartDate, filterEndDate]);

  const studentsForCollege = useMemo(() => {
    return students.filter(s => matchStudentWithFilters(s, {
      searchQuery,
      centre: filterCentre,
      district: filterDistrict,
      state: filterState,
      placedStatus: filterPlacedStatus,
      track: filterTrack,
      batch: filterBatch,
      startDate: filterStartDate,
      endDate: filterEndDate
    }));
  }, [students, searchQuery, filterCentre, filterDistrict, filterState, filterPlacedStatus, filterTrack, filterBatch, filterStartDate, filterEndDate]);

  const studentsForCentre = useMemo(() => {
    return students.filter(s => matchStudentWithFilters(s, {
      searchQuery,
      college: filterCollege,
      district: filterDistrict,
      state: filterState,
      placedStatus: filterPlacedStatus,
      track: filterTrack,
      batch: filterBatch,
      startDate: filterStartDate,
      endDate: filterEndDate
    }));
  }, [students, searchQuery, filterCollege, filterDistrict, filterState, filterPlacedStatus, filterTrack, filterBatch, filterStartDate, filterEndDate]);

  const studentsForBatch = useMemo(() => {
    return students.filter(s => matchStudentWithFilters(s, {
      searchQuery,
      centre: filterCentre,
      college: filterCollege,
      district: filterDistrict,
      state: filterState,
      placedStatus: filterPlacedStatus,
      track: filterTrack,
      startDate: filterStartDate,
      endDate: filterEndDate
    }));
  }, [students, searchQuery, filterCentre, filterCollege, filterDistrict, filterState, filterPlacedStatus, filterTrack, filterStartDate, filterEndDate]);

  const studentsForTrack = useMemo(() => {
    return students.filter(s => matchStudentWithFilters(s, {
      searchQuery,
      centre: filterCentre,
      college: filterCollege,
      district: filterDistrict,
      state: filterState,
      placedStatus: filterPlacedStatus,
      batch: filterBatch,
      startDate: filterStartDate,
      endDate: filterEndDate
    }));
  }, [students, searchQuery, filterCentre, filterCollege, filterDistrict, filterState, filterPlacedStatus, filterBatch, filterStartDate, filterEndDate]);

  const studentsForPlacedStatus = useMemo(() => {
    return students.filter(s => matchStudentWithFilters(s, {
      searchQuery,
      centre: filterCentre,
      college: filterCollege,
      district: filterDistrict,
      state: filterState,
      track: filterTrack,
      batch: filterBatch,
      startDate: filterStartDate,
      endDate: filterEndDate
    }));
  }, [students, searchQuery, filterCentre, filterCollege, filterDistrict, filterState, filterTrack, filterBatch, filterStartDate, filterEndDate]);

  // 2. Cascading Derived Lists and Option Counts for Dropdowns
  const districtsList = useMemo(() => {
    const list = new Set<string>();
    studentsForDistrict.forEach(s => {
      if (s.district && s.district.trim()) list.add(s.district.trim());
    });
    return Array.from(list).sort();
  }, [studentsForDistrict]);

  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    studentsForDistrict.forEach(s => {
      if (s.district && s.district.trim()) {
        const val = s.district.trim();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  }, [studentsForDistrict]);

  const statesList = useMemo(() => {
    const list = new Set<string>();
    studentsForState.forEach(s => {
      if (s.state && s.state.trim()) list.add(s.state.trim());
    });
    return Array.from(list).sort();
  }, [studentsForState]);

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    studentsForState.forEach(s => {
      if (s.state && s.state.trim()) {
        const val = s.state.trim();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  }, [studentsForState]);

  const collegesList = useMemo(() => {
    const list = new Set<string>();
    studentsForCollege.forEach(s => {
      if (s.graduationCollegeName && s.graduationCollegeName.trim()) {
        list.add(s.graduationCollegeName.trim());
      }
    });
    return Array.from(list).sort();
  }, [studentsForCollege]);

  const collegeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    studentsForCollege.forEach(s => {
      if (s.graduationCollegeName && s.graduationCollegeName.trim()) {
        const val = s.graduationCollegeName.trim();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  }, [studentsForCollege]);

  const centresList = useMemo(() => {
    const list = new Set<string>();
    studentsForCentre.forEach(s => {
      if (s.centreName && s.centreName.trim()) {
        list.add(s.centreName.trim());
      }
    });
    return Array.from(list).sort();
  }, [studentsForCentre]);

  const centreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    studentsForCentre.forEach(s => {
      if (s.centreName && s.centreName.trim()) {
        const val = s.centreName.trim();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  }, [studentsForCentre]);

  const batchesList = useMemo(() => {
    const list = new Set<string>();
    studentsForBatch.forEach(s => {
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
  }, [studentsForBatch]);

  const batchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    studentsForBatch.forEach(s => {
      if (s.batchDetails && s.batchDetails.trim()) {
        const val = s.batchDetails.trim().toUpperCase();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  }, [studentsForBatch]);

  const tracksList = useMemo(() => {
    const list = new Set<string>();
    studentsForTrack.forEach(s => {
      if (s.preferredJobTrack && s.preferredJobTrack.trim()) {
        list.add(s.preferredJobTrack.trim());
      }
    });
    return Array.from(list).sort();
  }, [studentsForTrack]);

  const trackCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    studentsForTrack.forEach(s => {
      if (s.preferredJobTrack && s.preferredJobTrack.trim()) {
        const val = s.preferredJobTrack.trim();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  }, [studentsForTrack]);

  const placedStatusCounts = useMemo(() => {
    let nxtwave = 0;
    let external = 0;
    let yetToPlace = 0;
    studentsForPlacedStatus.forEach(s => {
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
  }, [studentsForPlacedStatus]);

  const placedStatusList = useMemo(() => {
    const base = [
      "Placed Through Nxtwave",
      "External Placed",
      "Yet To Place"
    ];
    return base.filter(status => (placedStatusCounts[status as keyof typeof placedStatusCounts] || 0) > 0);
  }, [placedStatusCounts]);

  // 3. Cascading Auto-Reset: If active selection no longer exists in refined options, reset to "All"
  useEffect(() => {
    if (filterDistrict !== "All" && !districtsList.includes(filterDistrict)) {
      setFilterDistrict("All");
    }
  }, [districtsList, filterDistrict]);

  useEffect(() => {
    if (filterCollege !== "All" && !collegesList.includes(filterCollege)) {
      setFilterCollege("All");
    }
  }, [collegesList, filterCollege]);

  useEffect(() => {
    if (filterCentre !== "All" && !centresList.includes(filterCentre)) {
      setFilterCentre("All");
    }
  }, [centresList, filterCentre]);

  useEffect(() => {
    if (filterState !== "All" && !statesList.includes(filterState)) {
      setFilterState("All");
    }
  }, [statesList, filterState]);

  useEffect(() => {
    if (filterBatch !== "All" && !batchesList.includes(filterBatch)) {
      setFilterBatch("All");
    }
  }, [batchesList, filterBatch]);

  useEffect(() => {
    if (filterTrack !== "All" && !tracksList.includes(filterTrack)) {
      setFilterTrack("All");
    }
  }, [tracksList, filterTrack]);

  useEffect(() => {
    if (filterPlacedStatus !== "All" && !placedStatusList.includes(filterPlacedStatus)) {
      setFilterPlacedStatus("All");
    }
  }, [placedStatusList, filterPlacedStatus]);

  // 4. Master Filtered Students List
  const filteredStudents = useMemo(() => {
    return students.filter(s => matchStudentWithFilters(s, {
      searchQuery,
      centre: filterCentre,
      college: filterCollege,
      district: filterDistrict,
      state: filterState,
      placedStatus: filterPlacedStatus,
      track: filterTrack,
      batch: filterBatch,
      startDate: filterStartDate,
      endDate: filterEndDate
    }));
  }, [students, searchQuery, filterCentre, filterCollege, filterDistrict, filterState, filterPlacedStatus, filterTrack, filterBatch, filterStartDate, filterEndDate]);

  // Aggregate Core Metrics (KPIs) - dynamically reflects active filters
  const stats = useMemo(() => {
    const total = filteredStudents.length;
    // Refunded learners
    const refunded = filteredStudents.filter(s => s.activeStatus?.toLowerCase() === "refunded").length;
    // Active Learners includes all non-refunded enrolled learners (Active + Changed Program)
    const active = Math.max(0, total - refunded);
    
    // Placed count calculation
    const placed = filteredStudents.filter(s => !!(s.placedOrganisation || s.externalPlacedOrganisation)).length;
    const placementRate = total > 0 ? parseFloat(((placed / total) * 100).toFixed(1)) : 0;

    // Highest Package parsed
    let maxCtc = 0;
    filteredStudents.forEach(s => {
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
  }, [filteredStudents]);

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

  // Reset pagination to page 1 whenever any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCentre, filterCollege, filterDistrict, filterState, filterPlacedStatus, filterTrack, filterBatch, filterStartDate, filterEndDate]);

  const totalRegistryRecords = filteredRegistryStudents.length;
  const totalRegistryPages = Math.max(1, Math.ceil(totalRegistryRecords / PAGE_SIZE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalRegistryPages);

  const paginatedRegistryStudents = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return filteredRegistryStudents.slice(start, start + PAGE_SIZE);
  }, [filteredRegistryStudents, validCurrentPage]);

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

            {/* Admin Settings Button (Right side of the Sync button) */}
            <button
              type="button"
              onClick={() => setActiveTab("loader")}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === "loader"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md ring-2 ring-indigo-500"
                  : "bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
              }`}
              title="Admin Settings & Zoho Database Reports"
            >
              <Settings className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>Admin Settings</span>
            </button>
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
          </nav>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              {stats.active} Records Active ({stats.total} Enrolled)
            </span>
          </div>
        </div>

        {/* PAGE 1: CAMPUS DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Search Filters Area (Top of Campus Dashboard) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Search Filters</span>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAllFilters}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer shadow-xs animate-fadeIn"
                    title="Clear all applied filters"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Clear Filters</span>
                    <span className="px-1.5 py-0.2 bg-rose-200/60 dark:bg-rose-800/60 rounded-full text-[10px]">
                      {activeFiltersCount}
                    </span>
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search name, roll num, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="pl-9 pr-8 py-1.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchName("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Clear search text"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
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
                  totalCount={studentsForCentre.length}
                  placeholder="-Select Centre Name-"
                />

                <SearchableDropdown
                  label="Colleges"
                  options={collegesList}
                  value={filterCollege}
                  onChange={setFilterCollege}
                  counts={collegeCounts}
                  totalCount={studentsForCollege.length}
                  placeholder="-Select College-"
                />

                <SearchableDropdown
                  label="Districts"
                  options={districtsList}
                  value={filterDistrict}
                  onChange={setFilterDistrict}
                  counts={districtCounts}
                  totalCount={studentsForDistrict.length}
                  placeholder="-Select District-"
                />

                <SearchableDropdown
                  label="States"
                  options={statesList}
                  value={filterState}
                  onChange={setFilterState}
                  counts={stateCounts}
                  totalCount={studentsForState.length}
                  placeholder="-Select State-"
                />

                <SearchableDropdown
                  label="Placed Statuses"
                  options={placedStatusList}
                  value={filterPlacedStatus}
                  onChange={setFilterPlacedStatus}
                  counts={placedStatusCounts}
                  totalCount={studentsForPlacedStatus.length}
                  placeholder="-Select Placed Status-"
                />

                <SearchableDropdown
                  label="Job Tracks"
                  options={tracksList}
                  value={filterTrack}
                  onChange={setFilterTrack}
                  counts={trackCounts}
                  totalCount={studentsForTrack.length}
                  placeholder="-Select Job Track-"
                  optionFormatter={(track) => track.replace(/_/g, " ")}
                />

                {hasActiveFilters && (
                  <button
                    onClick={handleClearAllFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/50 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer animate-fadeIn"
                    title="Clear all active filters"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* KPI Cards Area (Directly reflects current active filters) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard 
                title="Total Enrolls" 
                value={stats.total} 
                icon={<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />} 
                subtitle={hasActiveFilters ? `Filtered out of ${students.length} total enrollments` : "Master Enrollments Report count"}
              />
              <MetricCard 
                title="Active Learners" 
                value={stats.active} 
                icon={<Users className="h-5 w-5 text-emerald-500" />} 
                subtitle={`${stats.refunded} refunded learners excluded`}
                trend={{ value: stats.total > 0 ? `${((stats.active/stats.total)*100).toFixed(1)}% Active` : "0% Active", isPositive: true }}
              />
              <MetricCard 
                title="Refunds Count" 
                value={stats.refunded} 
                icon={<ShieldAlert className="h-5 w-5 text-rose-500" />} 
                subtitle={hasActiveFilters ? "Refunded learners matching current filters" : "Includes early refunds before profile submission"}
                trend={{ value: stats.total > 0 ? `${((stats.refunded/stats.total)*100).toFixed(1)}% Refunded` : "0% Refunded", isPositive: false }}
              />
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
                totalCount={studentsForCentre.length}
                placeholder="-Select Centre Name-"
              />

              <SearchableDropdown
                label="Colleges"
                options={collegesList}
                value={filterCollege}
                onChange={setFilterCollege}
                counts={collegeCounts}
                totalCount={studentsForCollege.length}
                placeholder="-Select College-"
              />

              <SearchableDropdown
                label="Districts"
                options={districtsList}
                value={filterDistrict}
                onChange={setFilterDistrict}
                counts={districtCounts}
                totalCount={studentsForDistrict.length}
                placeholder="-Select District-"
              />

              <SearchableDropdown
                label="States"
                options={statesList}
                value={filterState}
                onChange={setFilterState}
                counts={stateCounts}
                totalCount={studentsForState.length}
                placeholder="-Select State-"
              />

              <SearchableDropdown
                label="Placed Statuses"
                options={placedStatusList}
                value={filterPlacedStatus}
                onChange={setFilterPlacedStatus}
                counts={placedStatusCounts}
                totalCount={studentsForPlacedStatus.length}
                placeholder="-Select Placed Status-"
              />

              <SearchableDropdown
                label="Batches"
                options={batchesList}
                value={filterBatch}
                onChange={setFilterBatch}
                counts={batchCounts}
                totalCount={studentsForBatch.length}
                placeholder="-Select Batch-"
              />

              {hasActiveFilters && (
                <button
                  onClick={handleClearAllFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/50 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer animate-fadeIn"
                  title="Clear all active filters"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear Filters ({activeFiltersCount})</span>
                </button>
              )}
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
                    {paginatedRegistryStudents.length > 0 ? (
                      paginatedRegistryStudents.map(student => (
                        <tr
                          key={student.studentId}
                          onClick={() => {
                            setSelectedStudentId(student.studentId);
                            setActiveTab("profiles");
                          }}
                          className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 text-slate-900 dark:text-slate-100 font-bold flex items-center gap-2.5">
                            <div className="relative h-7 w-7 shrink-0">
                              {student.profilePhoto ? (
                                <img
                                  src={student.profilePhoto}
                                  alt={student.fullName}
                                  referrerPolicy="no-referrer"
                                  className="h-7 w-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (!target.src.includes("/api/zoho/image")) {
                                      target.src = `/api/zoho/image?url=${encodeURIComponent(student.profilePhoto!)}`;
                                    } else {
                                      target.style.display = "none";
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.classList.remove("hidden");
                                    }
                                  }}
                                />
                              ) : null}
                              <div className={`h-7 w-7 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-[10px] text-slate-655 dark:text-slate-350 border border-slate-200 dark:border-slate-700 ${student.profilePhoto ? "hidden" : ""}`}>
                                {student.fullName.charAt(0)}
                              </div>
                            </div>
                            <span className="truncate">{student.fullName}</span>
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

              {/* 20-Records-Per-Page Pagination Toolbar */}
              {totalRegistryRecords > 0 && (
                <div className="bg-slate-50/70 dark:bg-slate-800/50 px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="text-slate-500 dark:text-slate-400 font-medium">
                    Showing <span className="font-bold text-slate-800 dark:text-slate-200">{(validCurrentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {Math.min(validCurrentPage * PAGE_SIZE, totalRegistryRecords)}
                    </span>{" "}
                    of <span className="font-bold text-slate-800 dark:text-slate-200">{totalRegistryRecords}</span> students (Page {validCurrentPage} of {totalRegistryPages})
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {/* First Page Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(1)}
                      disabled={validCurrentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="First Page"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </button>

                    {/* Previous Page Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={validCurrentPage === 1}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors font-semibold"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages: (number | string)[] = [];
                        if (totalRegistryPages <= 7) {
                          for (let i = 1; i <= totalRegistryPages; i++) pages.push(i);
                        } else {
                          if (validCurrentPage <= 4) {
                            pages.push(1, 2, 3, 4, 5, "...", totalRegistryPages);
                          } else if (validCurrentPage >= totalRegistryPages - 3) {
                            pages.push(1, "...", totalRegistryPages - 4, totalRegistryPages - 3, totalRegistryPages - 2, totalRegistryPages - 1, totalRegistryPages);
                          } else {
                            pages.push(1, "...", validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, "...", totalRegistryPages);
                          }
                        }
                        return pages.map((page, idx) => {
                          if (typeof page === "string") {
                            return (
                              <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 select-none">
                                ...
                              </span>
                            );
                          }
                          const isCurrent = page === validCurrentPage;
                          return (
                            <button
                              key={page}
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              className={`min-w-[30px] h-7 px-2 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                                isCurrent
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        });
                      })()}
                    </div>

                    {/* Next Page Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(totalRegistryPages, p + 1))}
                      disabled={validCurrentPage === totalRegistryPages}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors font-semibold"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    {/* Last Page Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(totalRegistryPages)}
                      disabled={validCurrentPage === totalRegistryPages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Last Page"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
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

        {/* TAB: ADMIN SETTINGS & ZOHO DATABASE MANAGEMENT */}
        {isAdmin && activeTab === "loader" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Description bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Admin Settings: Database & Brand Management
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Customize your agency branding and inspect the two connected Zoho Creator database reports used as the main database.</p>
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
