import React, { useState, useMemo } from "react";
import { Student } from "../types";
import { 
  Building2, MapPin, Search, Download, ExternalLink, 
  TrendingUp, Users, CheckCircle2, Award, ArrowUpDown, 
  Layers, Map as MapIcon, ArrowRight, BarChart2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import { MultiSelectDropdown } from "./MultiSelectDropdown";

interface CollegeDistrictStatsProps {
  students: Student[];
  onSelectCollege?: (collegeName: string) => void;
  onSelectDistrict?: (districtName: string) => void;
}

type ActiveSubView = "colleges" | "districts" | "states";

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
  onSelectCollege, 
  onSelectDistrict 
}: CollegeDistrictStatsProps) {
  const [subView, setSubView] = useState<ActiveSubView>("colleges");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"total" | "active" | "placed">("total");

  // Distinct states for filter dropdown
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.state && s.state.trim()) {
        set.add(s.state.trim());
      }
    });
    return Array.from(set).sort();
  }, [students]);

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      if (s.state && s.state.trim()) {
        const val = s.state.trim();
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  }, [students]);

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
        const matchesState = selectedStates.length === 0 || selectedStates.some(st => st.toLowerCase() === c.state.toLowerCase());
        return matchesQuery && matchesState;
      })
      .sort((a, b) => {
        if (sortBy === "active") return b.active - a.active;
        if (sortBy === "placed") return b.placed - a.placed;
        return b.total - a.total;
      });
  }, [collegeMetrics, searchQuery, selectedStates, sortBy]);

  // Filtered and Sorted Districts
  const filteredDistricts = useMemo(() => {
    return districtMetrics
      .filter(d => {
        const matchesQuery = 
          d.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          d.state.toLowerCase().includes(searchQuery.toLowerCase().trim());
        const matchesState = selectedStates.length === 0 || selectedStates.some(st => st.toLowerCase() === d.state.toLowerCase());
        return matchesQuery && matchesState;
      })
      .sort((a, b) => {
        if (sortBy === "active") return b.active - a.active;
        if (sortBy === "placed") return b.placed - a.placed;
        return b.total - a.total;
      });
  }, [districtMetrics, searchQuery, selectedStates, sortBy]);

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

  return (
    <div className="space-y-6">
      {/* Top Header & Context Description */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Admissions & Institutional Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              College & District Statistics
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl font-normal">
              Geographic distribution and institutional feeder data across <strong>{students.length.toLocaleString()} students</strong>, identifying top-performing colleges, key district clusters, and outreach opportunities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={subView === "districts" ? exportDistrictsCSV : exportCollegesCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export {subView === "districts" ? "Districts" : "Colleges"} CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Feeder Colleges</span>
              <Building2 className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">{totalCollegesCount}</div>
            <div className="text-xs text-slate-400 mt-1 truncate font-normal">
              #1 Feeder: <span className="text-indigo-300 font-semibold">{topFeederCollege?.name.split(",")[0] || "—"}</span> ({topFeederCollege?.total || 0})
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Districts</span>
              <MapPin className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">{totalDistrictsCount}</div>
            <div className="text-xs text-slate-400 mt-1 truncate font-normal">
              Top Territory: <span className="text-emerald-300 font-semibold">{topDistrict?.name || "—"}</span> ({topDistrict?.total || 0})
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Core States</span>
              <MapIcon className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">{stateMetrics.length}</div>
            <div className="text-xs text-slate-400 mt-1 font-normal">
              Top: <span className="text-amber-300 font-semibold">{stateMetrics[0]?.state || "—"}</span> ({stateMetrics[0]?.totalStudents || 0} enrolled)
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Enrolled</span>
              <Users className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">{students.length}</div>
            <div className="text-xs text-slate-400 mt-1 font-normal">
              Active: <span className="text-indigo-300 font-semibold">{students.filter(s => s.activeStatus.toLowerCase() !== "refunded").length}</span> learners
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => { setSubView("colleges"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subView === "colleges"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Colleges Leaderboard ({totalCollegesCount})</span>
          </button>

          <button
            onClick={() => { setSubView("districts"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subView === "districts"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Districts / Territories ({totalDistrictsCount})</span>
          </button>

          <button
            onClick={() => { setSubView("states"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subView === "states"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>State Breakdown ({stateMetrics.length})</span>
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

              <MultiSelectDropdown
                label="STATE"
                shortLabel="State"
                options={availableStates}
                selected={selectedStates}
                onChange={setSelectedStates}
                counts={stateCounts}
                totalCount={students.length}
              />

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
                        No colleges found matching "{searchQuery}".
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
                        No districts found matching "{searchQuery}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: STATE BREAKDOWN */}
      {subView === "states" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stateMetrics.map(st => {
            const pctOfTotal = Math.round((st.totalStudents / students.length) * 100);
            return (
              <div 
                key={st.state} 
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:border-indigo-300 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{st.state}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-normal">{pctOfTotal}% of total enrollment base</p>
                  </div>
                  <span className="text-xs font-extrabold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
                    {st.totalStudents} Students
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Active Learners</span>
                    <span className="font-bold text-slate-800 text-sm font-mono">{st.activeCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Placements</span>
                    <span className="font-bold text-emerald-700 text-sm font-mono">{st.placedCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Districts Penetrated</span>
                    <span className="font-bold text-slate-800 font-mono">{st.districtsCount} Districts</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Colleges Reached</span>
                    <span className="font-bold text-slate-800 font-mono">{st.collegesCount} Colleges</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Top District:</span>
                  <span className="font-bold text-slate-700">{st.topDistrict}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
