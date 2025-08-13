"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "customer" | "handyman";
}

interface UserProfile {
  hasCompletedOnboarding: boolean;
  neighborhood?: string;
  phone?: string;
  bio?: string;
  services?: string[];
  hourlyRate?: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      checkOnboardingStatus();
    }
  }, [status, router]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);

        if (!data.hasCompletedOnboarding) {
          router.push("/onboarding");
        }
      }
    } catch (error) {
      console.error("Failed to check profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading dashboard</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) return null;

  const isHandyman = session.user.role === "handyman";
  const firstName = session.user.name?.split(" ")[0] || "User";

  return (
    <div className="min-h-[calc(100vh-5rem)]  md:pt-16 bg-orange-50">
      {isHandyman ? (
        <HandymanDashboard
          profile={profile}
          user={session.user as SessionUser}
          firstName={firstName}
        />
      ) : (
        <CustomerDashboard
          profile={profile}
          user={session.user as SessionUser}
          firstName={firstName}
        />
      )}
    </div>
  );
}

// HANDYMAN DASHBOARD - Clean & Focused
function HandymanDashboard({
  profile,
  user,
  firstName,
}: {
  profile: UserProfile;
  user: SessionUser;
  firstName: string;
}) {
  const todayEarnings = 245;
  const weeklyGoal = 800;
  const nextJob = {
    customer: "Sarah Martinez",
    service: "Kitchen Faucet Repair",
    time: "2:00 PM",
    location: "142 Pine St",
    payment: 85,
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 bg-orange-50">
      {/* Header */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 capitalize">
              Good morning, {firstName}
            </h1>
            <p className="text-slate-600 text-lg">
              Let&apos;s make today productive in {profile.neighborhood}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-slate-600 font-medium">Available</span>
            <Button
              variant="outline"
              className="ml-4 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Go Offline
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Primary Focus Area */}
        <motion.div
          className="lg:col-span-8 space-y-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Today's Earnings - Hero Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-2">
                  TODAY&apos;S EARNINGS
                </p>
                <h2 className="text-5xl font-bold text-slate-900">
                  ${todayEarnings}
                </h2>
                <p className="text-green-600 text-sm font-medium mt-2">
                  +18% from yesterday
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-sm">Weekly Goal</p>
                <p className="text-2xl font-semibold text-slate-700">
                  ${weeklyGoal}
                </p>
                <div className="w-32 h-2 bg-slate-200 rounded-full mt-2">
                  <div
                    className="h-2 bg-slate-900 rounded-full transition-all duration-500"
                    style={{ width: `${(todayEarnings / weeklyGoal) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-8 text-sm">
              <div>
                <span className="text-slate-500">Jobs Today</span>
                <span className="ml-2 font-semibold text-slate-900">3</span>
              </div>
              <div>
                <span className="text-slate-500">Rating</span>
                <span className="ml-2 font-semibold text-slate-900">4.9</span>
              </div>
              <div>
                <span className="text-slate-500">Response Rate</span>
                <span className="ml-2 font-semibold text-slate-900">98%</span>
              </div>
            </div>
          </div>

          {/* Next Job - Clean Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Next Job</h3>
              <span className="text-slate-500 text-sm">
                {nextJob.time} today
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-slate-900 text-lg">
                  {nextJob.customer}
                </h4>
                <p className="text-slate-600">{nextJob.service}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">
                  {nextJob.location}
                </span>
                <span className="text-xl font-bold text-slate-900">
                  ${nextJob.payment}
                </span>
              </div>

              <div className="flex space-x-3 pt-2">
                <Button className="flex-1 bg-slate-900 text-white hover:bg-slate-800">
                  Call Customer
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          className="lg:col-span-4 space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 justify-start">
                Update My Rate (${profile.hourlyRate}/hr)
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 justify-start"
              >
                Manage Services
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 justify-start"
              >
                Set Availability
              </Button>
            </div>
          </div>

          {/* This Week Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">This Week</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Earned</span>
                <span className="font-semibold text-slate-900">$1,340</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Jobs Completed</span>
                <span className="font-semibold text-slate-900">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Avg Job Value</span>
                <span className="font-semibold text-slate-900">$112</span>
              </div>
            </div>
          </div>

          {/* Profile Strength */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <h3 className="font-semibold mb-3">Profile Strength</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Excellent</span>
                <span>92%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-white h-2 rounded-full w-[92%]"></div>
              </div>
            </div>
            <p className="text-slate-300 text-sm">
              Add 2 more photos to reach 100%
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// CUSTOMER DASHBOARD - Clean & Focused
function CustomerDashboard({
  profile,
  user,
  firstName,
}: {
  profile: UserProfile;
  user: SessionUser;
  firstName: string;
}) {
  const hasBookings = false;
  const favoriteHandymen = [
    {
      name: "Mike Rodriguez",
      service: "Plumbing",
      available: true,
      rating: 4.9,
    },
    {
      name: "Carlos Martinez",
      service: "Painting",
      available: false,
      rating: 4.7,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 bg-orange-50">
      {/* Header */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-2 capitalize">
          Hi {firstName}, what needs fixing?
        </h1>
        <p className="text-slate-600 text-lg">
          Find trusted help in {profile.neighborhood}
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <motion.div
          className="lg:col-span-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {hasBookings ? (
            // Show current bookings
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                Your Current Booking
              </h2>
              {/* Booking details would go here */}
            </div>
          ) : (
            // Empty state - focus on finding help
            <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <div className="w-8 h-8 bg-slate-400 rounded-lg"></div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Ready to get something fixed?
                </h2>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Browse trusted handymen in your neighborhood or get emergency
                  help within 15 minutes.
                </p>

                <div className="space-y-3">
                  <Link href="/search" className="block">
                    <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 py-4 text-lg">
                      Find Local Help
                    </Button>
                  </Link>
                  <Button variant="danger" className="w-full py-4 text-lg">
                    Emergency Help (15 min)
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          className="lg:col-span-4 space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Your Trusted Pros */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">
              Your Trusted Pros
            </h3>

            {favoriteHandymen.length > 0 ? (
              <div className="space-y-3">
                {favoriteHandymen.map((handyman, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {handyman.name}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {handyman.service} • {handyman.rating}
                        </p>
                      </div>
                    </div>
                    {handyman.available ? (
                      <Button
                        size="sm"
                        className="bg-slate-900 text-white hover:bg-slate-800 text-xs px-3"
                      >
                        Book
                      </Button>
                    ) : (
                      <span className="text-slate-400 text-xs">Busy</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">
                Once you book handymen, your favorites will appear here.
              </p>
            )}
          </div>

          {/* Account Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Account</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Jobs</span>
                <span className="font-semibold text-slate-900">2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">This Month</span>
                <span className="font-semibold text-slate-900">$245</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Saved vs TaskRabbit</span>
                <span className="font-semibold text-green-600">~$89</span>
              </div>
            </div>
          </div>

          {/* Neighborhood Activity */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <h3 className="font-semibold mb-3">In Your Area</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-300">Jobs this week</span>
                <span>23</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Avg response</span>
                <span>18 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Available pros</span>
                <span>12</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
