// /src/components/ui/PhoneInput.tsx

"use client";

import { useState, useEffect } from "react";
import {
  formatPhoneNumber,
  validatePhoneNumber,
  PhoneValidationResult,
} from "@/lib/PhoneValidation";

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function PhoneInput({
  label = "Phone Number",
  value,
  onChange,
  onValidationChange,
  placeholder = "(555) 123-4567",
  required = false,
  error: externalError,
  className = "",
  disabled = false,
}: PhoneInputProps) {
  const [validation, setValidation] = useState<PhoneValidationResult>({
    isValid: false,
    formatted: "",
  });
  const [isTouched, setIsTouched] = useState(false);

  // Validate whenever value changes
  useEffect(() => {
    const result = validatePhoneNumber(value);
    setValidation(result);

    // Notify parent of validation status
    if (onValidationChange) {
      onValidationChange(result.isValid);
    }
  }, [value, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Format as user types
    const formatted = formatPhoneNumber(inputValue);
    onChange(formatted);
  };

  const handleBlur = () => {
    setIsTouched(true);
  };

  // Determine error to show
  const errorToShow =
    externalError ||
    (isTouched && !validation.isValid ? validation.error : undefined);
  const hasError = !!errorToShow;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="tel"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all duration-200 ${
            hasError
              ? "border-red-500 focus:border-red-500 bg-red-50"
              : "border-slate-200 focus:border-orange-500 bg-white"
          } ${
            disabled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
          }`}
          maxLength={18} // Max formatted length: "+1 (555) 123-4567"
        />

        {/* Validation indicator */}
        {value && isTouched && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {validation.isValid ? (
              <div className="text-green-500">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            ) : (
              <div className="text-red-500">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {errorToShow && (
        <p className="mt-2 text-sm text-red-600">⚠️ {errorToShow}</p>
      )}

      {/* Helper text */}
      {!errorToShow && !value && (
        <p className="mt-1 text-xs text-slate-500">
          Enter your phone number for{" "}
          {required ? "account verification" : "contact purposes"}
        </p>
      )}

      {/* Success message */}
      {validation.isValid && isTouched && !errorToShow && (
        <p className="mt-1 text-xs text-green-600">
          ✓ Valid phone number format
        </p>
      )}
    </div>
  );
}

//example usage

// function ProfileEditForm() {
//   const [phone, setPhone] = useState("");
//   const [isPhoneValid, setIsPhoneValid] = useState(false);

//   return (
//     <form>
//       <PhoneInput
//         label="Contact Phone"
//         value={phone}
//         onChange={setPhone}
//         onValidationChange={setIsPhoneValid}
//         required={true}
//       />

//       <button
//         type="submit"
//         disabled={!isPhoneValid}
//         className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg disabled:bg-gray-300"
//       >
//         Save Profile
//       </button>
//     </form>
//   );
// }
