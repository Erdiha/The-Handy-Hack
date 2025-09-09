"use client";

import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="h-[calc(100vh-5rem)] bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render homepage if user is authenticated (redirect is happening)
  if (status === "authenticated") {
    return null;
  }
  return (
    <div className="h-[calc(100vh-5rem)] bg-orange-50 overflow-hidden">
      {/* Perfect Fit - No Scroll */}
      <motion.section
        className="h-full flex items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-16 right-16 w-64 h-64 bg-gradient-to-bl from-orange-200 to-amber-200 rounded-full opacity-40"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.4, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          />
          <motion.div
            className="absolute bottom-16 left-16 w-48 h-48 bg-gradient-to-tr from-blue-200 to-sky-200 rounded-full opacity-30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center h-full">
            {/* Left: Main Content */}
            <div>
              <motion.div
                className="inline-block bg-orange-200 text-orange-800 px-4 py-2 rounded-full text-sm font-medium mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                🏠 Your neighborhood&apos;s helping hands
              </motion.div>

              <motion.h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800 leading-tight mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Need something
                <span className="block text-orange-600">
                  fixed around here?
                </span>
              </motion.h1>

              <motion.p
                className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                Connect with trusted neighbors who know their stuff. Real local
                folks doing honest work.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <Button
                  size="lg"
                  className="bg-orange-500 text-white hover:bg-orange-600 font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  Find Local Help
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-orange-300 text-orange-700 hover:bg-orange-100 font-semibold px-8 py-4 text-lg rounded-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  Lend a Hand
                </Button>
              </motion.div>
            </div>

            {/* Right: Key Stats */}
            <div className="space-y-6">
              <motion.div
                className="bg-white/80 backdrop-blur-sm p-4 md:p-6 rounded-2xl border border-orange-100 shadow-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-slate-600 font-medium">
                    Platform Fee
                  </span>
                </div>
                <div className="md:text-3xl text-2xl font-bold text-slate-900">
                  Only 2%
                </div>
              </motion.div>

              <motion.div
                className="bg-white/80 backdrop-blur-sm p-4 md:p-6 rounded-2xl border border-blue-100 shadow-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-600 font-medium">
                    Response Time
                  </span>
                </div>
                <div className="md:text-3xl text-2xl font-bold text-slate-900">
                  Under 24hr
                </div>
              </motion.div>

              <motion.div
                className="bg-white/80 backdrop-blur-sm p-4  rounded-2xl border border-green-100 shadow-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-slate-600 font-medium">
                    Local Focus
                  </span>
                </div>
                <div className="md:text-3xl text-2xl  font-bold text-slate-900">
                  100% Neighbors
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
