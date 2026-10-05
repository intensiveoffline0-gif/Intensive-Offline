import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, Check, X } from "lucide-react";

export interface MultiSelectDropdownProps {
  label: string;
  shortLabel?: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  counts?: Record<string, number>;
  totalCount: number;
  placeholder?: string;
  className?: string;
  optionFormatter?: (opt: string) => string;
}

export function MultiSelectDropdown({
  label,
  shortLabel,
  options,
  selected,
  onChange,
  counts,
  totalCount,
  placeholder,
  className = "",
  optionFormatter,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const displayShortLabel = shortLabel || label;

  // Close dropdown when clicking outside
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

  // Reset search when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return options;
    return options.filter((opt) => {
      const rawMatch = opt.toLowerCase().includes(q);
      const formattedMatch = optionFormatter ? optionFormatter(opt).toLowerCase().includes(q) : false;
      return rawMatch || formattedMatch;
    });
  }, [options, searchQuery, optionFormatter]);

  // Determine button trigger text
  const isAllSelected = selected.length === 0 || selected.length === options.length;
  
  const triggerText = useMemo(() => {
    if (isAllSelected) {
      return `${displayShortLabel}: All (${totalCount})`;
    }
    if (selected.length === 1) {
      const formatted = optionFormatter ? optionFormatter(selected[0]) : selected[0];
      const count = counts ? counts[selected[0]] : undefined;
      return `${displayShortLabel}: ${formatted}${count !== undefined ? ` (${count})` : ""}`;
    }
    return `${displayShortLabel}: ${selected.length} Selected`;
  }, [isAllSelected, displayShortLabel, totalCount, selected, optionFormatter, counts]);

  const toggleOption = (opt: string) => {
    if (isAllSelected) {
      // If currently all selected, clicking an option isolates it
      onChange([opt]);
      return;
    }

    if (selected.includes(opt)) {
      const updated = selected.filter((item) => item !== opt);
      onChange(updated);
    } else {
      const updated = [...selected, opt];
      // If user selected all options individually, normalize to empty array (meaning All)
      if (updated.length === options.length) {
        onChange([]);
      } else {
        onChange(updated);
      }
    }
  };

  const handleSelectAll = () => {
    onChange([]);
  };

  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange([]);
  };

  return (
    <div className={`flex flex-col ${className}`} ref={containerRef}>
      {/* Top Header Label */}
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 truncate">
        {label}
      </span>

      {/* Dropdown Trigger Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full min-w-[150px] max-w-[240px] px-3.5 py-2 rounded-xl text-xs border transition-all cursor-pointer text-left gap-2 shadow-xs ${
            !isAllSelected
              ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
          }`}
          title={triggerText}
        >
          <span className="truncate flex-1">{triggerText}</span>

          <div className="flex items-center gap-1 shrink-0">
            {!isAllSelected && (
              <span
                onClick={handleClearAll}
                className="p-0.5 hover:bg-indigo-200/70 rounded-full text-indigo-600 cursor-pointer"
                title="Clear filter"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            {isOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            )}
          </div>
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute left-0 mt-1.5 w-72 rounded-2xl bg-white border border-slate-200/90 shadow-xl z-[150] flex flex-col overflow-hidden animate-fadeIn">
            {/* Search Input Box */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/70">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search ${label}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 font-medium"
                  autoFocus
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Action Buttons: Select All / Clear All */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/70 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`font-semibold cursor-pointer hover:underline ${
                    isAllSelected
                      ? "text-indigo-600"
                      : "text-slate-600 hover:text-indigo-600"
                  }`}
                >
                  Select All ({options.length})
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[10px]">
                    {isAllSelected ? "All selected" : `${selected.length} selected`}
                  </span>
                  {!isAllSelected && (
                    <button
                      type="button"
                      onClick={() => onChange([])}
                      className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Options List with Checkboxes */}
            <div className="overflow-y-auto max-h-60 divide-y divide-slate-50 text-xs">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isChecked = isAllSelected || selected.includes(opt);
                  const count = counts ? counts[opt] : undefined;
                  const formatted = optionFormatter ? optionFormatter(opt) : opt;

                  return (
                    <div
                      key={opt}
                      onClick={() => toggleOption(opt)}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors select-none ${
                        isChecked && !isAllSelected
                          ? "bg-indigo-50/70 hover:bg-indigo-100/70"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                            isChecked
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span
                          className={`truncate text-xs ${
                            isChecked && !isAllSelected
                              ? "font-semibold text-indigo-950"
                              : "text-slate-700 font-normal"
                          }`}
                          title={formatted}
                        >
                          {formatted}
                        </span>
                      </div>

                      {count !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium ${
                            isChecked && !isAllSelected
                              ? "bg-indigo-100 text-indigo-700 font-semibold"
                              : "bg-slate-100 text-slate-500 font-mono"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No matching options found
                </div>
              )}
            </div>

            {/* Bottom Footer with Done Button */}
            <div className="p-2.5 border-t border-slate-100 bg-slate-50/60 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
