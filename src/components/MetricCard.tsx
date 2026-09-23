import React, { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function MetricCard({ title, value, icon, subtitle, trend }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</span>
        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend.isPositive ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400"
          }`}>
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>}
    </div>
  );
}
