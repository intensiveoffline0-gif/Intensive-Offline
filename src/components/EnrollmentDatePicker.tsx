import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, AlertCircle, X } from "lucide-react";

interface EnrollmentDatePickerProps {
  onApply: (startDate: Date | null, endDate: Date | null) => void;
  startDate: Date | null;
  endDate: Date | null;
  label?: string;
}

const MONTHS_SHORT = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN", 
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

// Helper to format date into readable text (e.g. "Jun 11, 2026")
const formatDateLabel = (d: Date | null): string => {
  if (!d) return "";
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

type QuickPreset = 
  | "today" 
  | "yesterday" 
  | "this_week" 
  | "last_week" 
  | "this_month" 
  | "last_month" 
  | "last_30_days" 
  | "last_90_days"
  | "all_time";

interface PresetConfig {
  key: QuickPreset;
  label: string;
  subLabel: string;
}

const getPresetDates = (preset: QuickPreset): { start: Date | null; end: Date | null } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === "all_time") {
    return { start: null, end: null };
  }
  if (preset === "today") {
    return { start: today, end: today };
  }
  if (preset === "yesterday") {
    const yest = new Date(today);
    yest.setDate(today.getDate() - 1);
    return { start: yest, end: yest };
  }
  if (preset === "this_week") {
    const day = today.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return { start: monday, end: today };
  }
  if (preset === "last_week") {
    const day = today.getDay();
    const diffToThisMonday = (day === 0 ? -6 : 1) - day;
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() + diffToThisMonday);
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    const lastSunday = new Date(thisMonday);
    lastSunday.setDate(thisMonday.getDate() - 1);
    return { start: lastMonday, end: lastSunday };
  }
  if (preset === "this_month") {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: firstDay, end: today };
  }
  if (preset === "last_month") {
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
    return { start: firstDay, end: lastDay };
  }
  if (preset === "last_30_days") {
    const start = new Date(today);
    start.setDate(today.getDate() - 30);
    return { start, end: today };
  }
  if (preset === "last_90_days") {
    const start = new Date(today);
    start.setDate(today.getDate() - 90);
    return { start, end: today };
  }
  return { start: null, end: null };
};

