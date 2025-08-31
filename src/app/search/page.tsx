"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Handyman } from "@/types/handyman";
import { EmergencyAlertModal } from "@/components/modals/EmergencyAlertModal";

// Custom Select Component
interface SelectOption {
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
}

function ResponsiveSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Select...",
}: ResponsiveSelectProps) {
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
    <div className="group " ref={dropdownRef}>
      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative ">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl 
            text-left text-slate-700 font-medium transition-all duration-200
            hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              isOpen
                ? "border-orange-500 ring-2 ring-orange-500 shadow-lg"
                : "shadow-sm hover:shadow-md"
            }
          `}
        >
          <span
            className={selectedOption ? "text-slate-800" : "text-slate-500"}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none ">
            <motion.svg
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="h-5 w-5 text-slate-400"
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
              className="absolute z-[99999999] w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto"
            >
              <div className="py-2 ">
                {options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1, delay: index * 0.02 }}
                    onClick={() => handleSelect(option)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors duration-150
                      flex items-center justify-between group/item
                      ${
                        selectedOption?.value === option.value
                          ? "bg-orange-50 text-orange-700 font-semibold"
                          : "text-slate-700"
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {selectedOption?.value === option.value && (
                      <svg
                        className="w-5 h-5 text-orange-500"
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

interface Neighborhood {
  id: number;
  name: string;
  slug: string;
  city: string;
  state: string;
}

export default function SearchPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("All Services");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [handymen, setHandymen] = useState<Handyman[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("All Prices");
  const [selectedRating, setSelectedRating] = useState("All Ratings");
  const [communityStats, setCommunityStats] = useState({
    jobsCompletedThisWeek: 0,
    averageHourlyRate: 65,
    activeHandymenCount: 0,
    responseTime: "18 minutes",
    savingsVsTaskRabbit: "$25/job",
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("All Areas");
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [userDefaultNeighborhood, setUserDefaultNeighborhood] = useState<
    string | null
  >(null);
  const [neighborhoodsLoading, setNeighborhoodsLoading] = useState(true);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const services = [
    "All Services",
    "Plumbing",
    "Electrical",
    "Painting",
    "Carpentry",
    "Appliance Repair",
    "Furniture Assembly",
    "Home Cleaning",
    "Landscaping",
    "Tile Work",
    "Drywall Repair",
  ];

  useEffect(() => {
    fetchHandymen();
  }, [
    selectedService,
    selectedPriceRange,
    selectedRating,
    selectedNeighborhood,
  ]);

  useEffect(() => {
    fetchCommunityStats();
  }, []);

  useEffect(() => {
    fetchNeighborhoodsAndUserDefault();
  }, []);

  useEffect(() => {
    if (!neighborhoodsLoading) {
      fetchCommunityStats();
    }
  }, [selectedNeighborhood, neighborhoodsLoading]);

  const fetchNeighborhoodsAndUserDefault = async () => {
    setNeighborhoodsLoading(true);
    try {
      const [neighborhoodsRes, userNeighborhoodRes] = await Promise.all([
        fetch("/api/neighborhoods"),
        session?.user ? fetch("/api/user/neighborhood") : Promise.resolve(null),
      ]);

      const neighborhoodsData = await neighborhoodsRes.json();
      if (neighborhoodsData.success) {
        setNeighborhoods(neighborhoodsData.neighborhoods);
      }

      if (userNeighborhoodRes && session?.user) {
        const userNeighborhoodData = await userNeighborhoodRes.json();
        if (userNeighborhoodData.success && userNeighborhoodData.neighborhood) {
          setUserDefaultNeighborhood(userNeighborhoodData.neighborhood);
          setSelectedNeighborhood(userNeighborhoodData.neighborhood);
        }
      }
    } catch (error) {
      console.error("Error fetching neighborhoods:", error);
    } finally {
      setNeighborhoodsLoading(false);
    }
  };

  const fetchCommunityStats = async () => {
    setStatsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedNeighborhood !== "All Areas") {
        params.append("neighborhood", selectedNeighborhood);
      }

      const response = await fetch(`/api/community-stats?${params}`);
      const data = await response.json();

      if (data.success) {
        setCommunityStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching community stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchHandymen = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (selectedService !== "All Services") {
        params.append("service", selectedService);
      }
      if (selectedPriceRange !== "All Prices") {
        params.append("priceRange", selectedPriceRange);
      }
      if (selectedRating !== "All Ratings") {
        params.append("rating", selectedRating);
      }
      if (selectedNeighborhood !== "All Areas") {
        params.append("neighborhood", selectedNeighborhood);
      }

      const response = await fetch(`/api/handymen?${params}`);
      const data = await response.json();

      if (data.success) {
        const validHandymen = data.handymen.filter((handyman: Handyman) => {
          if (
            !handyman.id ||
            handyman.id === "undefined" ||
            handyman.id === "null"
          ) {
            console.warn("Invalid handyman ID found:", handyman);
            return false;
          }
          return true;
        });

        setHandymen(validHandymen);
      } else {
        setError(data.error || "Failed to load handymen");
      }
    } catch (error) {
      setError("Something went wrong");
      console.error("Error fetching handymen:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHandymen = handymen.filter((handyman) => {
    const matchesSearch =
      searchQuery === "" ||
      handyman.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      handyman.services.some((service) =>
        service.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSearch;
  });

  return (
    <>
      <div className="min-h-screen ">
        {/* Hero Section */}
        <div className="relative z-[999999]">
          <div className="absolute inset-0"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 md:pt-16 md:pb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8 md:mb-12"
            >
              {/* Main Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 mb-4 md:mb-6">
                Find Your Perfect
                <span className="block text-orange-600 text-4xl sm:text-5xl lg:text-6xl mt-2 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text ">
                  Neighborhood Pro
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
                {session?.user ? `Welcome back, ${session.user.name}! ` : ""}
                Connect with trusted local handymen in your area. Real
                neighbors, real skills, real results.
              </p>
            </motion.div>

            {/* Search Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-5xl mx-auto"
            >
              {/* Main Search Input */}
              <div className="mb-6 md:mb-8">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors duration-200"
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
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="What needs fixing? Try 'leaky faucet' or 'electrical outlet'"
                    className="block w-full pl-12 pr-4 py-4 md:py-5 text-base md:text-lg border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 bg-white shadow-sm hover:shadow-md focus:shadow-lg placeholder-slate-400"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/10 to-blue-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm">
                {/* Mobile: Stack vertically, Desktop: Grid layout */}
                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-4">
                  {/* Neighborhood Filter */}
                  <div className="w-full">
                    <ResponsiveSelect
                      label="Location"
                      value={selectedNeighborhood}
                      onChange={setSelectedNeighborhood}
                      disabled={neighborhoodsLoading}
                      options={[
                        { value: "All Areas", label: "All Areas" },
                        ...neighborhoods.map((n) => ({
                          value: n.name,
                          label: n.name,
                        })),
                      ]}
                      placeholder="Choose area..."
                    />
                  </div>

                  {/* Service Filter */}
                  <div className="w-full">
                    <ResponsiveSelect
                      label="Service"
                      value={selectedService}
                      onChange={setSelectedService}
                      options={services.map((s) => ({ value: s, label: s }))}
                      placeholder="Any service..."
                    />
                  </div>

                  {/* Price Range Filter */}
                  <div className="w-full">
                    <ResponsiveSelect
                      label="Budget"
                      value={selectedPriceRange}
                      onChange={setSelectedPriceRange}
                      options={[
                        { value: "All Prices", label: "All Prices" },
                        { value: "under-50", label: "Under $50/hr" },
                        { value: "50-80", label: "$50-80/hr" },
                        { value: "80-120", label: "$80-120/hr" },
                        { value: "over-120", label: "Over $120/hr" },
                      ]}
                      placeholder="Any budget..."
                    />
                  </div>

                  {/* Rating Filter */}
                  <div className="w-full">
                    <ResponsiveSelect
                      label="Rating"
                      value={selectedRating}
                      onChange={setSelectedRating}
                      options={[
                        { value: "All Ratings", label: "All Ratings" },
                        { value: "4.5", label: "4.5+ ⭐" },
                        { value: "4.0", label: "4.0+ ⭐" },
                        { value: "3.5", label: "3.5+ ⭐" },
                      ]}
                      placeholder="Any rating..."
                    />
                  </div>

                  {/* CTA Button */}
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                      Need Help?
                    </label>
                    <Link href="/post-job" className="block">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full h-[56px] md:h-[54px] px-4 py-4 md:py-3.5 text-base md:text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-lg"
                      >
                        Post a Job
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Results Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 z-0 relative">
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-4 xl:grid-cols-3 lg:gap-8">
            {/* Main Results */}
            <div className="lg:col-span-3 xl:col-span-2">
              {/* Results Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4"
              >
                <div>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800">
                    {loading
                      ? "Searching..."
                      : `${filteredHandymen.length} Pros Found`}
                  </h2>
                  <p className="text-slate-600 mt-1 text-sm md:text-base">
                    {selectedNeighborhood === "All Areas"
                      ? "All Areas"
                      : selectedNeighborhood}{" "}
                    • Available today
                  </p>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  {/* Clear Filters */}
                  {(selectedService !== "All Services" ||
                    selectedPriceRange !== "All Prices" ||
                    selectedRating !== "All Ratings" ||
                    selectedNeighborhood !== "All Areas" ||
                    searchQuery !== "") && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedService("All Services");
                        setSelectedPriceRange("All Prices");
                        setSelectedRating("All Ratings");
                        setSelectedNeighborhood("All Areas");
                        setSearchQuery("");
                      }}
                      className="px-3 md:px-4 py-2 text-xs md:text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg border border-orange-200 hover:border-orange-300 transition-all duration-200"
                    >
                      Clear Filters
                    </motion.button>
                  )}

                  {/* View Toggle */}
                  {/* <div className="flex bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-xs md:text-sm ${
                      viewMode === "list"
                        ? "bg-white text-orange-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    <svg
                      className="w-4 h-4 md:mr-2 inline"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    <span className="hidden md:inline">List</span>
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-xs md:text-sm ${
                      viewMode === "map"
                        ? "bg-white text-orange-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    <svg
                      className="w-4 h-4 md:mr-2 inline"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="hidden md:inline">Map</span>
                  </button>
                </div> */}
                </div>
              </motion.div>

              {/* Results List */}
              <div className="space-y-4 md:space-y-6">
                {loading ? (
                  <div className="text-center py-16">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
                    ></motion.div>
                    <p className="text-slate-600 text-lg">
                      Finding the best pros in your area...
                    </p>
                  </div>
                ) : error ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 bg-white rounded-2xl shadow-sm border border-red-100"
                  >
                    <div className="text-6xl mb-4">😕</div>
                    <p className="text-slate-600 mb-4 text-lg">{error}</p>
                    <button
                      onClick={fetchHandymen}
                      className="text-orange-600 hover:text-orange-700 font-semibold underline"
                    >
                      Try again
                    </button>
                  </motion.div>
                ) : filteredHandymen.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 bg-white rounded-2xl shadow-sm"
                  >
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-slate-600 mb-2 text-lg">
                      No handymen found
                    </p>
                    <p className="text-slate-500">
                      Try adjusting your filters or search terms
                    </p>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {filteredHandymen.map((handyman, index) => (
                      <HandymanCard
                        key={handyman.id}
                        handyman={handyman}
                        index={index}
                        currentUserId={session?.user?.id}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 xl:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Community Stats */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-100/50 p-6 hover:shadow-xl transition-all duration-300"
                >
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <span className="mr-2 text-2xl">🏘️</span>
                    {selectedNeighborhood === "All Areas"
                      ? "Local Area"
                      : selectedNeighborhood}
                  </h3>

                  <div className="space-y-4">
                    {statsLoading ? (
                      <div className="animate-pulse space-y-4">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="h-4 bg-slate-200 rounded-lg"
                          ></div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-100">
                          <span className="text-slate-700 font-medium">
                            Jobs this week
                          </span>
                          <span className="font-bold text-green-600 text-lg">
                            {communityStats.jobsCompletedThisWeek}
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <span className="text-slate-700 font-medium">
                            Average rate
                          </span>
                          <span className="font-bold text-slate-800 text-lg">
                            ${communityStats.averageHourlyRate}/hr
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl border border-purple-100">
                          <span className="text-slate-700 font-medium">
                            Active pros
                          </span>
                          <span className="font-bold text-purple-600 text-lg">
                            {communityStats.activeHandymenCount}
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                          <span className="text-slate-700 font-medium">
                            Response time
                          </span>
                          <span className="font-bold text-orange-600 text-lg">
                            {communityStats.responseTime}
                          </span>
                        </div>

                        {/* <div className="pt-3 border-t border-slate-200">
                        <div className="text-center p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
                          <div className="text-xs text-slate-600 mb-1">
                            Savings vs TaskRabbit
                          </div>
                          <div className="font-bold text-orange-600 text-xl">
                            {communityStats.savingsVsTaskRabbit}
                          </div>
                        </div>
                      </div> */}
                      </>
                    )}
                  </div>
                </motion.div>

                {/* Emergency CTA */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="bg-orange-500 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-3">🚨</div>
                    <h3 className="text-xl font-bold mb-2">Emergency?</h3>
                    <p className="text-red-100 text-sm mb-4 leading-relaxed">
                      Get instant help from available pros in your area
                    </p>
                    <Button
                      onClick={() => setIsEmergencyModalOpen(true)}
                      variant="danger"
                      className="w-full py-4 text-lg"
                    >
                      Emergency Help (15 min)
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <EmergencyAlertModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />
    </>
  );
}

// Enhanced Handyman Card Component
function HandymanCard({
  handyman,
  index,
  currentUserId,
}: {
  handyman: Handyman;
  index: number;
  currentUserId?: string;
}) {
  const isOwnProfile = currentUserId && handyman.id === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl border border-slate-100/50 overflow-hidden transition-all duration-300 group relative z-0"
    >
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 md:gap-6">
          {/* Profile Section */}
          <div className="flex items-start space-x-3 md:space-x-4 flex-1 min-w-0">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <span className="text-white font-bold text-sm md:text-lg lg:text-xl">
                  {handyman.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              {handyman.isAvailable && (
                <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Name & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800 truncate">
                  {handyman.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {handyman.isAvailable && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                      ⚡ Available
                    </span>
                  )}
                  {isOwnProfile && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                      👤 You
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-600 mb-3">
                <span className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-semibold text-slate-800">
                    {handyman.rating.toFixed(1)}
                  </span>
                  <span className="hidden sm:inline">
                    ({handyman.reviewCount})
                  </span>
                </span>
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <span>📍</span>
                  <span className="font-medium">
                    {handyman.distance.toFixed(1)} mi
                  </span>
                </span>
                <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 hidden md:flex">
                  <span>⏱️</span>
                  <span className="font-medium">{handyman.responseTime}</span>
                </span>
              </div>

              {/* Bio */}
              <p className="text-slate-700 leading-relaxed mb-3 md:mb-4 text-sm md:text-base line-clamp-2">
                {handyman.bio}
              </p>

              {/* Services */}
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {handyman.services.slice(0, 2).map((service) => (
                  <span
                    key={service}
                    className="px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-xl text-xs md:text-sm font-medium border border-blue-100"
                  >
                    {service}
                  </span>
                ))}
                {handyman.services.length > 2 && (
                  <span className="px-2 md:px-3 py-1 md:py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs md:text-sm font-medium">
                    +{handyman.services.length - 2}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4 lg:gap-6 lg:min-w-[180px]">
            {/* Price */}
            <div className="text-center lg:text-right">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800">
                ${handyman.hourlyRate}
                <span className="text-sm md:text-lg lg:text-xl font-normal text-slate-500">
                  /hr
                </span>
              </div>
              <div className="text-xs md:text-sm text-slate-500 font-medium">
                Fair pricing
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2 w-full lg:w-auto lg:min-w-[160px]">
              {isOwnProfile ? (
                <Button
                  size="sm"
                  disabled
                  className="w-full bg-slate-200 text-slate-500 font-semibold px-4 py-2.5 text-sm rounded-xl cursor-not-allowed border border-slate-300"
                  title="This is your own profile"
                >
                  👤 Your Profile
                </Button>
              ) : (
                <Link
                  href={`/messages?handyman=${
                    handyman.id
                  }&name=${encodeURIComponent(
                    handyman.name
                  )}&service=General%20Inquiry`}
                >
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-4 py-2.5 text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    💬 Contact
                  </Button>
                </Link>
              )}

              <Link href={`/handyman/${handyman.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-2 border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 font-semibold px-4 py-2.5 text-sm rounded-xl transition-all duration-200"
                >
                  👤 Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
