// src/app/auth/signin/page.tsx
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { signIn, getSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

interface VerificationStatus {
  type: "success" | "error" | null;
  message: string;
  email?: string;
}

function SignInContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>({
      type: null,
      message: "",
    });

  const router = useRouter();
  const searchParams = useSearchParams();
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const verified = searchParams.get("verified");
    const error = searchParams.get("error");
    const emailParam = searchParams.get("email");
    const shouldSignOut = searchParams.get("signout");

    // Handle auto sign-out for verification
    if (shouldSignOut === "true") {
      signOut({ redirect: false }).then(() => {
        // After signing out, show verification success
        if (verified === "true") {
          setVerificationStatus({
            type: "success",
            message:
              "Email verified successfully! Please sign in with your new account.",
            email: emailParam || undefined,
          });

          // Auto-fill email if provided
          if (emailParam) {
            setEmail(decodeURIComponent(emailParam));
            setTimeout(() => {
              const passwordField = document.getElementById(
                "password"
              ) as HTMLInputElement;
              passwordField?.focus();
            }, 100);
          }
        }
      });
    } else {
      // Normal verification status handling (when no signout needed)
      if (verified === "true") {
        setVerificationStatus({
          type: "success",
          message: "Email verified successfully! You can now sign in.",
          email: emailParam || undefined,
        });

        if (emailParam) {
          setEmail(decodeURIComponent(emailParam));
          setTimeout(() => {
            const passwordField = document.getElementById(
              "password"
            ) as HTMLInputElement;
            passwordField?.focus();
          }, 100);
        }
      } else if (error) {
        let errorMessage = "";
        switch (error) {
          case "invalid-token":
            errorMessage =
              "Invalid verification link. Please request a new verification email.";
            break;
          case "expired-token":
            errorMessage =
              "Verification link has expired. Please request a new verification email.";
            break;
          case "verification-failed":
            errorMessage =
              "Email verification failed. Please try again or contact support.";
            break;
          default:
            errorMessage = "Verification error occurred. Please try again.";
        }

        setVerificationStatus({
          type: "error",
          message: errorMessage,
        });
      }
    }

    // Clear URL params after reading them
    if (verified || error || shouldSignOut) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkAuth = async () => {
      const shouldSignOut = searchParams.get("signout");
      if (!shouldSignOut) {
        const session = await getSession();
        if (session?.user) {
          router.push("/dashboard");
        }
      }
    };
    checkAuth();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password. Please check your credentials.");
        } else {
          setError("Sign in failed. Please try again.");
        }
      } else if (result?.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismissVerificationStatus = () => {
    setVerificationStatus({ type: null, message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Welcome back
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Sign in to your TheHandyHack account
          </p>
        </div>

        {/* Verification Status Message */}
        {verificationStatus.type && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-xl border-2 ${
              verificationStatus.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <span className="text-xl">
                  {verificationStatus.type === "success" ? "✅" : "❌"}
                </span>
                <div>
                  <p className="font-semibold text-sm">
                    {verificationStatus.type === "success"
                      ? "Email Verified!"
                      : "Verification Failed"}
                  </p>
                  <p className="text-sm mt-1">{verificationStatus.message}</p>
                </div>
              </div>
              <button
                onClick={dismissVerificationStatus}
                className={`text-sm underline hover:no-underline ${
                  verificationStatus.type === "success"
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}

        {/* Sign In Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Email Address
              </label>
              <input
                ref={emailInputRef}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white/70 text-slate-900 placeholder-slate-500"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white/70 text-slate-900 placeholder-slate-500"
                placeholder="Enter your password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-4">
            <p className="text-slate-600 text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-semibold text-orange-600 hover:text-orange-700 transition-colors duration-200"
              >
                Sign up here
              </Link>
            </p>

            <p className="text-slate-500 text-xs">
              Having trouble?{" "}
              <Link
                href="/help"
                className="text-orange-600 hover:text-orange-700 underline"
              >
                Get help
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
          <div className="animate-pulse text-slate-600">Loading...</div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
