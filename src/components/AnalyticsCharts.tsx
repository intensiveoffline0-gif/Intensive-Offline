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

const CustomBarWithRefundIndicator = (props: any) => {
  const { x, y, width, height, payload } = props;
  const hasRefunds = (payload?.refunded || 0) > 0;
  const radius = 4;

  // Handle case where batch has 0 active but has refunds (e.g. N2 with 2 refunds)
  if ((!height || height <= 0) && hasRefunds) {
    const minH = 6;
    return (
      <rect
        x={x}
        y={y - minH}
        width={width}
        height={minH}
        rx={radius}
        ry={radius}
        fill="#ef4444"
      />
    );
  }

  if (!height || height <= 0) return null;

  if (!hasRefunds) {
    // Pure active batch (No refunds) - Solid blue bar with rounded top
    return (
      <path
        d={`M${x},${y + height} 
            L${x},${y + radius} 
            Q${x},${y} ${x + radius},${y} 
            L${x + width - radius},${y} 
            Q${x + width},${y} ${x + width},${y + radius} 
            L${x + width},${y + height} Z`}
        fill="#2563eb"
      />
    );
  }

  // Has refunds: Show red color in the bar!
  // Top cap is vibrant red (#ef4444) showing refunded students, body is blue (#2563eb)
  const capHeight = Math.max(6, Math.min(14, Math.round(height * 0.15)));
  const blueHeight = Math.max(0, height - capHeight);
  const capY = y;
  const blueY = y + capHeight;

  return (
    <g>
      {/* Blue body for active students */}
      {blueHeight > 0 && (
        <rect
          x={x}
          y={blueY}
          width={width}
          height={blueHeight}
          fill="#2563eb"
        />
      )}
      {/* Red top cap showing refunded students in the batch */}
      <path
        d={`M${x},${blueY} 
            L${x},${capY + radius} 
            Q${x},${capY} ${x + radius},${capY} 
            L${x + width - radius},${capY} 
            Q${x + width},${capY} ${x + width},${capY + radius} 
            L${x + width},${blueY} Z`}
        fill="#ef4444"
      />
    </g>
  );
};

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
      const refunded = refundCounts[b] || 0;
      return {
        name: b,
        active,
        refunded,
        total: active + refunded,
        count: active
      };
    });
  }, [students]);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            Batch Counts
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Active student count on top of each bar. Red cap indicates batch has refunded students.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-blue-600 inline-block"></span>
            Active Only
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-rose-500 inline-block"></span>
            Has Refunded Students
          </span>
        </div>
      </div>
      <div className="h-80">
        {batchData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={batchData} 
              margin={{ top: 28, right: 10, left: -20, bottom: 5 }}
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
                cursor={{ fill: "rgba(59, 130, 246, 0.06)" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-lg border border-slate-700/80 shadow-2xl text-xs space-y-1.5 min-w-[145px]">
                        <div className="font-bold text-slate-200 border-b border-slate-700/80 pb-1 flex items-center justify-between">
                          <span className="text-blue-400 font-semibold">Batch {data.name}</span>
                          <span className="text-[10px] font-medium text-slate-400">Total: {data.total}</span>
                        </div>
                        <div className="space-y-1 pt-0.5 text-[11px]">
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block"></span>
                              Active:
                            </span>
                            <span className="font-bold text-white font-mono">{data.active}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span className="h-2 w-2 rounded-full bg-rose-500 inline-block"></span>
                              Refunded:
                            </span>
                            <span className="font-bold text-rose-400 font-mono">{data.refunded}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="active" 
                name="Active Learners" 
                shape={<CustomBarWithRefundIndicator />}
                barSize={22}
              >
                <LabelList 
                  dataKey="active" 
                  position="top" 
                  offset={6} 
                  style={{ fill: "#1e293b", fontSize: 10, fontWeight: "700" }} 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">No data present</div>
        )}
      </div>
    </div>
  );
}

