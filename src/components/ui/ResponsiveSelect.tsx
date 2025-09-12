"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface SelectOption {
  value: string;
  label: string;
}

interface ResponsiveSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  searchable?: boolean;
}

export function ResponsiveSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Select...",
  error,
  searchable = false,
}: ResponsiveSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(
    options.find((opt) => opt.value === value) || null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedOption(options.find((opt) => opt.value === value) || null);
  }, [value, options]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, searchable]);

  const handleSelect = (option: SelectOption) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm("");
  };

  const filteredOptions =
    searchable && searchTerm
      ? options.filter(
          (option) =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;

  return (
    <div className="group w-full" ref={dropdownRef}>
      <label className="block text-lg font-semibold text-slate-800 mb-3">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl 
            text-left text-slate-700 font-medium transition-all duration-200 text-lg
            hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              isOpen
                ? "border-orange-500 ring-2 ring-orange-500 shadow-lg"
                : "shadow-sm hover:shadow-md"
            }
            ${error ? "border-red-500 focus:border-red-500" : ""}
          `}
        >
          <span
            className={`${
              selectedOption ? "text-slate-800" : "text-slate-500"
            } truncate block pr-8`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            {searchable ? (
              <svg
                className="h-5 w-5 text-slate-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            ) : (
              <motion.svg
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="h-5 w-5 text-slate-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </motion.svg>
            )}
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute z-[99999999] w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-96 overflow-hidden"
            >
              {searchable && (
                <div className="p-3 border-b border-slate-200">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search services..."
                      className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-4 w-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              <div className="py-2 max-h-72 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => (
                    <motion.button
                      key={option.value}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.1, delay: index * 0.02 }}
                      onClick={() => handleSelect(option)}
                      className={`
                        w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors duration-150
                        flex items-center justify-between group/item text-lg
                        ${
                          selectedOption?.value === option.value
                            ? "bg-orange-50 text-orange-700 font-semibold"
                            : "text-slate-700"
                        }
                      `}
                    >
                      <span className="truncate">{option.label}</span>
                      {selectedOption?.value === option.value && (
                        <svg
                          className="w-5 h-5 text-orange-500 flex-shrink-0 ml-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </motion.button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-slate-500">
                    <svg
                      className="w-8 h-8 mx-auto mb-2 text-slate-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <p className="text-sm">No services found</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">⚠️ {error}</p>}
    </div>
  );
}
