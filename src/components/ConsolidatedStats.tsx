import React, { useState, useMemo } from "react";
import { Student } from "../types";
import { 
  Building2, MapPin, GraduationCap, BookOpen, Download, 
  Search, ArrowRight, Layers, Table as TableIcon, Award
} from "lucide-react";

interface ConsolidatedStatsProps {
  students: Student[];
  totalUnfilteredCount?: number;
  onSelectCollege?: (collegeName: string) => void;
  onSelectDistrict?: (districtName: string) => void;
}

type DegreeBranchMode = "combined" | "degree" | "branch";
type GradYearSortMode = "count" | "year";

interface RankedItem {
  rank: number;
  name: string;
  count: number;
  activeCount: number;
  placedCount: number;
  extra?: string;
}

export function ConsolidatedStats({
  students,
  totalUnfilteredCount,
  onSelectCollege,
  onSelectDistrict,
}: ConsolidatedStatsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [rowLimit, setRowLimit] = useState<number | "all">(25);
  const [degreeBranchMode, setDegreeBranchMode] = useState<DegreeBranchMode>("combined");
  const [gradYearSort, setGradYearSort] = useState<GradYearSortMode>("count");

  // 1. Top Colleges (Highest number of students enrolled)
  const topColleges = useMemo<RankedItem[]>(() => {
    const map = new Map<string, { total: number; active: number; placed: number; state: string }>();

    for (const s of students) {
      const col = (s.graduationCollegeName || "").trim() || "Unspecified / Independent";
      if (!map.has(col)) {
        map.set(col, { total: 0, active: 0, placed: 0, state: s.state || "" });
      }
      const entry = map.get(col)!;
      entry.total++;
      if (s.activeStatus?.toLowerCase() !== "refunded") entry.active++;
      if (s.placedOrganisation || s.externalPlacedOrganisation) entry.placed++;
      if (!entry.state && s.state) entry.state = s.state;
    }

    const arr: RankedItem[] = [];
    map.forEach((val, name) => {
      arr.push({
        rank: 0,
        name,
        count: val.total,
        activeCount: val.active,
        placedCount: val.placed,
        extra: val.state,
      });
    });

    arr.sort((a, b) => b.count - a.count);
    return arr.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [students]);

  // 2. Area (Districts with highest enrollment)
  const topAreas = useMemo<RankedItem[]>(() => {
    const map = new Map<string, { total: number; active: number; placed: number; state: string }>();

    for (const s of students) {
      const dist = (s.district || "").trim() || "Unspecified District";
      if (!map.has(dist)) {
        map.set(dist, { total: 0, active: 0, placed: 0, state: s.state || "" });
      }
      const entry = map.get(dist)!;
      entry.total++;
      if (s.activeStatus?.toLowerCase() !== "refunded") entry.active++;
      if (s.placedOrganisation || s.externalPlacedOrganisation) entry.placed++;
      if (!entry.state && s.state) entry.state = s.state;
    }

    const arr: RankedItem[] = [];
    map.forEach((val, name) => {
      arr.push({
        rank: 0,
        name,
        count: val.total,
        activeCount: val.active,
        placedCount: val.placed,
        extra: val.state,
      });
    });

    arr.sort((a, b) => b.count - a.count);
    return arr.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [students]);

  // 3. Graduation Year
  const topGradYears = useMemo<RankedItem[]>(() => {
    const map = new Map<string, { total: number; active: number; placed: number }>();

    for (const s of students) {
      const yr = (s.graduationYearOfPassing || "").trim() || "Not Specified";
      if (!map.has(yr)) {
        map.set(yr, { total: 0, active: 0, placed: 0 });
      }
      const entry = map.get(yr)!;
      entry.total++;
      if (s.activeStatus?.toLowerCase() !== "refunded") entry.active++;
      if (s.placedOrganisation || s.externalPlacedOrganisation) entry.placed++;
    }

    const arr: RankedItem[] = [];
    map.forEach((val, name) => {
      arr.push({
        rank: 0,
        name,
        count: val.total,
        activeCount: val.active,
        placedCount: val.placed,
      });
    });

    if (gradYearSort === "year") {
      arr.sort((a, b) => {
        if (a.name === "Not Specified") return 1;
        if (b.name === "Not Specified") return -1;
        return b.name.localeCompare(a.name);
      });
    } else {
      arr.sort((a, b) => b.count - a.count);
    }

    return arr.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [students, gradYearSort]);

  // 4. Degree / Branch (Combined, Degree Only, or Branch Only)
  const topDegreeBranches = useMemo<RankedItem[]>(() => {
    const map = new Map<string, { total: number; active: number; placed: number }>();

    for (const s of students) {
      let key = "";
      const deg = (s.graduationDegreeName || "").trim();
      const br = (s.graduationStream || "").trim();

      if (degreeBranchMode === "combined") {
        if (deg && br) key = `${deg} - ${br}`;
        else if (deg) key = deg;
        else if (br) key = br;
        else key = "Not Specified";
      } else if (degreeBranchMode === "degree") {
        key = deg || "Not Specified";
      } else {
        key = br || "Not Specified";
      }

      if (!map.has(key)) {
        map.set(key, { total: 0, active: 0, placed: 0 });
      }
      const entry = map.get(key)!;
      entry.total++;
      if (s.activeStatus?.toLowerCase() !== "refunded") entry.active++;
      if (s.placedOrganisation || s.externalPlacedOrganisation) entry.placed++;
    }

    const arr: RankedItem[] = [];
    map.forEach((val, name) => {
      arr.push({
        rank: 0,
        name,
        count: val.total,
        activeCount: val.active,
        placedCount: val.placed,
      });
    });

    arr.sort((a, b) => b.count - a.count);
    return arr.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [students, degreeBranchMode]);

  // Maximum rows across the 4 ranking lists
  const maxAvailableRows = useMemo(() => {
    return Math.max(
      topColleges.length,
      topAreas.length,
      topGradYears.length,
      topDegreeBranches.length
    );
  }, [topColleges, topAreas, topGradYears, topDegreeBranches]);

  // Determine how many rows to render
  const renderedRowCount = useMemo(() => {
    if (rowLimit === "all") return maxAvailableRows;
    return Math.min(rowLimit, maxAvailableRows);
  }, [rowLimit, maxAvailableRows]);

  // Generate aligned rows
  const alignedRows = useMemo(() => {
    const rows = [];
    const query = searchQuery.toLowerCase().trim();

    for (let i = 0; i < maxAvailableRows; i++) {
      const college = topColleges[i] || null;
      const area = topAreas[i] || null;
      const year = topGradYears[i] || null;
      const degreeBranch = topDegreeBranches[i] || null;

      // Filter by search query if present
      if (query) {
        const matchesQuery = 
          (college && college.name.toLowerCase().includes(query)) ||
          (area && area.name.toLowerCase().includes(query)) ||
          (year && year.name.toLowerCase().includes(query)) ||
          (degreeBranch && degreeBranch.name.toLowerCase().includes(query));
        if (!matchesQuery) continue;
      }

      rows.push({
        index: i + 1,
        college,
        area,
        year,
        degreeBranch,
      });

      if (rowLimit !== "all" && rows.length >= rowLimit) {
        break;
      }
    }

    return rows;
  }, [
    maxAvailableRows, 
    topColleges, 
    topAreas, 
    topGradYears, 
    topDegreeBranches, 
    searchQuery, 
    rowLimit
  ]);

  // CSV Export Handler
  const exportConsolidatedCSV = () => {
    const headers = [
      "Rank",
      "Top Colleges",
      "Top Colleges Count",
      "Area (Districts)",
      "Area Count",
      "Graduation Year",
      "Graduation Year Count",
      "Degree / Branch",
      "Degree / Branch Count"
    ];

    const rows = [];
    for (let i = 0; i < maxAvailableRows; i++) {
      const col = topColleges[i];
      const ar = topAreas[i];
      const yr = topGradYears[i];
      const db = topDegreeBranches[i];

      rows.push([
        i + 1,
        col ? `"${col.name.replace(/"/g, '""')}"` : '""',
        col ? col.count : 0,
        ar ? `"${ar.name.replace(/"/g, '""')}"` : '""',
        ar ? ar.count : 0,
        yr ? `"${yr.name.replace(/"/g, '""')}"` : '""',
        yr ? yr.count : 0,
        db ? `"${db.name.replace(/"/g, '""')}"` : '""',
        db ? db.count : 0,
      ]);
    }

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `nxtwave_consolidated_stats_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Context Description */}
      <div className="bg-gradient-to-r from-slate-900 via-[#182354] to-slate-900 text-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[9px] font-semibold uppercase tracking-wider mb-0.5">
              <TableIcon className="h-2.5 w-2.5" />
              Consolidated Feeder Intelligence
            </div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">
              Consolidated Statistics
            </h1>
            <p className="text-[11px] text-slate-300 mt-0.5 max-w-2xl font-normal">
              Unified ranking leaderboard comparing <strong>Top Colleges</strong>, <strong>Geographic Areas (Districts)</strong>, <strong>Graduation Years</strong>, and <strong>Degree / Branches</strong> across <strong>{students.length.toLocaleString()} students</strong>{totalUnfilteredCount && totalUnfilteredCount !== students.length ? ` (filtered from ${totalUnfilteredCount.toLocaleString()} total)` : ""}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportConsolidatedCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>Export Consolidated CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Highlight Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-2.5 border-t border-slate-800/80 text-left">
          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Top College (#1)</span>
              <Building2 className="h-3 w-3 text-indigo-400" />
            </div>
            <div className="text-sm sm:text-base font-bold text-white mt-0.5 truncate" title={topColleges[0]?.name}>
              {topColleges[0]?.name ? topColleges[0].name.split(",")[0] : "—"}
            </div>
            <div className="text-[10px] text-indigo-300 font-semibold mt-0.5">
              ({topColleges[0]?.count || 0}) students enrolled
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Top Area (#1)</span>
              <MapPin className="h-3 w-3 text-emerald-400" />
            </div>
            <div className="text-sm sm:text-base font-bold text-white mt-0.5 truncate" title={topAreas[0]?.name}>
              {topAreas[0]?.name || "—"}
            </div>
            <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">
              ({topAreas[0]?.count || 0}) students enrolled
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Top Cohort (#1)</span>
              <GraduationCap className="h-3 w-3 text-amber-400" />
            </div>
            <div className="text-sm sm:text-base font-bold text-white mt-0.5">
              {topGradYears[0]?.name || "—"}
            </div>
            <div className="text-[10px] text-amber-300 font-semibold mt-0.5">
              ({topGradYears[0]?.count || 0}) students
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Top Discipline (#1)</span>
              <BookOpen className="h-3 w-3 text-purple-400" />
            </div>
            <div className="text-sm sm:text-base font-bold text-white mt-0.5 truncate" title={topDegreeBranches[0]?.name}>
              {topDegreeBranches[0]?.name || "—"}
            </div>
            <div className="text-[10px] text-purple-300 font-semibold mt-0.5">
              ({topDegreeBranches[0]?.count || 0}) students
            </div>
          </div>
        </div>
      </div>

      {/* Table Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Left: Quick search */}
        <div className="relative min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search college, area, year, or branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Right: Toggles for Degree/Branch & Row Limits */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Degree/Branch Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider px-1">Discipline:</span>
            <button
              type="button"
              onClick={() => setDegreeBranchMode("combined")}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                degreeBranchMode === "combined"
                  ? "bg-white text-slate-900 shadow-3xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Degree / Branch
            </button>
            <button
              type="button"
              onClick={() => setDegreeBranchMode("degree")}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                degreeBranchMode === "degree"
                  ? "bg-white text-slate-900 shadow-3xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Degree Only
            </button>
            <button
              type="button"
              onClick={() => setDegreeBranchMode("branch")}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                degreeBranchMode === "branch"
                  ? "bg-white text-slate-900 shadow-3xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Branch Only
            </button>
          </div>

          {/* Row Limit Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] text-slate-400 font-medium">Rows:</span>
            {[10, 25, 50].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setRowLimit(num)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  rowLimit === num
                    ? "bg-indigo-600 text-white shadow-3xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRowLimit("all")}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                rowLimit === "all"
                  ? "bg-indigo-600 text-white shadow-3xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* CONSOLIDATED 4-COLUMN TABLE (Exact structure as specified in screenshot) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            {/* Header: Solid Dark Blue Header as shown in image */}
            <thead>
              <tr className="bg-[#182354] text-white text-xs font-bold tracking-wide select-none border-b border-[#0f1b40]">
                <th className="py-3.5 px-5 w-1/4 min-w-[240px]">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-indigo-300" />
                    <span>Top Colleges</span>
                    <span className="text-[11px] text-indigo-300 font-mono font-normal">({topColleges.length})</span>
                  </div>
                </th>
                <th className="py-3.5 px-5 w-1/4 min-w-[200px]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Area</span>
                    <span className="text-[11px] text-emerald-300 font-mono font-normal">({topAreas.length})</span>
                  </div>
                </th>
                <th className="py-3.5 px-5 w-1/4 min-w-[200px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-amber-300" />
                      <span>Graduation Year</span>
                      <span className="text-[11px] text-amber-300 font-mono font-normal">({topGradYears.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGradYearSort(gradYearSort === "count" ? "year" : "count")}
                      className="text-[9px] font-normal text-slate-300 hover:text-white bg-white/10 px-1.5 py-0.5 rounded transition cursor-pointer"
                      title="Toggle Year Sort Mode"
                    >
                      {gradYearSort === "count" ? "By Count" : "By Year"}
                    </button>
                  </div>
                </th>
                <th className="py-3.5 px-5 w-1/4 min-w-[240px]">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-purple-300" />
                    <span>Degree / Branch</span>
                    <span className="text-[11px] text-purple-300 font-mono font-normal">({topDegreeBranches.length})</span>
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
              {alignedRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                    {searchQuery ? `No records found matching "${searchQuery}".` : "No student records found matching current filters."}
                  </td>
                </tr>
              ) : (
                alignedRows.map((row) => (
                  <tr 
                    key={row.index} 
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Column 1: Top Colleges (#X Name (count)) */}
                    <td className="py-3 px-5 align-top">
                      {row.college ? (
                        <div className="flex items-start justify-between gap-2 group">
                          <div className="flex items-start gap-2 max-w-[90%]">
                            <span className="font-mono text-indigo-600 font-bold text-xs shrink-0 pt-0.5">
                              #{row.college.rank}
                            </span>
                            <span 
                              className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2" 
                              title={row.college.name}
                            >
                              {row.college.name}
                            </span>
                            <span className="font-bold text-slate-600 shrink-0 font-mono">
                              ({row.college.count})
                            </span>
                          </div>
                          {onSelectCollege && (
                            <button
                              type="button"
                              onClick={() => onSelectCollege(row.college!.name)}
                              className="opacity-0 group-hover:opacity-100 text-indigo-600 hover:text-indigo-800 p-0.5 rounded transition cursor-pointer"
                              title={`Inspect ${row.college.name}`}
                            >
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono">—</span>
                      )}
                    </td>

                    {/* Column 2: Area (Districts with (#X Name (count))) */}
                    <td className="py-3 px-5 align-top">
                      {row.area ? (
                        <div className="flex items-start justify-between gap-2 group">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-emerald-600 font-bold text-xs shrink-0">
                              #{row.area.rank}
                            </span>
                            <span 
                              className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors"
                              title={row.area.name}
                            >
                              {row.area.name}
                            </span>
                            <span className="font-bold text-slate-600 shrink-0 font-mono">
                              ({row.area.count})
                            </span>
                          </div>
                          {onSelectDistrict && (
                            <button
                              type="button"
                              onClick={() => onSelectDistrict(row.area!.name)}
                              className="opacity-0 group-hover:opacity-100 text-emerald-600 hover:text-emerald-800 p-0.5 rounded transition cursor-pointer"
                              title={`Inspect ${row.area.name}`}
                            >
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono">—</span>
                      )}
                    </td>

                    {/* Column 3: Graduation Year (Year - (count)) */}
                    <td className="py-3 px-5 align-top">
                      {row.year ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-600 font-bold text-xs">
                            #{row.year.rank}
                          </span>
                          <span className="font-bold text-slate-900 font-mono">
                            {row.year.name} -
                          </span>
                          <span className="font-bold text-slate-700 font-mono">
                            ({row.year.count})
                          </span>
                          {row.year.placedCount > 0 && (
                            <span 
                              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200"
                              title={`${row.year.placedCount} students placed`}
                            >
                              <Award className="h-2.5 w-2.5" />
                              {row.year.placedCount}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono">—</span>
                      )}
                    </td>

                    {/* Column 4: Degree / Branch (Name (count)) */}
                    <td className="py-3 px-5 align-top">
                      {row.degreeBranch ? (
                        <div className="flex items-start gap-2">
                          <span className="font-mono text-purple-600 font-bold text-xs shrink-0 pt-0.5">
                            #{row.degreeBranch.rank}
                          </span>
                          <span 
                            className="font-semibold text-slate-900 line-clamp-2"
                            title={row.degreeBranch.name}
                          >
                            {row.degreeBranch.name}
                          </span>
                          <span className="font-bold text-slate-600 shrink-0 font-mono">
                            ({row.degreeBranch.count})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Summary count */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            Showing <strong>{alignedRows.length}</strong> of <strong>{maxAvailableRows}</strong> ranking positions across institutions, areas, cohorts, and disciplines.
          </span>
          <span className="text-[11px] text-slate-400">
            Counts in parentheses <code>(XX)</code> reflect currently active filters.
          </span>
        </div>
      </div>
    </div>
  );
}
