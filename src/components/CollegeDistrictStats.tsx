import React, { useState, useMemo } from "react";
import { Student } from "../types";
import { 
  Building2, MapPin, Search, Download, ExternalLink, 
  TrendingUp, Users, CheckCircle2, Award, ArrowUpDown, 
  Layers, Map as MapIcon, ArrowRight, BarChart2, GraduationCap, BookOpen
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from "recharts";

interface CollegeDistrictStatsProps {
  students: Student[];
  totalUnfilteredCount?: number;
  onSelectCollege?: (collegeName: string) => void;
  onSelectDistrict?: (districtName: string) => void;
}

type ActiveSubView = "colleges" | "districts" | "states" | "grad_year" | "degree_branch";

interface GradYearMetric {
  year: string;
  total: number;
  active: number;
  refunded: number;
  placed: number;
  activeRate: number;
  topDegree: string;
  topBranch: string;
}

interface DegreeMetric {
  degree: string;
  total: number;
  active: number;
  refunded: number;
  placed: number;
  activeRate: number;
  topBranch: string;
}

interface BranchMetric {
  branch: string;
  total: number;
  active: number;
  refunded: number;
  placed: number;
  activeRate: number;
  topDegree: string;
}

interface CollegeMetric {
  name: string;
  state: string;
  total: number;
  active: number;
  refunded: number;
  placed: number;
  activeRate: number;
  topTrack: string;
}

interface DistrictMetric {
  name: string;
  state: string;
  total: number;
  active: number;
  refunded: number;
  placed: number;
  activeRate: number;
  topCollege: string;
}

interface StateMetric {
  state: string;
  totalStudents: number;
  activeCount: number;
  districtsCount: number;
  collegesCount: number;
  placedCount: number;
  topDistrict: string;
}

interface RawCollegeEntry {
  name: string;
  stateMap: Map<string, number>;
  total: number;
  active: number;
  refunded: number;
  placed: number;
  trackMap: Map<string, number>;
}

interface RawDistrictEntry {
  name: string;
  stateMap: Map<string, number>;
  total: number;
  active: number;
  refunded: number;
  placed: number;
  collegesMap: Map<string, number>;
}

interface RawStateEntry {
  state: string;
  totalStudents: number;
  activeCount: number;
  placedCount: number;
  districts: Set<string>;
  colleges: Set<string>;
  districtCountMap: Map<string, number>;
}

export function CollegeDistrictStats({ 
  students, 
  totalUnfilteredCount,
  onSelectCollege, 
  onSelectDistrict 
}: CollegeDistrictStatsProps) {
  const [subView, setSubView] = useState<ActiveSubView>("colleges");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"total" | "active" | "placed">("total");
  const [academicRightTab, setAcademicRightTab] = useState<"degrees" | "branches">("degrees");

  // Aggregate College Metrics
  const collegeMetrics = useMemo<CollegeMetric[]>(() => {
    const map = new Map<string, RawCollegeEntry>();

    for (const s of students) {
      const colName = (s.graduationCollegeName || "").trim() || "Unspecified / Independent";
      if (!map.has(colName)) {
        map.set(colName, {
          name: colName,
          stateMap: new Map(),
          total: 0,
          active: 0,
          refunded: 0,
          placed: 0,
          trackMap: new Map(),
        });
      }
      const entry = map.get(colName)!;
      entry.total++;

      if (s.activeStatus.toLowerCase() === "refunded") {
        entry.refunded++;
      } else {
        entry.active++;
      }

      if (s.placedOrganisation || s.externalPlacedOrganisation) {
        entry.placed++;
      }

      if (s.state) {
        entry.stateMap.set(s.state, (entry.stateMap.get(s.state) || 0) + 1);
      }
      if (s.preferredJobTrack) {
        entry.trackMap.set(s.preferredJobTrack, (entry.trackMap.get(s.preferredJobTrack) || 0) + 1);
      }
    }

    const result: CollegeMetric[] = [];
    map.forEach(e => {
      let primaryState = "—";
      let maxStateCount = 0;
      e.stateMap.forEach((count, st) => {
        if (count > maxStateCount) {
          primaryState = st;
          maxStateCount = count;
        }
      });

      let topTrack = "—";
      let maxTrackCount = 0;
      e.trackMap.forEach((count, tr) => {
        if (count > maxTrackCount) {
          topTrack = tr.replace(/_/g, " ");
          maxTrackCount = count;
        }
      });

      result.push({
        name: e.name,
        state: primaryState,
        total: e.total,
        active: e.active,
        refunded: e.refunded,
        placed: e.placed,
        activeRate: e.total > 0 ? Math.round((e.active / e.total) * 100) : 0,
        topTrack
      });
    });

    return result;
  }, [students]);

  // Aggregate District Metrics
  const districtMetrics = useMemo<DistrictMetric[]>(() => {
    const map = new Map<string, RawDistrictEntry>();

    for (const s of students) {
      const distName = (s.district || "").trim() || "Unspecified District";
      if (!map.has(distName)) {
        map.set(distName, {
          name: distName,
          stateMap: new Map(),
          total: 0,
          active: 0,
          refunded: 0,
          placed: 0,
          collegesMap: new Map(),
        });
      }
      const entry = map.get(distName)!;
      entry.total++;

      if (s.activeStatus.toLowerCase() === "refunded") {
        entry.refunded++;
      } else {
        entry.active++;
      }

      if (s.placedOrganisation || s.externalPlacedOrganisation) {
        entry.placed++;
      }

      if (s.state) {
        entry.stateMap.set(s.state, (entry.stateMap.get(s.state) || 0) + 1);
      }
      if (s.graduationCollegeName) {
        entry.collegesMap.set(s.graduationCollegeName, (entry.collegesMap.get(s.graduationCollegeName) || 0) + 1);
      }
    }

    const result: DistrictMetric[] = [];
    map.forEach(e => {
      let primaryState = "—";
      let maxStateCount = 0;
      e.stateMap.forEach((count, st) => {
        if (count > maxStateCount) {
          primaryState = st;
          maxStateCount = count;
        }
      });

      let topCollege = "—";
      let maxCollegeCount = 0;
      e.collegesMap.forEach((count, col) => {
        if (count > maxCollegeCount) {
          topCollege = col;
          maxCollegeCount = count;
        }
      });

      result.push({
        name: e.name,
        state: primaryState,
        total: e.total,
        active: e.active,
        refunded: e.refunded,
        placed: e.placed,
        activeRate: e.total > 0 ? Math.round((e.active / e.total) * 100) : 0,
        topCollege
      });
    });

    return result;
  }, [students]);

  // Aggregate State Metrics
  const stateMetrics = useMemo<StateMetric[]>(() => {
    const map = new Map<string, RawStateEntry>();

    for (const s of students) {
      const st = (s.state || "").trim() || "Unspecified";
      if (!map.has(st)) {
        map.set(st, {
          state: st,
          totalStudents: 0,
          activeCount: 0,
          placedCount: 0,
          districts: new Set(),
          colleges: new Set(),
          districtCountMap: new Map(),
        });
      }
      const entry = map.get(st)!;
      entry.totalStudents++;

      if (s.activeStatus.toLowerCase() !== "refunded") {
        entry.activeCount++;
      }
      if (s.placedOrganisation || s.externalPlacedOrganisation) {
        entry.placedCount++;
      }
      if (s.district && s.district.trim()) {
        entry.districts.add(s.district.trim());
        entry.districtCountMap.set(s.district.trim(), (entry.districtCountMap.get(s.district.trim()) || 0) + 1);
      }
      if (s.graduationCollegeName && s.graduationCollegeName.trim()) {
        entry.colleges.add(s.graduationCollegeName.trim());
      }
    }

    const result: StateMetric[] = [];
    map.forEach(e => {
      let topDistrict = "—";
      let maxCount = 0;
      e.districtCountMap.forEach((count, d) => {
        if (count > maxCount) {
          topDistrict = d;
          maxCount = count;
        }
      });

      result.push({
        state: e.state,
        totalStudents: e.totalStudents,
        activeCount: e.activeCount,
        districtsCount: e.districts.size,
        collegesCount: e.colleges.size,
        placedCount: e.placedCount,
        topDistrict
      });
    });

    return result.sort((a, b) => b.totalStudents - a.totalStudents);
  }, [students]);

  // Filtered and Sorted Colleges
  const filteredColleges = useMemo(() => {
    return collegeMetrics
      .filter(c => {
        const matchesQuery = 
          c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          c.state.toLowerCase().includes(searchQuery.toLowerCase().trim());
        return matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === "active") return b.active - a.active;
        if (sortBy === "placed") return b.placed - a.placed;
        return b.total - a.total;
      });
  }, [collegeMetrics, searchQuery, sortBy]);

  // Aggregate Graduation Year Metrics
  const gradYearMetrics = useMemo<GradYearMetric[]>(() => {
    const map = new Map<string, {
      year: string;
      total: number;
      active: number;
      refunded: number;
      placed: number;
      degreeMap: Map<string, number>;
      branchMap: Map<string, number>;
    }>();

    for (const s of students) {
      const yr = (s.graduationYearOfPassing || "").trim() || "Not Specified";
      if (!map.has(yr)) {
        map.set(yr, {
          year: yr,
          total: 0,
          active: 0,
          refunded: 0,
          placed: 0,
          degreeMap: new Map(),
          branchMap: new Map(),
        });
      }
      const entry = map.get(yr)!;
      entry.total++;
      if (s.activeStatus.toLowerCase() === "refunded") {
        entry.refunded++;
      } else {
        entry.active++;
      }
      if (s.placedOrganisation || s.externalPlacedOrganisation) {
        entry.placed++;
      }
      if (s.graduationDegreeName) {
        entry.degreeMap.set(s.graduationDegreeName, (entry.degreeMap.get(s.graduationDegreeName) || 0) + 1);
      }
      if (s.graduationStream) {
        entry.branchMap.set(s.graduationStream, (entry.branchMap.get(s.graduationStream) || 0) + 1);
      }
    }

    const result: GradYearMetric[] = [];
    map.forEach(e => {
      let topDegree = "—";
      let maxDeg = 0;
      e.degreeMap.forEach((c, d) => {
        if (c > maxDeg) { topDegree = d; maxDeg = c; }
      });

      let topBranch = "—";
      let maxBr = 0;
      e.branchMap.forEach((c, b) => {
        if (c > maxBr) { topBranch = b; maxBr = c; }
      });

      result.push({
        year: e.year,
        total: e.total,
        active: e.active,
        refunded: e.refunded,
        placed: e.placed,
        activeRate: e.total > 0 ? Math.round((e.active / e.total) * 100) : 0,
        topDegree,
        topBranch,
      });
    });

    return result.sort((a, b) => {
      if (a.year === "Not Specified") return 1;
      if (b.year === "Not Specified") return -1;
      return b.year.localeCompare(a.year);
    });
  }, [students]);

  // Aggregate Degree Metrics
  const degreeMetrics = useMemo<DegreeMetric[]>(() => {
    const map = new Map<string, {
      degree: string;
      total: number;
      active: number;
      refunded: number;
      placed: number;
      branchMap: Map<string, number>;
    }>();

    for (const s of students) {
      const deg = (s.graduationDegreeName || "").trim() || "Not Specified";
      if (!map.has(deg)) {
        map.set(deg, {
          degree: deg,
          total: 0,
          active: 0,
          refunded: 0,
          placed: 0,
          branchMap: new Map(),
        });
      }
      const entry = map.get(deg)!;
      entry.total++;
      if (s.activeStatus.toLowerCase() === "refunded") {
        entry.refunded++;
      } else {
        entry.active++;
      }
      if (s.placedOrganisation || s.externalPlacedOrganisation) {
        entry.placed++;
      }
      if (s.graduationStream) {
        entry.branchMap.set(s.graduationStream, (entry.branchMap.get(s.graduationStream) || 0) + 1);
      }
    }

    const result: DegreeMetric[] = [];
    map.forEach(e => {
      let topBranch = "—";
      let maxBr = 0;
      e.branchMap.forEach((c, b) => {
        if (c > maxBr) { topBranch = b; maxBr = c; }
      });

      result.push({
        degree: e.degree,
        total: e.total,
        active: e.active,
        refunded: e.refunded,
        placed: e.placed,
        activeRate: e.total > 0 ? Math.round((e.active / e.total) * 100) : 0,
        topBranch,
      });
    });

    return result.sort((a, b) => b.total - a.total);
  }, [students]);

  // Aggregate Branch Metrics
  const branchMetrics = useMemo<BranchMetric[]>(() => {
    const map = new Map<string, {
      branch: string;
      total: number;
      active: number;
      refunded: number;
      placed: number;
      degreeMap: Map<string, number>;
    }>();

    for (const s of students) {
      const br = (s.graduationStream || "").trim() || "Not Specified";
      if (!map.has(br)) {
        map.set(br, {
          branch: br,
          total: 0,
          active: 0,
          refunded: 0,
          placed: 0,
          degreeMap: new Map(),
        });
      }
      const entry = map.get(br)!;
      entry.total++;
      if (s.activeStatus.toLowerCase() === "refunded") {
        entry.refunded++;
      } else {
        entry.active++;
      }
      if (s.placedOrganisation || s.externalPlacedOrganisation) {
        entry.placed++;
      }
      if (s.graduationDegreeName) {
        entry.degreeMap.set(s.graduationDegreeName, (entry.degreeMap.get(s.graduationDegreeName) || 0) + 1);
      }
    }

    const result: BranchMetric[] = [];
    map.forEach(e => {
      let topDegree = "—";
      let maxDeg = 0;
      e.degreeMap.forEach((c, d) => {
        if (c > maxDeg) { topDegree = d; maxDeg = c; }
      });

      result.push({
        branch: e.branch,
        total: e.total,
        active: e.active,
        refunded: e.refunded,
        placed: e.placed,
        activeRate: e.total > 0 ? Math.round((e.active / e.total) * 100) : 0,
        topDegree,
      });
    });

    return result.sort((a, b) => b.total - a.total);
  }, [students]);

  // Filtered and Sorted Districts
  const filteredDistricts = useMemo(() => {
    return districtMetrics
      .filter(d => {
        const matchesQuery = 
          d.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          d.state.toLowerCase().includes(searchQuery.toLowerCase().trim());
        return matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === "active") return b.active - a.active;
        if (sortBy === "placed") return b.placed - a.placed;
        return b.total - a.total;
      });
  }, [districtMetrics, searchQuery, sortBy]);

  // Top 10 Charts Data
  const top10CollegesData = useMemo(() => {
    return collegeMetrics
      .filter(c => c.name !== "Unspecified / Independent")
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(c => ({
        name: c.name.length > 28 ? c.name.slice(0, 26) + "..." : c.name,
        fullName: c.name,
        Active: c.active,
        Refunded: c.refunded,
        total: c.total
      }));
  }, [collegeMetrics]);

  const top10DistrictsData = useMemo(() => {
    return districtMetrics
      .filter(d => d.name !== "Unspecified District")
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(d => ({
        name: d.name,
        Active: d.active,
        Refunded: d.refunded,
        total: d.total
      }));
  }, [districtMetrics]);

  const topGradYearsData = useMemo(() => {
    return gradYearMetrics
      .filter(g => g.year !== "Not Specified")
      .slice(0, 8)
      .map(g => ({
        name: g.year,
        Active: g.active,
        Refunded: g.refunded,
        total: g.total,
      }));
  }, [gradYearMetrics]);

  const topBranchesData = useMemo(() => {
    return branchMetrics
      .slice(0, 8)
      .map(b => ({
        name: b.branch.length > 22 ? b.branch.slice(0, 20) + "..." : b.branch,
        fullName: b.branch,
        Active: b.active,
        Refunded: b.refunded,
        total: b.total,
      }));
  }, [branchMetrics]);

  // Summary KPIs
  const totalCollegesCount = collegeMetrics.filter(c => c.name !== "Unspecified / Independent").length;
  const totalDistrictsCount = districtMetrics.filter(d => d.name !== "Unspecified District").length;
  const topFeederCollege = collegeMetrics.filter(c => c.name !== "Unspecified / Independent").sort((a, b) => b.total - a.total)[0];
  const topDistrict = districtMetrics.filter(d => d.name !== "Unspecified District").sort((a, b) => b.total - a.total)[0];

  // CSV Exporters
  const exportCollegesCSV = () => {
    const headers = ["Rank", "College / University Name", "State", "Total Students", "Active Students", "Refunded", "Placed", "Active Rate (%)", "Top Job Track"];
    const rows = filteredColleges.map((c, i) => [
      i + 1,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.state.replace(/"/g, '""')}"`,
      c.total,
      c.active,
      c.refunded,
      c.placed,
      `${c.activeRate}%`,
      `"${c.topTrack.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `nxtwave_colleges_sales_stats_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDistrictsCSV = () => {
    const headers = ["Rank", "District Name", "State", "Total Students", "Active Students", "Refunded", "Placed", "Active Rate (%)", "Top Feeder College"];
    const rows = filteredDistricts.map((d, i) => [
      i + 1,
      `"${d.name.replace(/"/g, '""')}"`,
      `"${d.state.replace(/"/g, '""')}"`,
      d.total,
      d.active,
      d.refunded,
      d.placed,
      `${d.activeRate}%`,
      `"${d.topCollege.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `nxtwave_districts_sales_stats_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportGradYearsCSV = () => {
    const headers = ["Rank", "Graduation Year", "Total Students", "Active Students", "Refunded", "Placed", "Active Rate (%)", "Primary Degree", "Primary Branch"];
    const rows = gradYearMetrics.map((g, i) => [
      i + 1,
      `"${g.year}"`,
      g.total,
      g.active,
      g.refunded,
      g.placed,
      `${g.activeRate}%`,
      `"${g.topDegree.replace(/"/g, '""')}"`,
      `"${g.topBranch.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `nxtwave_grad_years_stats_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDegreesBranchesCSV = () => {
    const headers = ["Rank", "Branch / Stream", "Total Students", "Active Students", "Refunded", "Placed", "Active Rate (%)", "Primary Degree"];
    const rows = branchMetrics.map((b, i) => [
      i + 1,
      `"${b.branch.replace(/"/g, '""')}"`,
      b.total,
      b.active,
      b.refunded,
      b.placed,
      `${b.activeRate}%`,
      `"${b.topDegree.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `nxtwave_degrees_branches_stats_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Context Description */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[9px] font-semibold uppercase tracking-wider mb-0.5">
              <TrendingUp className="h-2.5 w-2.5" />
              Admissions & Institutional Intelligence
            </div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">
              Overall Analytics
            </h1>
            <p className="text-[11px] text-slate-300 mt-0.5 max-w-2xl font-normal">
              Feeder institutions, districts, and demographics across <strong>{students.length.toLocaleString()} students</strong>{totalUnfilteredCount && totalUnfilteredCount !== students.length ? ` (filtered from ${totalUnfilteredCount.toLocaleString()} total)` : ""}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (subView === "districts") exportDistrictsCSV();
                else if (subView === "grad_year") exportGradYearsCSV();
                else if (subView === "degree_branch") exportDegreesBranchesCSV();
                else exportCollegesCSV();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>
                Export {
                  subView === "districts" ? "Districts" :
                  subView === "grad_year" ? "Grad Years" :
                  subView === "degree_branch" ? "Degrees/Branches" :
                  "Colleges"
                } CSV
              </span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-2.5 border-t border-slate-800/80">
          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Feeder Colleges</span>
              <Building2 className="h-3 w-3 text-indigo-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-white mt-0.5">{totalCollegesCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate font-normal">
              #1: <span className="text-indigo-300 font-semibold">{topFeederCollege?.name.split(",")[0] || "—"}</span> ({topFeederCollege?.total || 0})
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Districts</span>
              <MapPin className="h-3 w-3 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-white mt-0.5">{totalDistrictsCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate font-normal">
              Top: <span className="text-emerald-300 font-semibold">{topDistrict?.name || "—"}</span> ({topDistrict?.total || 0})
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Core States</span>
              <MapIcon className="h-3 w-3 text-amber-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-white mt-0.5">{stateMetrics.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
              Top: <span className="text-amber-300 font-semibold">{stateMetrics[0]?.state || "—"}</span> ({stateMetrics[0]?.totalStudents || 0})
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Enrolled</span>
              <Users className="h-3 w-3 text-indigo-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-white mt-0.5">{students.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
              Active: <span className="text-indigo-300 font-semibold">{students.filter(s => s.activeStatus.toLowerCase() !== "refunded").length}</span>
              {totalUnfilteredCount && totalUnfilteredCount !== students.length && (
                <span className="text-slate-400 ml-1">({totalUnfilteredCount} total)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => { setSubView("colleges"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subView === "colleges"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Colleges ({totalCollegesCount})</span>
          </button>

          <button
            onClick={() => { setSubView("districts"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subView === "districts"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Districts ({totalDistrictsCount})</span>
          </button>

          <button
            onClick={() => { setSubView("states"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subView === "states"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>State Breakdown ({stateMetrics.length})</span>
          </button>

          <button
            onClick={() => { setSubView("grad_year"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subView === "grad_year"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Graduation Year ({gradYearMetrics.length})</span>
          </button>

          <button
            onClick={() => { setSubView("degree_branch"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subView === "degree_branch"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Degree & Branch ({degreeMetrics.length})</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {subView !== "states" && (
            <>
              <div className="relative min-w-[220px]">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${subView}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                <span className="text-[11px] text-slate-400 font-medium">Sort:</span>
                <button
                  onClick={() => setSortBy("total")}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${sortBy === "total" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Total
                </button>
                <button
                  onClick={() => setSortBy("active")}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${sortBy === "active" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Active
                </button>
                <button
                  onClick={() => setSortBy("placed")}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${sortBy === "placed" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Placed
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* VIEW 1: COLLEGES LEADERBOARD */}
      {subView === "colleges" && (
        <div className="space-y-6">
          {/* Top 10 Chart Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-indigo-600" />
                  Top 10 Feeder Colleges (Enrollment Volume)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-normal">Institutions with the highest student enrollment representation</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10CollegesData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.6} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} width={140} />
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} students`, name]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#fff", borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="Active" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Refunded" stackId="a" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full College Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  All Institutional Partners & Colleges ({filteredColleges.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-normal">Click "Inspect Students" on any college to view their enrolled profiles in the registry.</p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50/80 sticky top-0 z-10 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">College / University Name</th>
                    <th className="py-3.5 px-4">State</th>
                    <th className="py-3.5 px-4 text-center">Total</th>
                    <th className="py-3.5 px-4 text-center">Active</th>
                    <th className="py-3.5 px-4 text-center">Refunded</th>
                    <th className="py-3.5 px-4 text-center">Placed</th>
                    <th className="py-3.5 px-4">Top Track</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-normal">
                  {filteredColleges.length > 0 ? (
                    filteredColleges.map((c, idx) => (
                      <tr key={c.name} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900 max-w-md">
                          <div className="truncate" title={c.name}>{c.name}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {c.state !== "—" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                              {c.state}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-3 px-4 text-center font-extrabold text-indigo-600 text-sm font-mono">{c.total}</td>
                        <td className="py-3 px-4 text-center font-semibold text-emerald-700 font-mono">{c.active}</td>
                        <td className="py-3 px-4 text-center font-semibold text-rose-600 font-mono">{c.refunded > 0 ? c.refunded : "—"}</td>
                        <td className="py-3 px-4 text-center font-semibold text-indigo-600 font-mono">
                          {c.placed > 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                              <Award className="h-3 w-3" />
                              {c.placed}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{c.topTrack}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onSelectCollege?.(c.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg cursor-pointer transition"
                            title={`Filter registry by ${c.name}`}
                          >
                            <span>Inspect</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                        {searchQuery ? `No colleges found matching "${searchQuery}".` : "No colleges found matching current filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DISTRICTS / TERRITORIES */}
      {subView === "districts" && (
        <div className="space-y-6">
          {/* Top 10 Chart Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Top 10 Districts by Student Density
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-normal">Key regional hubs with the strongest market penetration</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10DistrictsData} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: "#475569" }} height={40} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} students`, name]}
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#fff", borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="Active" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Refunded" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full District Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  District Outreach Registry ({filteredDistricts.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-normal">Click "Inspect Students" on any district to view its students in the master registry.</p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50/80 sticky top-0 z-10 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">District Name</th>
                    <th className="py-3.5 px-4">State</th>
                    <th className="py-3.5 px-4 text-center">Total Students</th>
                    <th className="py-3.5 px-4 text-center">Active</th>
                    <th className="py-3.5 px-4 text-center">Refunded</th>
                    <th className="py-3.5 px-4 text-center">Placed</th>
                    <th className="py-3.5 px-4">Top Feeder College</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-normal">
                  {filteredDistricts.length > 0 ? (
                    filteredDistricts.map((d, idx) => (
                      <tr key={d.name} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {d.name}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {d.state !== "—" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                              {d.state}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-3 px-4 text-center font-extrabold text-emerald-700 text-sm font-mono">{d.total}</td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-700 font-mono">{d.active}</td>
                        <td className="py-3 px-4 text-center font-semibold text-rose-600 font-mono">{d.refunded > 0 ? d.refunded : "—"}</td>
                        <td className="py-3 px-4 text-center font-semibold text-indigo-600 font-mono">
                          {d.placed > 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                              <Award className="h-3 w-3" />
                              {d.placed}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{d.topCollege}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onSelectDistrict?.(d.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg cursor-pointer transition"
                            title={`Filter registry by ${d.name}`}
                          >
                            <span>Inspect</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                        {searchQuery ? `No districts found matching "${searchQuery}".` : "No districts found matching current filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: STATE BREAKDOWN WITH GRADUATION YEAR & DEGREE/BRANCH STATS ON THE RIGHT */}
      {subView === "states" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: State Breakdown */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  State Breakdown ({stateMetrics.length} Regional Territories)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {students.length.toLocaleString()} total students
              </span>
            </div>

            {stateMetrics.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 font-medium">
                No states found matching current filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {stateMetrics.map(st => {
                  const pctOfTotal = students.length > 0 ? Math.round((st.totalStudents / students.length) * 100) : 0;
                  return (
                    <div 
                      key={st.state} 
                      className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-sm transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{st.state}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-normal">{pctOfTotal}% of total enrollment base</p>
                        </div>
                        <span className="text-xs font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-mono">
                          {st.totalStudents}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                        <div className="bg-slate-50/70 p-2 rounded-lg">
                          <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Active</span>
                          <span className="font-bold text-slate-800 text-xs font-mono">{st.activeCount}</span>
                        </div>
                        <div className="bg-emerald-50/60 p-2 rounded-lg">
                          <span className="text-emerald-600 block text-[10px] font-medium uppercase tracking-wider">Placed</span>
                          <span className="font-bold text-emerald-700 text-xs font-mono">{st.placedCount}</span>
                        </div>
                        <div className="bg-slate-50/70 p-2 rounded-lg">
                          <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Districts</span>
                          <span className="font-bold text-slate-800 text-xs font-mono">{st.districtsCount}</span>
                        </div>
                        <div className="bg-slate-50/70 p-2 rounded-lg">
                          <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Colleges</span>
                          <span className="font-bold text-slate-800 text-xs font-mono">{st.collegesCount}</span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Top District:</span>
                        <span className="font-bold text-slate-700 truncate max-w-[140px]">{st.topDistrict}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Graduation Year Stats & Degree/Branch Stats */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Panel 1: Graduation Year Stats */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Graduation Year Stats
                    </h3>
                    <p className="text-[10px] text-slate-400">Passing cohorts & placement track</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={exportGradYearsCSV}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-lg transition cursor-pointer"
                  title="Export Graduation Year CSV"
                >
                  <Download className="h-3 w-3" />
                  <span>CSV</span>
                </button>
              </div>

              {gradYearMetrics.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs font-medium">
                  No graduation records available.
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {/* Top Highlight Summary */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cohorts</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">{gradYearMetrics.length}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Top Cohort</span>
                      <span className="text-xs font-bold text-indigo-600 truncate block">
                        {gradYearMetrics[0]?.year || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Placed</span>
                      <span className="text-xs font-bold text-emerald-600 font-mono">
                        {gradYearMetrics.reduce((acc, y) => acc + y.placed, 0)}
                      </span>
                    </div>
                  </div>

                  {/* List of Graduation Passing Years */}
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {gradYearMetrics.map((yr) => {
                      const pctOfTotal = students.length > 0 ? Math.round((yr.total / students.length) * 100) : 0;
                      return (
                        <div 
                          key={yr.year}
                          className="p-3 rounded-xl bg-white border border-slate-100 hover:border-slate-300 transition-all shadow-3xs"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-extrabold font-mono border border-indigo-100">
                                {yr.year}
                              </span>
                              <span className="text-xs font-bold text-slate-800">
                                {yr.total} <span className="text-[11px] font-normal text-slate-400">({pctOfTotal}%)</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {yr.placed > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Award className="h-2.5 w-2.5" />
                                  {yr.placed}
                                </span>
                              )}
                              <span className="text-[10px] font-semibold text-slate-500">
                                {yr.activeRate}% Active
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                            <div 
                              className="bg-indigo-600 h-full rounded-full transition-all" 
                              style={{ width: `${Math.min(100, yr.activeRate)}%` }}
                              title={`Active: ${yr.active}`}
                            />
                            {yr.refunded > 0 && (
                              <div 
                                className="bg-rose-400 h-full rounded-full transition-all" 
                                style={{ width: `${Math.min(100 - yr.activeRate, Math.round((yr.refunded / yr.total) * 100))}%` }}
                                title={`Refunded: ${yr.refunded}`}
                              />
                            )}
                          </div>

                          {/* Top Degree / Stream preview */}
                          {(yr.topDegree !== "—" || yr.topBranch !== "—") && (
                            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                              <span className="truncate max-w-[150px]">
                                Deg: <strong className="text-slate-600">{yr.topDegree}</strong>
                              </span>
                              <span className="truncate max-w-[150px]">
                                Stream: <strong className="text-slate-600">{yr.topBranch}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Panel 2: Degree & Branch Stats */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Degree & Branch Stats
                    </h3>
                    <p className="text-[10px] text-slate-400">Academic programs & stream distribution</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={exportDegreesBranchesCSV}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-1 rounded-lg transition cursor-pointer"
                  title="Export Degrees & Branches CSV"
                >
                  <Download className="h-3 w-3" />
                  <span>CSV</span>
                </button>
              </div>

              {/* Toggle Sub-Tabs between Degrees and Branches */}
              <div className="mt-3 flex items-center p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAcademicRightTab("degrees")}
                  className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    academicRightTab === "degrees"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Top Degrees ({degreeMetrics.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAcademicRightTab("branches")}
                  className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    academicRightTab === "branches"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Streams & Branches ({branchMetrics.length})
                </button>
              </div>

              {/* Degrees Tab Content */}
              {academicRightTab === "degrees" && (
                <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {degreeMetrics.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">No degree records available.</div>
                  ) : (
                    degreeMetrics.map((deg) => {
                      const pct = students.length > 0 ? Math.round((deg.total / students.length) * 100) : 0;
                      return (
                        <div 
                          key={deg.degree}
                          className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-emerald-200 transition-all text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-800 truncate max-w-[180px]" title={deg.degree}>
                              {deg.degree}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 font-mono">{deg.total}</span>
                              <span className="text-[10px] text-slate-400">({pct}%)</span>
                              {deg.placed > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {deg.placed} Placed
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-600 h-full rounded-full" 
                              style={{ width: `${Math.min(100, Math.max(3, pct))}%` }} 
                            />
                          </div>

                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Active: <strong className="text-slate-600">{deg.active}</strong> ({deg.activeRate}%)</span>
                            {deg.topBranch !== "—" && (
                              <span className="truncate max-w-[150px]">Top: <strong className="text-slate-600">{deg.topBranch}</strong></span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Branches Tab Content */}
              {academicRightTab === "branches" && (
                <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {branchMetrics.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">No branch records available.</div>
                  ) : (
                    branchMetrics.map((br) => {
                      const pct = students.length > 0 ? Math.round((br.total / students.length) * 100) : 0;
                      return (
                        <div 
                          key={br.branch}
                          className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-indigo-200 transition-all text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-800 truncate max-w-[180px]" title={br.branch}>
                              {br.branch}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 font-mono">{br.total}</span>
                              <span className="text-[10px] text-slate-400">({pct}%)</span>
                              {br.placed > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {br.placed} Placed
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full rounded-full" 
                              style={{ width: `${Math.min(100, Math.max(3, pct))}%` }} 
                            />
                          </div>

                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Active: <strong className="text-slate-600">{br.active}</strong> ({br.activeRate}%)</span>
                            {br.topDegree !== "—" && (
                              <span className="truncate max-w-[150px]">Top: <strong className="text-slate-600">{br.topDegree}</strong></span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* VIEW 4: EXPANDED GRADUATION YEAR FULL TAB */}
      {subView === "grad_year" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                  Graduation Cohort Volume Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-normal">
                  Passing cohort student count, active learner progression, and placement success
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={gradYearMetrics.map(y => ({
                    year: y.year,
                    Active: y.active,
                    Refunded: y.refunded,
                    Placed: y.placed,
                  }))} 
                  margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#475569" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} students`, name]}
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#fff", borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="Active" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Refunded" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Graduation Year Registry ({gradYearMetrics.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-normal">Complete breakdown of passing year cohorts</p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50/80 sticky top-0 z-10 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Graduation Passing Year</th>
                    <th className="py-3.5 px-4 text-center">Total Students</th>
                    <th className="py-3.5 px-4 text-center">Active Learners</th>
                    <th className="py-3.5 px-4 text-center">Active Rate</th>
                    <th className="py-3.5 px-4 text-center">Refunded</th>
                    <th className="py-3.5 px-4 text-center">Placed</th>
                    <th className="py-3.5 px-4">Primary Degree</th>
                    <th className="py-3.5 px-4">Top Engineering Stream</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-normal">
                  {gradYearMetrics.map((y, idx) => (
                    <tr key={y.year} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono text-sm">{y.year}</td>
                      <td className="py-3 px-4 text-center font-extrabold text-indigo-600 text-sm font-mono">{y.total}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-800 font-mono">{y.active}</td>
                      <td className="py-3 px-4 text-center font-semibold text-emerald-700 font-mono">{y.activeRate}%</td>
                      <td className="py-3 px-4 text-center font-semibold text-rose-600 font-mono">{y.refunded > 0 ? y.refunded : "—"}</td>
                      <td className="py-3 px-4 text-center font-semibold text-indigo-600 font-mono">
                        {y.placed > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                            <Award className="h-3 w-3" />
                            {y.placed}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{y.topDegree}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{y.topBranch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: EXPANDED DEGREE & BRANCH FULL TAB */}
      {subView === "degree_branch" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Degree Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                    Top Degrees ({degreeMetrics.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-normal">Degree qualifications of enrolled students</p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50/80 sticky top-0 z-10 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Degree</th>
                      <th className="py-2.5 px-3 text-center">Total</th>
                      <th className="py-2.5 px-3 text-center">Active</th>
                      <th className="py-2.5 px-3 text-center">Placed</th>
                      <th className="py-2.5 px-3">Top Branch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {degreeMetrics.map((d) => (
                      <tr key={d.degree} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{d.degree}</td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-emerald-700 font-mono">{d.total}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-700 font-mono">{d.active}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-indigo-600 font-mono">{d.placed || "—"}</td>
                        <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{d.topBranch}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Branch Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    Top Streams & Branches ({branchMetrics.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-normal">Engineering & graduation streams</p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50/80 sticky top-0 z-10 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Stream / Branch</th>
                      <th className="py-2.5 px-3 text-center">Total</th>
                      <th className="py-2.5 px-3 text-center">Active</th>
                      <th className="py-2.5 px-3 text-center">Placed</th>
                      <th className="py-2.5 px-3">Top Degree</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {branchMetrics.map((b) => (
                      <tr key={b.branch} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{b.branch}</td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-indigo-600 font-mono">{b.total}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-700 font-mono">{b.active}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-emerald-600 font-mono">{b.placed || "—"}</td>
                        <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{b.topDegree}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
