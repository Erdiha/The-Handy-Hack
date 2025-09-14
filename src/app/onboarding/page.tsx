"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { OnboardingStepProps } from "@/types/onboarding";
import { AddressAutocomplete } from "@/components/ui/AddressInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { validatePhoneNumber } from "@/lib/PhoneValidation";
interface AddressData {
  original: string;
  standardized: string;
  confidence: "high" | "medium" | "low";
  neighborhood?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    neighborhood: "",
    address: "",
    phone: "",
    bio: "",
    services: [] as string[],
    hourlyRate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="h-[calc(100vh-5rem)] bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const isHandyman = session.user.role === "handyman";

  const nextStep = async () => {
    if (step < (isHandyman ? 4 : 2)) {
      setStep(step + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("🚀 Starting onboarding completion...");
      console.log("📋 Form data:", formData);

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: session.user.role,
        }),
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Success response:", data);
        window.location.href = "/dashboard";
      } else {
        const errorData = await response.json();
        console.error("❌ Error response:", errorData);
        setError(errorData.error || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error("💥 Network error:", error);
      setError(
        `Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return (
          formData.neighborhood.length > 0 && formData.address.trim().length > 0
        );
      case 2:
        if (isHandyman) {
          const phoneValid = validatePhoneNumber(formData.phone).isValid;
          return phoneValid && formData.bio.length > 0;
        } else {
          const phoneValid = validatePhoneNumber(formData.phone).isValid;
          return phoneValid;
        }
      case 3:
        return formData.services.length >= 2;
      case 4:
        return (
          formData.hourlyRate.length > 0 && parseFloat(formData.hourlyRate) > 0
        );
      default:
        return false;
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  return (
    <div className="h-[calc(100vh-5rem)] bg-orange-50 flex items-center justify-center py-8">
      <motion.div
        className="max-w-2xl w-full mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-orange-100">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-600">
                Step {step} of {isHandyman ? 4 : 2}
              </span>
              <span className="text-sm font-medium text-orange-600">
                {Math.round((step / (isHandyman ? 4 : 2)) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(step / (isHandyman ? 4 : 2)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start">
                <div className="text-red-600 text-sm">
                  <strong>Error:</strong> {error}
                </div>
              </div>
            </div>
          )}

          {/* Step Content */}
          {step === 1 && (
            <LocationStep
              formData={formData}
              onChange={handleInputChange}
              isHandyman={isHandyman}
            />
          )}

          {step === 2 && !isHandyman && (
            <CustomerCompleteStep
              formData={formData}
              onChange={handleInputChange}
            />
          )}

          {step === 2 && isHandyman && (
            <HandymanProfileStep
              formData={formData}
              onChange={handleInputChange}
            />
          )}

          {step === 3 && isHandyman && (
            <ServicesStep formData={formData} onChange={handleInputChange} />
          )}

          {step === 4 && isHandyman && (
            <RatesStep formData={formData} onChange={handleInputChange} />
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1 || loading}
              className="border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Back
            </Button>
            <Button
              onClick={nextStep}
              disabled={!canProceed() || loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-8"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : step === (isHandyman ? 4 : 2) ? (
                "Complete Setup"
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ✅ Enhanced LocationStep using existing AddressAutocomplete component
function LocationStep({ formData, onChange, isHandyman }: OnboardingStepProps) {
  const neighborhoods = [
    "Highland Park",
    "Glassell Park",
    "Eagle Rock",
    "Mt Washington",
    "Silver Lake",
    "Echo Park",
    "Los Feliz",
    "Atwater Village",
  ];

  // Handle address change from AddressAutocomplete
  const handleAddressChange = (address: string) => {
    onChange("address", address);
  };

  // Handle address selection from dropdown
  const handleAddressSelected = (addressData: AddressData) => {
    // Use the standardized formatted address
    onChange("address", addressData.standardized);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">📍</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          {isHandyman ? "Where do you work?" : "Where are you located?"}
        </h2>
        <p className="text-slate-600">
          {isHandyman
            ? "Select your neighborhood and provide your exact address"
            : "Choose your neighborhood and provide your address for local matches"}
        </p>
      </div>

      <div className="space-y-6">
        {/* Neighborhood Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Select Neighborhood
          </label>
          <div className="grid grid-cols-2 gap-3">
            {neighborhoods.map((neighborhood) => (
              <button
                key={neighborhood}
                onClick={() => onChange("neighborhood", neighborhood)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  formData.neighborhood === neighborhood
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-slate-200 hover:border-orange-300 text-slate-700"
                }`}
              >
                <div className="font-medium">{neighborhood}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ✅ Address Input using existing AddressAutocomplete component */}
        <div>
          <AddressAutocomplete
            label="Street Address"
            value={formData.address}
            onChange={handleAddressChange}
            onAddressSelected={handleAddressSelected}
            required={true}
            placeholder={
              isHandyman ? "Where do you provide services?" : "Your address"
            }
            error={
              formData.address.trim().length === 0
                ? "Address is required to continue"
                : ""
            }
          />
          <p className="text-xs text-slate-500 mt-1">
            💡 This helps us match you with{" "}
            {isHandyman ? "nearby customers" : "local handymen"}
          </p>
        </div>

        {/* Visual indicator showing both fields are required */}
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
          <div className="flex items-start space-x-3">
            <div className="text-orange-600">
              <svg
                className="w-5 h-5 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-700 font-medium">
                Both fields required
              </p>
              <p className="text-xs text-slate-600">
                Select your neighborhood and provide your exact address to
                continue
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CustomerCompleteStep({ formData, onChange }: OnboardingStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">📱</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Almost done!</h2>
        <p className="text-slate-600">
          Just need your phone number for booking confirmations
        </p>
      </div>

      <PhoneInput
        label="Phone Number"
        value={formData.phone}
        onChange={(value) => onChange("phone", value)}
        required={true}
        placeholder="(555) 123-4567"
      />
    </motion.div>
  );
}

function HandymanProfileStep({ formData, onChange }: OnboardingStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">👤</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          Tell your story
        </h2>
        <p className="text-slate-600">Help neighbors get to know you</p>
      </div>

      <div className="space-y-6">
        <PhoneInput
          label="Phone Number"
          value={formData.phone}
          onChange={(value) => onChange("phone", value)}
          required={true}
          placeholder="(555) 123-4567"
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            About You
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => onChange("bio", e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 resize-none"
            placeholder="Hi! I'm a local handyman with 5+ years experience. I specialize in..."
          />
          <p className="text-xs text-slate-500 mt-1">
            Tell customers about your experience and specialties
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ServicesStep({ formData, onChange }: OnboardingStepProps) {
  const services = [
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

  const toggleService = (service: string) => {
    const current = formData.services || [];
    const updated = current.includes(service)
      ? current.filter((s: string) => s !== service)
      : [...current, service];
    onChange("services", updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">🔧</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          What do you do?
        </h2>
        <p className="text-slate-600">
          Select all services you offer (pick at least 2)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {services.map((service) => (
          <button
            key={service}
            onClick={() => toggleService(service)}
            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              formData.services?.includes(service)
                ? "border-purple-500 bg-purple-50 text-purple-700"
                : "border-slate-200 hover:border-purple-300 text-slate-700"
            }`}
          >
            <div className="font-medium">{service}</div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function RatesStep({ formData, onChange }: OnboardingStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">💰</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          Set your rate
        </h2>
        <p className="text-slate-600">You can always change this later</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Hourly Rate
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 text-lg">
              $
            </span>
            <input
              type="number"
              value={formData.hourlyRate}
              onChange={(e) => onChange("hourlyRate", e.target.value)}
              className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
              placeholder="50"
              min="1"
              step="1"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500">
              /hour
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Average in your area: $45-75/hour
          </p>
        </div>

        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
          <h3 className="font-semibold text-slate-800 mb-2">
            You&apos;re almost ready!
          </h3>
          <p className="text-slate-600 text-sm">
            After completing setup, you&apos;ll be visible to neighbors in{" "}
            {formData.neighborhood}. Start getting requests within 24 hours!
          </p>
        </div>
      </div>
    </motion.div>
  );
}
