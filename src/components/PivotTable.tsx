import React, { useState, useMemo } from "react";
import { Student } from "../types";
import { Table, LayoutGrid, CheckCircle } from "lucide-react";

interface PivotTableProps {
  students: Student[];
}

export function PivotTable({ students }: PivotTableProps) {
  const [rowDim, setRowDim] = useState<string>("batchDetails");
  const [colDim, setColDim] = useState<string>("activeStatus");
  const [metric, setMetric] = useState<string>("count");

  // Dynamically compute valid batches based on the active student dataset
  const dynamicBatches = useMemo(() => {
    const batchesSet = new Set<string>();
    students.forEach(s => {
      if (s.batchDetails) {
        const b = s.batchDetails.trim().toUpperCase();
        if (b) {
          batchesSet.add(b);
        }
      }
    });

    return Array.from(batchesSet).sort((a, b) => {
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

  // Options for Dimensions
  const dimensionOptions = [
    { label: "Batch Details", value: "batchDetails" },
    { label: "Active Status", value: "activeStatus" },
    { label: "Centre Name", value: "centreName" },
    { label: "Preferred Job Track", value: "preferredJobTrack" },
    { label: "Gender", value: "gender" },
    { label: "State", value: "state" },
    { label: "Highest Qualification", value: "highestQualification" },
  ];

  const metricOptions = [
    { label: "Count of Students", value: "count" },
    { label: "Average Graduation CGPA", value: "avgCgpa" },
    { label: "Placed Students Count", value: "placedCount" },
  ];

  // Helper to extract nested dimensions safely
  const getFieldValue = (student: Student, field: string): string => {
    const val = (student as any)[field];
    if (!val) return "(Blank)";

    if (field === "batchDetails") {
      const stringVal = String(val).trim();
      const upperVal = stringVal.toUpperCase();
      const found = dynamicBatches.find(b => upperVal === b || upperVal.includes(` ${b}`) || upperVal.includes(`-${b}`) || upperVal.startsWith(`${b} `));
      if (found) return found;

      const match = stringVal.match(/(?:Batch\s*-?\s*|B\s*-?\s*)(\d+)/i);
      let num: number | null = null;
      if (match) {
        num = parseInt(match[1], 10);
      } else {
        const fallback = stringVal.match(/\d+/);
        if (fallback) {
          num = parseInt(fallback[0], 10);
        }
      }

      if (num !== null && num >= 1 && num <= dynamicBatches.length) {
        return dynamicBatches[num - 1];
      }
      return stringVal;
    }

    return String(val).trim();
  };

  // Compute Pivot Grid (excluding "Changed Program" as requested)
  const pivotData = useMemo(() => {
    // Filter out Changed Program records
    const validStudents = students.filter(s => {
      const status = (s.activeStatus || "").trim().toLowerCase();
      return status !== "changed program";
    });

    // Unique row titles
    const rowSet = new Set<string>();
    // Unique col titles
    const colSet = new Set<string>();

    validStudents.forEach(s => {
      const r = getFieldValue(s, rowDim);
      const c = getFieldValue(s, colDim);
      if (r !== "Changed Program") rowSet.add(r);
      if (c !== "Changed Program") colSet.add(c);
    });

    const getBatchIndex = (name: string): number => {
      const cleanName = name.trim().toUpperCase();
      const idx = dynamicBatches.indexOf(cleanName);
      if (idx !== -1) return idx;
      
      const foundIdx = dynamicBatches.findIndex(b => cleanName.includes(b));
      if (foundIdx !== -1) return foundIdx;

      const match = cleanName.match(/(?:Batch\s*-?\s*|B\s*-?\s*)(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= 1 && num <= dynamicBatches.length) return num - 1;
      }
      const fallback = cleanName.match(/\d+/);
      if (fallback) {
        const num = parseInt(fallback[0], 10);
        if (num >= 1 && num <= dynamicBatches.length) return num - 1;
      }
      return 999;
    };

    const sortingFn = (a: string, b: string) => {
      const idxA = getBatchIndex(a);
      const idxB = getBatchIndex(b);
      if (idxA !== 999 || idxB !== 999) {
        return idxA - idxB;
      }
      return a.localeCompare(b);
    };

    const rows = Array.from(rowSet).sort(sortingFn);
    const cols = Array.from(colSet).sort(sortingFn);

    // Pivot cell matrix: row -> col -> array of students
    const matrix: Record<string, Record<string, Student[]>> = {};

    rows.forEach(r => {
      matrix[r] = {};
      cols.forEach(c => {
        matrix[r][c] = [];
      });
    });

    validStudents.forEach(s => {
      const r = getFieldValue(s, rowDim);
      const c = getFieldValue(s, colDim);
      if (matrix[r] && matrix[r][c]) {
        matrix[r][c].push(s);
      }
    });

    // Calculate aggregated cell values
    const grid: Record<string, Record<string, number | string>> = {};
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    let grandTotal = 0;

    // For average CGPA custom totals
    const rowCgpaSum: Record<string, { sum: number; count: number }> = {};
    const colCgpaSum: Record<string, { sum: number; count: number }> = {};
    let grandCgpaSum = 0;
    let grandCgpaCount = 0;

    rows.forEach(r => {
      grid[r] = {};
      rowTotals[r] = 0;
      rowCgpaSum[r] = { sum: 0, count: 0 };

      cols.forEach(c => {
        const cellStudents = matrix[r][c] || [];
        if (!colTotals[c]) colTotals[c] = 0;
        if (!colCgpaSum[c]) colCgpaSum[c] = { sum: 0, count: 0 };

        let cellVal = 0;

        if (metric === "count") {
          cellVal = cellStudents.length;
          rowTotals[r] += cellVal;
          colTotals[c] += cellVal;
          grandTotal += cellVal;
        } else if (metric === "placedCount") {
          cellVal = cellStudents.filter(s => s.placedOrganisation || s.externalPlacedOrganisation).length;
          rowTotals[r] += cellVal;
          colTotals[c] += cellVal;
          grandTotal += cellVal;
        } else if (metric === "avgCgpa") {
          // Parse CGPAs
          let sum = 0;
          let cnt = 0;
          cellStudents.forEach(s => {
            const cgpa = parseFloat(s.graduationCgpa);
            if (!isNaN(cgpa) && cgpa > 0) {
              // Handle cases where CGPA is already percentage (e.g. 78.5) vs scaled to 10 (e.g. 8.5)
              let normalizedCgpa = cgpa;
              if (cgpa > 10) normalizedCgpa = cgpa / 10; // Normalize percentage to 10-scale for clean averages
              sum += normalizedCgpa;
              cnt++;
            }
          });
          cellVal = cnt > 0 ? parseFloat((sum / cnt).toFixed(2)) : 0;

          // Accrue sums for correct hierarchical averages
          rowCgpaSum[r].sum += sum;
          rowCgpaSum[r].count += cnt;
          colCgpaSum[c].sum += sum;
          colCgpaSum[c].count += cnt;
          grandCgpaSum += sum;
          grandCgpaCount += cnt;
        }

        grid[r][c] = cellVal;
      });
    });

    return {
      rows,
      cols,
      grid,
      rowTotals,
      colTotals,
      grandTotal,
      rowCgpaSum,
      colCgpaSum,
      grandCgpaSum,
      grandCgpaCount,
    };
  }, [students, rowDim, colDim, metric]);

  const dimensionName = (val: string) => {
    return dimensionOptions.find(o => o.value === val)?.label || val;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Table className="h-5 w-5 text-blue-600" />
            Configurable Pivot Table
          </h3>
          <p className="text-xs text-slate-400">Dynamically slice student facts by custom rows and columns</p>
        </div>

        {/* Dynamic selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Rows (Y-Axis)</label>
            <select
              value={rowDim}
              onChange={(e) => setRowDim(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {dimensionOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Columns (X-Axis)</label>
            <select
              value={colDim}
              onChange={(e) => setColDim(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {dimensionOptions.filter(d => d.value !== rowDim).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cell Value Fact</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {metricOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-200">
              <th className="py-3 px-4 font-bold text-slate-700 border-r border-slate-200">
                {dimensionName(rowDim)}
              </th>
              {pivotData.cols.map(c => (
                <th key={c} className="py-3 px-4 text-center font-bold text-slate-600">
                  {c}
                </th>
              ))}
              <th className="py-3 px-4 text-center font-bold bg-blue-50/40 text-blue-700 border-l border-slate-200">
                Grand Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pivotData.rows.map(r => (
              <tr key={r} className="hover:bg-slate-50/40 transition-colors">
                <td className="py-3 px-4 font-semibold text-slate-850 border-r border-slate-200 bg-slate-50/20">
                  {r}
                </td>
                {pivotData.cols.map(c => {
                  const val = pivotData.grid[r][c];
                  return (
                    <td key={c} className="py-3 px-4 text-center font-medium text-slate-600">
                      {metric === "avgCgpa" ? (val === 0 ? "—" : `${val} /10`) : val}
                    </td>
                  );
                })}
                {/* Row totals */}
                <td className="py-3 px-4 text-center font-bold bg-blue-50/10 text-slate-900 border-l border-slate-200">
                  {metric === "avgCgpa" ? (
                    pivotData.rowCgpaSum[r].count > 0 ? (
                      `${(pivotData.rowCgpaSum[r].sum / pivotData.rowCgpaSum[r].count).toFixed(2)} /10`
                    ) : "—"
                  ) : (
                    pivotData.rowTotals[r]
                  )}
                </td>
              </tr>
            ))}

            {/* Column totals */}
            <tr className="bg-slate-50/50 font-semibold text-slate-800 border-t border-slate-200">
              <td className="py-3.5 px-4 text-slate-700 border-r border-slate-200">Grand Total</td>
              {pivotData.cols.map(c => (
                <td key={c} className="py-3.5 px-4 text-center">
                  {metric === "avgCgpa" ? (
                    pivotData.colCgpaSum[c].count > 0 ? (
                      `${(pivotData.colCgpaSum[c].sum / pivotData.colCgpaSum[c].count).toFixed(2)} /10`
                    ) : "—"
                  ) : (
                    pivotData.colTotals[c] || 0
                  )}
                </td>
              ))}
              {/* Grand grand total */}
              <td className="py-3.5 px-4 text-center bg-blue-55/20 text-blue-700 font-extrabold border-l border-slate-200">
                {metric === "avgCgpa" ? (
                  pivotData.grandCgpaCount > 0 ? (
                    `${(pivotData.grandCgpaSum / pivotData.grandCgpaCount).toFixed(2)} /10`
                  ) : "—"
                ) : (
                  pivotData.grandTotal
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
