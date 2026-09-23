import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

interface SearchableDropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  counts?: Record<string, number>;
  totalCount: number;
  placeholder?: string;
  className?: string;
  emptyLabel?: string;
  optionFormatter?: (opt: string) => string;
  allowAll?: boolean;
}

export function SearchableDropdown({
  label,
  options,
  value,
  onChange,
  counts,
  totalCount,
  placeholder = "-Select-",
  className = "",
  emptyLabel = "No options found",
  optionFormatter,
  allowAll = true
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Reset search query when dropdown opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return options;
    return options.filter(opt => {
      const rawMatch = opt.toLowerCase().includes(query);
      const formattedMatch = optionFormatter ? optionFormatter(opt).toLowerCase().includes(query) : false;
      return rawMatch || formattedMatch;
    });
  }, [options, searchQuery, optionFormatter]);

  const displayedLabel = useMemo(() => {
    if (value === "All" || !value) {
      return placeholder;
    }
    return optionFormatter ? optionFormatter(value) : value;
  }, [value, placeholder, optionFormatter]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full min-w-[180px] md:max-w-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer text-left gap-2"
        id={`dropdown-${label.replace(/\s+/g, "-").toLowerCase()}`}
      >
        <span className="truncate" title={displayedLabel}>
          {displayedLabel}
        </span>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg z-[100] flex flex-col overflow-hidden max-h-72">
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <input
                type="text"
                placeholder={`Search ${label}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg text-xs placeholder-slate-400 dark:placeholder-slate-550 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100"
                autoFocus
              />
              <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-50 dark:divide-slate-850 max-h-48 text-xs">
            {/* Reset / All Option */}
            {allowAll && searchQuery === "" && (
              <button
                type="button"
                onClick={() => {
                  onChange("All");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/30 flex justify-between items-center ${
                  value === "All" || !value
                    ? "bg-blue-50/50 dark:bg-blue-950/20 font-bold text-blue-600 dark:text-blue-400"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                <span className="truncate">-Select- (All)</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2">
                  ({totalCount})
                </span>
              </button>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = value === opt;
                const count = counts ? counts[opt] : undefined;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/30 flex justify-between items-center ${
                      isSelected
                        ? "bg-blue-50/50 dark:bg-blue-950/20 font-bold text-blue-600 dark:text-blue-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="truncate" title={optionFormatter ? optionFormatter(opt) : opt}>
                      {optionFormatter ? optionFormatter(opt) : opt}
                    </span>
                    {count !== undefined && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2 shrink-0">
                        ({count})
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-slate-400 dark:text-slate-600 font-medium">
                {emptyLabel}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
