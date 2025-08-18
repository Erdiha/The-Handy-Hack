"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { NotificationButton } from "../NotificationButton";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  // Clean business logic - different nav items for different user types
  const getNavigationItems = () => {
    if (!session) {
      return [
        { href: "/search", label: "Find Help" },
        { href: "/how-it-works", label: "How It Works" },
      ];
    }

    if (session.user.role === "customer") {
      return [
        { href: "/search", label: "Find Help" },
        { href: "/post-job", label: "Post Job" },
        { href: "/messages", label: "Messages" },
        { href: "/dashboard", label: "Dashboard" },
      ];
    }

    // Handyman navigation
    return [
      { href: "/jobs", label: "Browse Jobs" },
      { href: "/messages", label: "Messages" },
      { href: "/dashboard", label: "Dashboard" },
    ];
  };

  const navigationItems = getNavigationItems();
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <motion.header
      className="bg-orange-50 backdrop-blur-md sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              href={session ? "/dashboard" : "/"}
              className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent hover:from-orange-700 hover:to-amber-700 transition-all duration-200"
            >
              TheHandyHack
            </Link>
          </motion.div>

          {/* Desktop Navigation - Clean & Grouped */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-orange-100 hover:text-orange-600 ${
                  pathname === item.href
                    ? "text-orange-600 bg-orange-100"
                    : "text-slate-700"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Section - Clean & Minimal */}
          <div className="flex items-center space-x-4">
            {/* Notifications - Only for logged in users */}
            {session && (
              <div className="hidden sm:block">
                <NotificationButton />
              </div>
            )}

            {/* User Profile or Auth */}
            {session ? (
              <div className="hidden md:flex items-center space-x-3">
                {/* User Avatar & Info */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {session.user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden xl:block">
                    <div className="text-sm font-medium text-slate-700">
                      {session.user.name}
                    </div>
                    <div className="text-xs text-slate-500 capitalize">
                      {session.user.role}
                    </div>
                  </div>
                </div>

                {/* Sign Out */}
                <div className="w-[1px] h-10 bg-orange-200 hidden md:inline-block"></div>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  className="text-slate-500 hover:text-orange-600 font-medium transition-colors duration-200 text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              /* Auth Buttons for Non-logged Users */
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-slate-700 hover:text-orange-600 font-medium transition-colors duration-200"
                >
                  Sign In
                </Link>
                <motion.div
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href="/auth/signup"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Join
                  </Link>
                </motion.div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors duration-200"
              aria-label="Menu"
            >
              <motion.div
                animate={isMenuOpen ? "open" : "closed"}
                className="w-6 h-6 flex flex-col justify-center space-y-1"
              >
                <motion.span
                  variants={{
                    closed: { rotate: 0, y: 0 },
                    open: { rotate: 45, y: 6 },
                  }}
                  className="w-6 h-0.5 bg-current transform transition-all duration-200"
                />
                <motion.span
                  variants={{
                    closed: { opacity: 1 },
                    open: { opacity: 0 },
                  }}
                  className="w-6 h-0.5 bg-current transition-all duration-200"
                />
                <motion.span
                  variants={{
                    closed: { rotate: 0, y: 0 },
                    open: { rotate: -45, y: -6 },
                  }}
                  className="w-6 h-0.5 bg-current transform transition-all duration-200"
                />
              </motion.div>
            </button>
          </div>
        </div>

        {/* Mobile Menu - Consistent with desktop logic */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden overflow-hidden bg-orange-50 border-t border-orange-200"
            >
              <div className="py-4">
                {/* Navigation Links */}
                <div className="space-y-1 px-4">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                        pathname === item.href
                          ? "text-orange-600 bg-orange-100"
                          : "text-slate-700 hover:text-orange-600 hover:bg-orange-100"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* How It Works - Only show if logged in */}
                {session && (
                  <div className="px-4 mt-2">
                    <Link
                      href="/how-it-works"
                      onClick={closeMenu}
                      className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                        pathname === "/how-it-works"
                          ? "text-orange-600 bg-orange-100"
                          : "text-slate-700 hover:text-orange-600 hover:bg-orange-100"
                      }`}
                    >
                      How It Works
                    </Link>
                  </div>
                )}

                {/* User Section */}
                <div className="pt-4 border-t border-orange-200 mt-4">
                  {session ? (
                    <div className="space-y-3 px-4">
                      {/* User Info */}
                      <div className="flex items-center px-4 py-3 bg-orange-100 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mr-3">
                          <span className="text-white font-bold">
                            {session.user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {session.user.name}
                          </div>
                          <div className="text-sm text-slate-500 capitalize">
                            {session.user.role}
                          </div>
                        </div>
                      </div>

                      {/* Mobile Actions Row */}
                      <div className="flex items-center justify-between px-4 py-3 bg-orange-100 rounded-lg">
                        {/* Notifications on left */}
                        <div className="flex items-center">
                          <NotificationButton />
                          <span className="ml-2 text-sm text-slate-600">
                            Notifications
                          </span>
                        </div>

                        {/* Sign Out on right */}
                        <button
                          onClick={() => {
                            signOut({ callbackUrl: "/auth/signin" });
                            closeMenu();
                          }}
                          className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors duration-200 text-sm"
                        >
                          <span className="mr-1">🚪</span>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 px-4">
                      <Link
                        href="/auth/signin"
                        onClick={closeMenu}
                        className="block w-full text-center px-4 py-3 text-slate-700 hover:text-orange-600 hover:bg-orange-100 rounded-lg font-medium transition-colors duration-200"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/signup"
                        onClick={closeMenu}
                        className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-xl font-semibold text-center"
                      >
                        Join Community
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