export function EnrollmentDatePicker({ onApply, startDate, endDate, label }: EnrollmentDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selector type "Fixed" vs "Auto date range"
  const [rangeType, setRangeType] = useState<"Fixed" | "Auto date range">("Fixed");

  // Temporary selected dates before Apply is clicked
  const [tempStart, setTempStart] = useState<Date | null>(startDate);
  const [tempEnd, setTempEnd] = useState<Date | null>(endDate);

  // Month and Year view states for both calendars (defaults to current month)
  const [startMonth, setStartMonth] = useState<number>(() => startDate ? startDate.getMonth() : new Date().getMonth());
  const [startYear, setStartYear] = useState<number>(() => startDate ? startDate.getFullYear() : new Date().getFullYear());
  const [endMonth, setEndMonth] = useState<number>(() => endDate ? endDate.getMonth() : new Date().getMonth());
  const [endYear, setEndYear] = useState<number>(() => endDate ? endDate.getFullYear() : new Date().getFullYear());

  // Keep views in sync with actual selected dates when they change
  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
    const now = new Date();
    if (startDate) {
      setStartMonth(startDate.getMonth());
      setStartYear(startDate.getFullYear());
    } else {
      setStartMonth(now.getMonth());
      setStartYear(now.getFullYear());
    }
    if (endDate) {
      setEndMonth(endDate.getMonth());
      setEndYear(endDate.getFullYear());
    } else {
      setEndMonth(now.getMonth());
      setEndYear(now.getFullYear());
    }
  }, [startDate, endDate, isOpen]);

  // Handle click outside to close the picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Determine if End date is earlier than Start date
  const isInvalidRange = tempStart && tempEnd && tempEnd < tempStart;

  // Calendar render helper calculations
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfWeek = (y: number, m: number) => new Date(y, m, 1).getDay();

  const handleStartMonthPrev = () => {
    if (startMonth === 0) {
      setStartMonth(11);
      setStartYear(startYear - 1);
    } else {
      setStartMonth(startMonth - 1);
    }
  };

  const handleStartMonthNext = () => {
    if (startMonth === 11) {
      setStartMonth(0);
      setStartYear(startYear + 1);
    } else {
      setStartMonth(startMonth + 1);
    }
  };

  const handleEndMonthPrev = () => {
    if (endMonth === 0) {
      setEndMonth(11);
      setEndYear(endYear - 1);
    } else {
      setEndMonth(endMonth - 1);
    }
  };

  const handleEndMonthNext = () => {
    if (endMonth === 11) {
      setEndMonth(0);
      setEndYear(endYear + 1);
    } else {
      setEndMonth(endMonth + 1);
    }
  };

  const handleSelectStartDate = (day: number) => {
    const selected = new Date(startYear, startMonth, day);
    setTempStart(selected);
  };

  const handleSelectEndDate = (day: number) => {
    const selected = new Date(endYear, endMonth, day);
    setTempEnd(selected);
  };

  const handleResetToCurrentMonth = () => {
    const now = new Date();
    setStartMonth(now.getMonth());
    setStartYear(now.getFullYear());
    setEndMonth(now.getMonth());
    setEndYear(now.getFullYear());
  };

  const handleSelectPreset = (preset: QuickPreset) => {
    const { start, end } = getPresetDates(preset);
    if (!start || !end) {
      setRangeType("Fixed");
      setTempStart(null);
      setTempEnd(null);
      handleResetToCurrentMonth();
      onApply(null, null);
      return;
    }
    setRangeType("Fixed");
    setTempStart(start);
    setTempEnd(end);
    setStartMonth(start.getMonth());
    setStartYear(start.getFullYear());
    setEndMonth(end.getMonth());
    setEndYear(end.getFullYear());
    // Auto-apply preset for immediate response
    onApply(start, end);
  };

  const isPresetSelected = (preset: QuickPreset) => {
    const { start, end } = getPresetDates(preset);
    if (preset === "all_time") {
      return !tempStart && !tempEnd;
    }
    if (!tempStart || !tempEnd || !start || !end) return false;
    return (
      tempStart.getFullYear() === start.getFullYear() &&
      tempStart.getMonth() === start.getMonth() &&
      tempStart.getDate() === start.getDate() &&
      tempEnd.getFullYear() === end.getFullYear() &&
      tempEnd.getMonth() === end.getMonth() &&
      tempEnd.getDate() === end.getDate()
    );
  };

  const currentSelectionLabel = () => {
    if (startDate && endDate) {
      return `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;
    }
    if (startDate) {
      return `From ${formatDateLabel(startDate)}`;
    }
    if (endDate) {
      return `Until ${formatDateLabel(endDate)}`;
    }
    return "Select date range";
  };

  const handleApply = () => {
    if (isInvalidRange) return;
    if (rangeType === "Auto date range") {
      // Return null to clear and auto select full dataset
      onApply(null, null);
    } else {
      onApply(tempStart, tempEnd);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setIsOpen(false);
  };

  const resetFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApply(null, null);
  };

  const renderCalendarDays = (
    y: number,
    m: number,
    selectedDate: Date | null,
    onSelectDay: (day: number) => void
  ) => {
    const totalDays = getDaysInMonth(y, m);
    const startOffset = getFirstDayOfWeek(y, m);
    const daysArr = [];

    // Empty cells before the start of the month
    for (let i = 0; i < startOffset; i++) {
      daysArr.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    // Days in current month
    for (let day = 1; day <= totalDays; day++) {
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === m && 
        selectedDate.getFullYear() === y;

      // Check if dates fall in between currently selected range (for visual connection styling)
      const thisDate = new Date(y, m, day);
      const isWithinRange = tempStart && tempEnd && thisDate > tempStart && thisDate < tempEnd;

      daysArr.push(
        <button
          key={`day-${day}`}
          type="button"
          onClick={() => onSelectDay(day)}
          className={`h-8 w-8 rounded-full text-xs font-semibold flex items-center justify-center transition-colors focus:outline-hidden cursor-pointer ${
            isSelected 
              ? "bg-indigo-600 text-white shadow-xs" 
              : isWithinRange
                ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          {day}
        </button>
      );
    }

    return daysArr;
  };

  return (
    <div className="flex flex-col relative text-left" ref={containerRef}>
      {label && (
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 truncate">
          {label}
        </span>
      )}
      {/* Trigger Button */}
      <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-indigo-500 overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3.5 py-2 flex items-center gap-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-hidden cursor-pointer"
        >
          <CalendarIcon className="h-4 w-4 text-indigo-600 shrink-0" />
          <span className="truncate max-w-[200px]">{currentSelectionLabel()}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        </button>
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={resetFilter}
            title="Reset date filter"
            className="border-l border-slate-100 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Date Picker Popover */}
      {isOpen && (
        <div className="absolute right-0 md:left-0 mt-2 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-5 w-[600px] max-w-[95vw] md:w-[560px] animate-fadeIn">
          
          {/* Top Options & Quick Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative inline-block w-36 shrink-0">
              <select
                value={rangeType}
                onChange={(e) => {
                  const type = e.target.value as "Fixed" | "Auto date range";
                  setRangeType(type);
                  if (type === "Auto date range") {
                    setTempStart(null);
                    setTempEnd(null);
                  }
                }}
                className="w-full pl-3 pr-8 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
              >
                <option value="Fixed">Fixed</option>
                <option value="Auto date range">Auto date range</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>

            {/* Quick Filter Presets */}
            {rangeType === "Fixed" && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick:</span>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("last_week")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isPresetSelected("last_week")
                      ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  title="Last Week (Previous Monday to Sunday)"
                >
                  Last Week
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("this_week")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isPresetSelected("this_week")
                      ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  title="This Week (Monday to Today)"
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("last_month")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isPresetSelected("last_month")
                      ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  title="Last Month (1st to last day of previous month)"
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("this_month")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isPresetSelected("this_month")
                      ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  title="This Month (1st of this month to Today)"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("last_30_days")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isPresetSelected("last_30_days")
                      ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  title="Last 30 Days"
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("last_90_days")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isPresetSelected("last_90_days")
                      ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  title="Last 90 Days"
                >
                  Last 90 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("all_time")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isPresetSelected("all_time")
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                  title="Clear Date Filter"
                >
                  All Time
                </button>
              </div>
            )}
          </div>

          {/* Invalid range error banner */}
          {isInvalidRange && rangeType === "Fixed" && (
            <div className="mb-4 p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-lg flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-semibold animate-pulse">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>End date is earlier than start date</span>
            </div>
          )}

          {rangeType === "Fixed" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
              
              {/* Start Date Calendar Section */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
                    Start Date
                  </span>
                  {(startMonth !== new Date().getMonth() || startYear !== new Date().getFullYear()) && (
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setStartMonth(now.getMonth());
                        setStartYear(now.getFullYear());
                      }}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded cursor-pointer transition"
                      title="Jump to Current Month"
                    >
                      Current Month
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">
                    {MONTHS_SHORT[startMonth]} {startYear}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleStartMonthPrev}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 focus:outline-hidden cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleStartMonthNext}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 focus:outline-hidden cursor-pointer"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Week day lettering */}
                <div className="grid grid-cols-7 text-center gap-1 text-[10px] font-bold text-slate-400 mb-1 select-none">
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>

                {/* Calendar Days grid */}
                <div className="grid grid-cols-7 gap-1 text-center justify-items-center">
                  {renderCalendarDays(startYear, startMonth, tempStart, handleSelectStartDate)}
                </div>
              </div>

              {/* End Date Calendar Section */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
                    End Date
                  </span>
                  {(endMonth !== new Date().getMonth() || endYear !== new Date().getFullYear()) && (
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setEndMonth(now.getMonth());
                        setEndYear(now.getFullYear());
                      }}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded cursor-pointer transition"
                      title="Jump to Current Month"
                    >
                      Current Month
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white font-sans">
                    {MONTHS_SHORT[endMonth]} {endYear}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleEndMonthPrev}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 focus:outline-hidden cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleEndMonthNext}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 focus:outline-hidden cursor-pointer"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Week day lettering */}
                <div className="grid grid-cols-7 text-center gap-1 text-[10px] font-bold text-slate-400 mb-1 select-none">
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>

                {/* Calendar Days grid */}
                <div className="grid grid-cols-7 gap-1 text-center justify-items-center">
                  {renderCalendarDays(endYear, endMonth, tempEnd, handleSelectEndDate)}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-6 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-800 mb-2">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                Will analyze all enrolled student records spanning from the first cohort onwards.
              </p>
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-hidden cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isInvalidRange && rangeType === "Fixed"}
              className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer ${
                isInvalidRange && rangeType === "Fixed"
                  ? "bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              Apply
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
