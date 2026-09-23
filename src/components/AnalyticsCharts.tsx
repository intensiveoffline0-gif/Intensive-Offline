import React, { useMemo } from "react";
import { Student } from "../types";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList
} from "recharts";
import { BarChart3 } from "lucide-react";

interface AnalyticsChartsProps {
  students: Student[];
  isAdmin?: boolean;
}

export function AnalyticsCharts({ students, isAdmin = false }: AnalyticsChartsProps) {
  
  // Batch Details distribution (dynamically computed)
  const batchData = useMemo(() => {
    const batchesSet = new Set<string>();
    students.forEach(s => {
      if (s.batchDetails) {
        const b = s.batchDetails.trim().toUpperCase();
        if (b) {
          batchesSet.add(b);
        }
      }
    });

    const dynamicBatches = Array.from(batchesSet).sort((a, b) => {
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

    const activeCounts: Record<string, number> = {};
    const refundCounts: Record<string, number> = {};
    
    dynamicBatches.forEach(b => {
      activeCounts[b] = 0;
      refundCounts[b] = 0;
    });

    students.forEach(s => {
      const b = (s.batchDetails || "").trim().toUpperCase();
      if (b && dynamicBatches.includes(b)) {
        const isRefunded = s.activeStatus?.toLowerCase() === "refunded";
        if (isRefunded) {
          refundCounts[b] = (refundCounts[b] || 0) + 1;
        } else {
          activeCounts[b] = (activeCounts[b] || 0) + 1;
        }
      }
    });

    return dynamicBatches.map(b => {
      const active = activeCounts[b] || 0;
      const refunds = refundCounts[b] || 0;
      return {
        name: b,
        active,
        refunds,
        count: isAdmin ? (active + refunds) : active
      };
    });
  }, [students, isAdmin]);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          Batch Counts
        </h4>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {isAdmin 
            ? "Student intake distribution mapped horizontally showing active and refunded counts sorted by batch name" 
            : "Student intake distribution mapped horizontally showing active learner count sorted by batch name"
          }
        </p>
      </div>
      <div className="h-80">
        {batchData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={batchData} 
              margin={{ top: 25, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: "#475569", fontWeight: "bold" }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fontSize: 10, fill: "#64748b" }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "11px" }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }} />
              <Bar 
                dataKey="active" 
                name="Active Learners" 
                fill="#2563eb" 
                stackId="a" 
                barSize={20}
              >
                {!isAdmin && (
                  <LabelList 
                    dataKey="count" 
                    position="top" 
                    offset={8} 
                    style={{ fill: "#475569", fontSize: 10, fontWeight: "bold" }} 
                  />
                )}
              </Bar>
              {isAdmin && (
                <Bar 
                  dataKey="refunds" 
                  name="Refunded" 
                  fill="#ef4444" 
                  stackId="a" 
                  radius={[4, 4, 0, 0]} 
                  barSize={20}
                >
                  <LabelList 
                    dataKey="count" 
                    position="top" 
                    offset={8} 
                    style={{ fill: "#475569", fontSize: 10, fontWeight: "bold" }} 
                  />
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">No data present</div>
        )}
      </div>
    </div>
  );
}

