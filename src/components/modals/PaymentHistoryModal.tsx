"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

interface PaymentHistoryItem {
  id: number;
  amount: number;
  status: string;
  createdAt: Date;
  jobTitle: string | null;
  date: Date;
}

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

interface SelectOption {
  value: string;
  label: string;
}

function ResponsiveSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(
    options.find((opt) => opt.value === value) || null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (option: SelectOption) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="group w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full px-3 sm:px-4 py-2 bg-white border-2 border-slate-200 rounded-lg 
            text-left text-slate-700 font-medium transition-all duration-200 text-sm sm:text-base
            hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
            ${
              isOpen
                ? "border-orange-500 ring-2 ring-orange-500 shadow-lg"
                : "shadow-sm hover:shadow-md"
            }
          `}
        >
          <span
            className={`${
              selectedOption ? "text-slate-800" : "text-slate-500"
            } truncate block pr-8`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <motion.svg
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0"
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
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute z-[99999999] w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 sm:max-h-60 overflow-auto"
            >
              <div className="py-2">
                {options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1, delay: index * 0.02 }}
                    onClick={() => handleSelect(option)}
                    className={`
                      w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-orange-50 transition-colors duration-150
                      flex items-center justify-between group/item text-sm sm:text-base
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
                        className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0 ml-2"
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
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function PaymentHistoryModal({
  isOpen,
  onClose,
  userRole,
}: PaymentHistoryModalProps) {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAllPayments = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/payments/history?limit=100");
      const data = await response.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && payments.length === 0) {
      fetchAllPayments();
    }
  }, [isOpen]);

  const filteredPayments = payments.filter((payment) => {
    const matchesFilter = filter === "all" || payment.status === filter;
    const matchesSearch =
      payment.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    return matchesFilter && (searchTerm === "" || matchesSearch);
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 lg:p-6">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{
                type: "tween",
                duration: 0.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 flex-shrink-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Payment History
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Filters */}
              <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search by job title..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div className="sm:w-48">
                    <ResponsiveSelect
                      value={filter}
                      onChange={setFilter}
                      options={[
                        { value: "all", label: "All Status" },
                        { value: "pending", label: "Pending" },
                        { value: "escrowed", label: "Escrowed" },
                        { value: "released", label: "Released" },
                        { value: "refunded", label: "Refunded" },
                      ]}
                      placeholder="Filter by status..."
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading payment history...</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Please wait...
                    </p>
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">💳</div>
                    <p className="text-slate-600 font-medium">
                      No payments found
                    </p>
                    <p className="text-sm text-slate-400">
                      Try adjusting your filters
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="p-3 sm:p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 truncate">
                              {payment.jobTitle || "Untitled Job"}
                            </h4>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                              <span className="text-sm text-slate-500">
                                {new Date(payment.date).toLocaleDateString()}
                              </span>
                              <span
                                className={`inline-flex px-2 py-1 rounded text-xs font-medium w-fit ${
                                  payment.status === "released"
                                    ? "bg-green-100 text-green-800"
                                    : payment.status === "escrowed"
                                    ? "bg-blue-100 text-blue-800"
                                    : payment.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : payment.status === "refunded"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {payment.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="text-lg sm:text-xl font-bold text-slate-900">
                              ${(payment.amount / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex-shrink-0">
                <p className="text-sm text-slate-600">
                  Showing {filteredPayments.length} of {payments.length}{" "}
                  transactions
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={onClose}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
