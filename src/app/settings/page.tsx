// app/settings/page.tsx - Mobile-Responsive Settings Page
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "customer" | "handyman";
  bio?: string;
  hourlyRate?: string;
  neighborhood?: string;
  services?: string[];
  hasCompletedOnboarding?: boolean;
}

interface NotificationPreferences {
  browser: boolean;
  sound: boolean;
  email: boolean;
  sms: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch profile data
  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();

      if (response.ok) {
        setProfile({
          id: session!.user.id,
          email: session!.user.email,
          name: session!.user.name,
          role: session!.user.role as "customer" | "handyman",
          phone: data.phone,
          bio: data.bio,
          hourlyRate: data.hourlyRate,
          neighborhood: data.neighborhood,
          services: data.services || [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) return null;

  const tabs = [
    { key: "profile", label: "Profile", icon: "👤" },
    { key: "notifications", label: "Notifications", icon: "🔔" },
    { key: "account", label: "Account", icon: "🔐" },
    ...(profile.role === "handyman"
      ? [{ key: "services", label: "Services", icon: "🔧" }]
      : []),
    { key: "payment", label: "Payment", icon: "💳" },
  ];

  return (
    <div className="max-h-[calc(100vh-4rem)] bg-orange-50 overflow-y-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Settings
          </h1>
          <p className="text-slate-600">Manage your account and preferences</p>
        </div>

        {/* Mobile Tabs - Horizontal Scroll */}
        <div className="lg:hidden mb-6">
          <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-orange-50 border border-slate-200"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop + Mobile Layout */}
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sticky top-24">
              <div className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-left ${
                      activeTab === tab.key
                        ? "bg-orange-100 text-orange-600 shadow-sm"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[70vh] h-fit">
              {activeTab === "profile" && <ProfileContent profile={profile} />}
              {activeTab === "notifications" && <NotificationsContent />}
              {activeTab === "account" && <AccountContent />}
              {activeTab === "services" && profile.role === "handyman" && (
                <ServicesContent profile={profile} />
              )}
              {activeTab === "payment" && <PaymentContent />}
            </div>
          </div>
        </div>
      </div>

      {/* Custom scrollbar hide for mobile tabs */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// Profile Content Component with Password Change
function ProfileContent({ profile }: { profile: UserProfile }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleEdit = (field: string, currentValue: string) => {
    setEditing(field);
    setValues({ [field]: currentValue || "" });
  };

  const handleSave = async (field: string) => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: values[field] }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("✅ Profile updated successfully!");
        setEditing(null);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage(`❌ ${data.error || "Failed to update profile"}`);
      }
    } catch (error) {
      setMessage("❌ Error updating profile");
      console.error("Profile update error:", error);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handlePasswordChange = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("✅ Password updated successfully!");
        setEditing(null);
        setValues({});
      } else {
        setMessage(`❌ ${data.error || "Failed to update password"}`);
      }
    } catch (error) {
      setMessage("❌ Error updating password");
      console.error("Password update error:", error);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setValues({});
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
        Profile Settings
      </h2>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm sm:text-base ${
            message.includes("✅")
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Avatar */}
      <div className="text-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4">
          <span className="text-white font-bold text-xl sm:text-2xl">
            {profile.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-slate-900">
          {profile.name}
        </h3>
        <p className="text-slate-600 capitalize">{profile.role}</p>
      </div>

      {/* Profile Fields */}
      <div className="space-y-4">
        <EditableField
          label="Name"
          field="name"
          value={profile.name}
          editing={editing}
          values={values}
          saving={saving}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          setValues={setValues}
        />

        <EditableField
          label="Email"
          field="email"
          value={profile.email}
          editing={editing}
          values={values}
          saving={saving}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          setValues={setValues}
          type="email"
        />

        <EditableField
          label="Phone"
          field="phone"
          value={profile.phone || ""}
          editing={editing}
          values={values}
          saving={saving}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          setValues={setValues}
          type="tel"
          placeholder="(555) 123-4567"
        />

        <EditableField
          label="Neighborhood"
          field="neighborhood"
          value={profile.neighborhood || ""}
          editing={editing}
          values={values}
          saving={saving}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          setValues={setValues}
          placeholder="Enter your neighborhood"
        />

        {/* Password Change Section */}
        <div className="group p-3 sm:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>

              {editing === "password" ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={values.currentPassword || ""}
                      onChange={(e) =>
                        setValues({
                          ...values,
                          currentPassword: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm sm:text-base"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={values.newPassword || ""}
                      onChange={(e) =>
                        setValues({ ...values, newPassword: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm sm:text-base"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={values.confirmPassword || ""}
                      onChange={(e) =>
                        setValues({
                          ...values,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm sm:text-base"
                      placeholder="Confirm new password"
                    />
                  </div>

                  {/* Password validation feedback */}
                  {values.newPassword && (
                    <div className="text-xs text-slate-600">
                      {values.newPassword.length < 8 && (
                        <p className="text-red-600">
                          • Password must be at least 8 characters
                        </p>
                      )}
                      {values.newPassword &&
                        values.confirmPassword &&
                        values.newPassword !== values.confirmPassword && (
                          <p className="text-red-600">
                            • Passwords do not match
                          </p>
                        )}
                      {values.newPassword.length >= 8 &&
                        values.newPassword === values.confirmPassword && (
                          <p className="text-green-600">• Passwords match</p>
                        )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handlePasswordChange()}
                      disabled={
                        saving ||
                        !values.currentPassword ||
                        !values.newPassword ||
                        values.newPassword !== values.confirmPassword ||
                        values.newPassword.length < 8
                      }
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
                    >
                      {saving ? "Updating..." : "Update Password"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-slate-900">••••••••</p>
                  <button
                    onClick={() => handleEdit("password", "")}
                    className="opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity px-3 py-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {profile.role === "handyman" && (
          <>
            <EditableField
              label="Bio"
              field="bio"
              value={profile.bio || ""}
              editing={editing}
              values={values}
              saving={saving}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              setValues={setValues}
              isTextarea={true}
              placeholder="Tell customers about your experience..."
            />

            <EditableField
              label="Hourly Rate"
              field="hourlyRate"
              value={profile.hourlyRate || ""}
              editing={editing}
              values={values}
              saving={saving}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              setValues={setValues}
              type="number"
              placeholder="50"
              prefix="$"
              suffix="/hr"
            />
          </>
        )}
      </div>
    </div>
  );
}

// Mobile-optimized Editable Field Component
function EditableField({
  label,
  field,
  value,
  editing,
  values,
  saving,
  onEdit,
  onSave,
  onCancel,
  setValues,
  type = "text",
  placeholder,
  isTextarea = false,
  prefix,
  suffix,
}: {
  label: string;
  field: string;
  value: string;
  editing: string | null;
  values: Record<string, string>;
  saving: boolean;
  onEdit: (field: string, value: string) => void;
  onSave: (field: string) => void;
  onCancel: () => void;
  setValues: (values: Record<string, string>) => void;
  type?: string;
  placeholder?: string;
  isTextarea?: boolean;
  prefix?: string;
  suffix?: string;
}) {
  const isEditing = editing === field;
  const displayValue = values[field] ?? value;

  return (
    <div className="group p-3 sm:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
          </label>

          {isEditing ? (
            <div className="space-y-3">
              <div className="relative">
                {prefix && (
                  <span className="absolute left-3 top-2.5 text-slate-500 text-sm sm:text-base">
                    {prefix}
                  </span>
                )}
                {isTextarea ? (
                  <textarea
                    value={displayValue}
                    onChange={(e) =>
                      setValues({ ...values, [field]: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none text-sm sm:text-base"
                    rows={3}
                    placeholder={placeholder}
                  />
                ) : (
                  <input
                    type={type}
                    value={displayValue}
                    onChange={(e) =>
                      setValues({ ...values, [field]: e.target.value })
                    }
                    className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm sm:text-base ${
                      prefix ? "pl-8" : ""
                    } ${suffix ? "pr-12" : ""}`}
                    placeholder={placeholder}
                  />
                )}
                {suffix && (
                  <span className="absolute right-3 top-2.5 text-slate-500 text-sm sm:text-base">
                    {suffix}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => onSave(field)}
                  disabled={saving}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={onCancel}
                  disabled={saving}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-slate-900 text-sm sm:text-base">
                {value ? (
                  <>
                    {prefix}
                    {value}
                    {suffix}
                  </>
                ) : (
                  <span className="text-slate-400 italic">Not set</span>
                )}
              </p>
              <button
                onClick={() => onEdit(field, value)}
                className="opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity px-3 py-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// Account Content Component - Updated with delete account API
function AccountContent() {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") {
      setMessage("❌ Please type DELETE to confirm");
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(
          "✅ Account deletion initiated. You will be logged out shortly."
        );

        // Sign out and redirect after delay
        setTimeout(async () => {
          await signOut({ callbackUrl: "/" });
        }, 2000);
      } else {
        setMessage(`❌ ${data.error || "Failed to delete account"}`);
      }
    } catch (error) {
      setMessage("❌ Failed to delete account");
      console.error("Delete account error:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Account Management</h2>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg ${
            message.includes("✅")
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Account Information */}
      <div className="bg-slate-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Account Information
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="text-slate-700">Account Status</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Active
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="text-slate-700">Email Verified</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✓ Verified
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-red-800 mb-4">Danger Zone</h3>

        {!confirmDelete ? (
          <div>
            <p className="text-red-700 mb-4">
              Once you delete your account, there is no going back. This will
              permanently delete your profile, job history, messages, and all
              associated data.
            </p>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              className="px-6 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50"
            >
              Delete Account
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-red-700 font-medium">
              Are you absolutely sure? This action cannot be undone.
            </p>

            <div>
              <label className="block text-sm font-medium text-red-700 mb-2">
                Type &quot;DELETE&quot; to confirm:
              </label>
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                placeholder="DELETE"
                disabled={deleting}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteText !== "DELETE"}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {deleting ? "Deleting..." : "Permanently Delete Account"}
              </button>
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteText("");
                  setMessage("");
                }}
                disabled={deleting}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Services Content Component
function ServicesContent({ profile }: { profile: UserProfile }) {
  const [selectedServices, setSelectedServices] = useState<string[]>(
    profile.services || []
  );
  const [hourlyRate, setHourlyRate] = useState(profile.hourlyRate || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const AVAILABLE_SERVICES = [
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
    "General Repair",
    "Other",
  ];

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleServicesUpdate = async () => {
    if (selectedServices.length < 2) {
      setMessage("❌ Please select at least 2 services");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/handyman/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: selectedServices }),
      });

      if (response.ok) {
        setMessage("✅ Services updated successfully");
      } else {
        setMessage("❌ Failed to update services");
      }
    } catch (error) {
      setMessage("❌ Error updating services");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleRateUpdate = async () => {
    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate <= 0) {
      setMessage("❌ Please enter a valid hourly rate");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/handyman/rate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourlyRate }),
      });

      if (response.ok) {
        setMessage("✅ Hourly rate updated successfully");
      } else {
        setMessage("❌ Failed to update rate");
      }
    } catch (error) {
      setMessage("❌ Error updating rate");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900">Services & Pricing</h2>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg ${
            message.includes("✅")
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Hourly Rate */}
      <div className="bg-slate-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Hourly Rate
        </h3>
        <div className="flex items-end gap-4 max-w-md">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rate per Hour
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">$</span>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full pl-8 pr-12 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="50"
                min="1"
              />
              <span className="absolute right-3 top-2.5 text-slate-500">
                /hr
              </span>
            </div>
          </div>
          <button
            onClick={handleRateUpdate}
            disabled={saving}
            className="px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            Update
          </button>
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Average in your area: $45-75/hour
        </p>
      </div>

      {/* Services */}
      <div className="bg-slate-50 p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Services Offered
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedServices(AVAILABLE_SERVICES)}
              className="px-3 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => setSelectedServices([])}
              className="px-3 py-1 text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {AVAILABLE_SERVICES.map((service) => (
            <label
              key={service}
              className="flex items-center p-3 rounded-lg border border-slate-200 hover:bg-white cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedServices.includes(service)}
                onChange={() => toggleService(service)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="ml-3 text-slate-700 font-medium text-sm">
                {service}
              </span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Selected: {selectedServices.length} services
            {selectedServices.length < 2 && (
              <span className="text-red-600 ml-1">(Minimum 2 required)</span>
            )}
          </p>
          <button
            onClick={handleServicesUpdate}
            disabled={saving || selectedServices.length < 2}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Services"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Notifications Content Component - Updated with API integration
function NotificationsContent() {
  const [preferences, setPreferences] = useState({
    browser: true,
    sound: true,
    email: true,
    sms: false,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch current preferences
    const fetchPreferences = async () => {
      try {
        const response = await fetch("/api/notifications/preferences");
        const data = await response.json();

        if (data.success) {
          setPreferences(data.preferences);
        }
      } catch (error) {
        console.error("Failed to fetch preferences:", error);
        setMessage("❌ Failed to load notification preferences");
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleToggle = (key: string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleTimeChange = (key: string, value: string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("✅ Notification preferences updated successfully");
      } else {
        setMessage(`❌ ${data.error || "Failed to update preferences"}`);
      }
    } catch (error) {
      setMessage("❌ Error updating preferences");
      console.error("Notification preferences error:", error);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const ToggleSwitch = ({
    checked,
    onChange,
    disabled = false,
  }: {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled || loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 ${
        checked ? "bg-orange-500" : "bg-slate-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Notification Preferences
        </h2>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">
        Notification Preferences
      </h2>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg ${
            message.includes("✅")
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Notification Types */}
      <div className="bg-slate-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Notification Types
        </h3>
        <div className="space-y-4">
          {[
            {
              key: "browser",
              label: "Browser Notifications",
              desc: "Show desktop notifications in your browser",
            },
            {
              key: "sound",
              label: "Sound Alerts",
              desc: "Play notification sounds",
            },
            {
              key: "email",
              label: "Email Notifications",
              desc: "Receive updates via email",
            },
            {
              key: "sms",
              label: "SMS Notifications",
              desc: "Receive text message alerts",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 bg-white rounded-lg"
            >
              <div>
                <h4 className="font-medium text-slate-900">{item.label}</h4>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
              <ToggleSwitch
                checked={
                  preferences[item.key as keyof typeof preferences] as boolean
                }
                onChange={() => handleToggle(item.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-slate-50 p-6 rounded-xl">
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Payment Content Component
function PaymentContent() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Payment & Billing</h2>

      {/* Stripe Integration Status */}
      <div className="bg-slate-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Payment Account
        </h3>
        <div className="flex items-center justify-between p-4 bg-white rounded-lg">
          <div>
            <h4 className="font-medium text-slate-900">Stripe Integration</h4>
            <p className="text-sm text-slate-600">
              Your payment processing is handled securely by Stripe
            </p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Connected
          </span>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-slate-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Payment History
        </h3>
        <p className="text-slate-600 mb-4">
          View your recent transactions and payment history.
        </p>
        <button className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100">
          View Transaction History
        </button>
      </div>

      {/* Billing Address */}
      <div className="bg-slate-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Billing Information
        </h3>
        <p className="text-slate-600 mb-4">
          Manage your billing address and payment methods.
        </p>
        <div className="flex gap-3">
          <button className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100">
            Update Billing Address
          </button>
          <button className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100">
            Manage Payment Methods
          </button>
        </div>
      </div>
    </div>
  );
}
