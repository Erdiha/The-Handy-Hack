"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { NotificationButton } from "../NotificationButton";
import { useNotifications } from "@/contexts/NotificationContext";

interface NavigationItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const { unreadMessageCount } = useNotifications();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = session?.user?.email === "erdiha@gmail.com";

  // Handle scroll for navbar background
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle outside clicks for user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [mobileMenuOpen]);

  const getNavigationItems = (): NavigationItem[] => {
    if (!session) {
      return [
        { href: "/search", label: "Find Help", icon: "🔍" },
        { href: "/how-it-works", label: "How It Works", icon: "ℹ️" },
      ];
    }

    if (session.user.role === "customer") {
      return [
        { href: "/search", label: "Find Help", icon: "🔍" },
        { href: "/post-job", label: "Post Job", icon: "✏️" },
        {
          href: "/messages",
          label: "Messages",
          icon: "💬",
          badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
        },
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
      ];
    }

    return [
      { href: "/jobs", label: "Browse Jobs", icon: "🔍" },
      {
        href: "/messages",
        label: "Messages",
        icon: "💬",
        badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
      },
      { href: "/dashboard", label: "Dashboard", icon: "📊" },
    ];
  };

  const navigationItems = getNavigationItems();

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    await signOut({ callbackUrl: "/auth/signin" });
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Fixed Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-lg shadow-lg border-b border-orange-100"
            : "bg-orange-50/90 backdrop-blur-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href={session ? "/dashboard" : "/"}
              className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent hover:from-orange-700 hover:to-amber-700 transition-all duration-200 flex-shrink-0"
            >
              TheHandyHack
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-10">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-orange-100/70 hover:text-orange-600 flex items-center space-x-2 ${
                    pathname === item.href
                      ? "text-orange-600 bg-orange-100/70"
                      : "text-slate-700"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}

                  {pathname === item.href && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        opacity: { duration: 0.2 },
                        layout: { type: "spring", stiffness: 500, damping: 30 },
                      }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Desktop Right Section */}
            <div className="hidden lg:flex items-center space-x-4">
              {session ? (
                <>
                  <NotificationButton />

                  {/* User Menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-orange-100/70 transition-all duration-200"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {session.user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>

                      <div className="hidden xl:block text-left">
                        <div className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                          {session.user.name}
                        </div>
                        <div className="text-xs text-slate-500 capitalize">
                          {session.user.role}
                        </div>
                      </div>

                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          userMenuOpen ? "rotate-180" : ""
                        }`}
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
                      </svg>
                    </button>

                    {/* User Dropdown */}
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-[60]"
                        >
                          <div className="px-4 py-3 border-b border-slate-100">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold">
                                  {session.user.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800 text-sm">
                                  {session.user.name}
                                </div>
                                <div className="text-xs text-slate-500 capitalize">
                                  {session.user.role} Account
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="py-2">
                            <Link
                              href="/dashboard"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 transition-colors duration-150"
                            >
                              <span className="mr-3">👤</span>
                              View Dashboard
                            </Link>

                            <Link
                              href="/settings"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 transition-colors duration-150"
                            >
                              <span className="mr-3">⚙️</span>
                              Settings
                            </Link>

                            {isAdmin && (
                              <Link
                                href="/admin/support"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors duration-150"
                              >
                                <span className="mr-3">🛠️</span>
                                Support Admin
                              </Link>
                            )}

                            <hr className="my-2 border-slate-100" />

                            <button
                              onClick={handleSignOut}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                            >
                              <span className="mr-3">🚪</span>
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/auth/signin"
                    className="px-4 py-2 text-slate-700 hover:text-orange-600 font-medium transition-colors duration-200 rounded-lg hover:bg-orange-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Join Now
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Right Section */}
            <div className="flex items-center space-x-3 lg:hidden ">
              {session && <NotificationButton />}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="relative z-50 p-2 text-slate-700 hover:text-orange-600 hover:bg-orange-100/70 rounded-lg transition-all duration-200"
                aria-label="Toggle menu"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center">
                  <span
                    className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${
                      mobileMenuOpen ? "rotate-45 translate-y-0.5" : ""
                    }`}
                  />
                  <span
                    className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${
                      mobileMenuOpen ? "opacity-0" : "translate-y-1"
                    }`}
                  />
                  <span
                    className={`block w-6 h-0.5 bg-current transform transition duration-300 ease-in-out ${
                      mobileMenuOpen
                        ? "-rotate-45 -translate-y-0.5"
                        : "translate-y-2"
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay & Content */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={closeMobileMenu}
            />

            {/* Mobile Menu */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "tween",
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="fixed top-16 right-0 bottom-0 w-80 max-w-[85vw] bg-orange-50 shadow-2xl z-40 lg:hidden overflow-y-auto"
            >
              <div className="flex flex-col h-full">
                {/* Navigation */}
                <div className="flex-1 py-6">
                  <div className="space-y-1 px-4">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobileMenu}
                        className={`flex items-center justify-between px-4 py-4 rounded-lg font-medium transition-all duration-200 ${
                          pathname === item.href
                            ? "text-orange-600 bg-orange-100"
                            : "text-slate-700 hover:text-orange-600 hover:bg-orange-50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{item.icon}</span>
                          <span className="text-lg">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1">
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        )}
                      </Link>
                    ))}

                    {session && (
                      <Link
                        href="/how-it-works"
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-3 px-4 py-4 rounded-lg font-medium transition-all duration-200 ${
                          pathname === "/how-it-works"
                            ? "text-orange-600 bg-orange-100"
                            : "text-slate-700 hover:text-orange-600 hover:bg-orange-50"
                        }`}
                      >
                        <span className="text-xl">ℹ️</span>
                        <span className="text-lg">How It Works</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* User Section */}
                <div className="border-t border-slate-200 p-6 bg-slate-50">
                  {session ? (
                    <div className="space-y-4">
                      {/* User Info */}
                      <div className="flex items-center p-4 bg-white rounded-xl border border-orange-100">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-lg">
                            {session.user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-800 text-lg truncate">
                            {session.user.name}
                          </div>
                          <div className="text-sm text-slate-500 capitalize">
                            {session.user.role} Account
                          </div>
                        </div>
                      </div>

                      {/* Quick Links */}
                      <div className="space-y-2">
                        <Link
                          href="/dashboard"
                          onClick={closeMobileMenu}
                          className="flex items-center justify-between p-4 bg-white rounded-xl hover:bg-slate-50 transition-colors duration-150"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">👤</span>
                            <span className="font-medium text-slate-700 text-lg">
                              Dashboard
                            </span>
                          </div>
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>

                        <Link
                          href="/settings"
                          onClick={closeMobileMenu}
                          className="flex items-center justify-between p-4 bg-white rounded-xl hover:bg-slate-50 transition-colors duration-150"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">⚙️</span>
                            <span className="font-medium text-slate-700 text-lg">
                              Settings
                            </span>
                          </div>
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>

                        {isAdmin && (
                          <Link
                            href="/admin/support"
                            onClick={closeMobileMenu}
                            className="flex items-center justify-between p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors duration-150"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-xl">🛠️</span>
                              <span className="font-medium text-orange-600 text-lg">
                                Support Admin
                              </span>
                            </div>
                            <svg
                              className="w-5 h-5 text-orange-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </Link>
                        )}
                      </div>

                      <button
                        onClick={handleSignOut}
                        className="flex items-center justify-center w-full p-4 text-red-600 bg-white hover:bg-red-50 rounded-xl font-medium transition-colors duration-200 text-lg"
                      >
                        <span className="mr-3 text-xl">🚪</span>
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        href="/auth/signin"
                        onClick={closeMobileMenu}
                        className="block w-full text-center px-6 py-4 text-slate-700 bg-white hover:bg-slate-50 rounded-xl font-medium transition-colors duration-200 border border-slate-200 text-lg"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/signup"
                        onClick={closeMobileMenu}
                        className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-4 rounded-xl font-semibold text-center transition-all duration-200 text-lg"
                      >
                        Join Community
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Content Spacer */}
      <div className="h-16" />
    </>
  );
}
