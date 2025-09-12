"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string; // Add this
    village?: string; // Add this
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export interface VerifiedAddressData {
  original: string;
  standardized: string;
  confidence: "high" | "medium" | "low";
  neighborhood?: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  label?: string;
  value: string;
  onChange: (address: string) => void;
  onAddressSelected?: (addressData: VerifiedAddressData) => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
}

export function AddressAutocomplete({
  label = "Address",
  value,
  onChange,
  onAddressSelected,
  required = false,
  placeholder = "Start typing an address...",
  error,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isVerified, setIsVerified] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch address suggestions from OpenStreetMap
  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodedQuery}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "TheHandyHack-App/1.0 (contact@thehandyhack.com)",
        },
      });

      if (response.ok) {
        const data: AddressSuggestion[] = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error("Failed to fetch address suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (value.trim() && !isVerified) {
        fetchSuggestions(value);
      } else if (!value.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, isVerified]);

  // Handle input change
  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setIsVerified(false);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    const formattedAddress = formatDisplayAddress(suggestion);

    // Build address data first (before state changes)
    const addressData: VerifiedAddressData = {
      original: value,
      standardized: formattedAddress,
      confidence: "high",
      neighborhood:
        suggestion.address.neighbourhood || suggestion.address.suburb,
      city:
        suggestion.address.city ||
        suggestion.address.town ||
        suggestion.address.village,
      state: suggestion.address.state,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
    };

    // Update state
    onChange(formattedAddress);
    setIsVerified(true);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    // Call callback with address data
    onAddressSelected?.(addressData);
  };
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  //  format Display Address
  const formatDisplayAddress = (suggestion: AddressSuggestion) => {
    const addr = suggestion.address;

    // Extract components
    const streetNumber = addr.house_number || "";
    const streetName = addr.road || "";
    const city = addr.city || addr.town || addr.village || addr.suburb;
    const state = addr.state;
    const zip = addr.postcode;

    // Build street address
    const street = [streetNumber, streetName].filter(Boolean).join(" ");

    // Build final format: "123 Main St, City, ST 12345"
    const parts = [];
    if (street) parts.push(street);
    if (city) parts.push(city);
    if (state && zip) {
      parts.push(`${state} ${zip}`);
    } else if (state) {
      parts.push(state);
    }

    return parts.join(", ");
  };
  return (
    <div className="w-full">
      <label className="block text-lg font-semibold text-slate-800 mb-3">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value} // This should be the prop value, not any internal state
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={placeholder}
            className={`
              w-full px-4 py-4 pr-12 text-lg border bg-white rounded-2xl 
              focus:ring-2 focus:ring-orange-500 outline-none transition-all duration-200
              ${
                error
                  ? "border-red-500 focus:border-red-500"
                  : isVerified
                  ? "border-green-500 focus:border-green-500"
                  : "border-slate-200 focus:border-orange-500"
              }
            `}
            required={required}
          />

          {/* Loading/Status Icons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            ) : isVerified ? (
              <svg
                className="w-5 h-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-slate-400"
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
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-hidden"
            >
              <div className="py-2 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.lat}-${suggestion.lon}`}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors duration-150
                      flex items-start space-x-3 text-sm
                      ${selectedIndex === index ? "bg-orange-50" : ""}
                    `}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <svg
                        className="w-4 h-4 text-slate-400"
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
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 truncate">
                        {formatDisplayAddress(suggestion)}{" "}
                        {/* Use same format everywhere */}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {suggestion.address.neighbourhood ||
                          suggestion.address.suburb ||
                          "Nearby area"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Display */}
      {error && <p className="mt-2 text-sm text-red-600">⚠️ {error}</p>}

      {/* Help Text */}
      <p className="text-xs text-slate-500 mt-2">
        💡 Start typing to see address suggestions. Use arrow keys to navigate
        and Enter to select.
      </p>
    </div>
  );
}
