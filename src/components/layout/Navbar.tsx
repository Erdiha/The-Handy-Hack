"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();
const pathname = usePathname();

  return (
    <motion.header
      className="bg-orange-50 backdrop-blur-md  sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {/* <div className="min-w-10 h-10  border-2  border-orange-500  rounded-xl flex items-center justify-center">
              <span className="text-black  font-bold text-lg px-1">THH</span>
            </div> */}
            <Link
              href={session ? "/dashboard" : "/"}
              className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent"
            >
              TheHandyHack
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/search"
              className={`px-4 py-2 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 font-medium ${
                pathname === "/search"
                  ? "text-orange-600 bg-orange-50"
                  : "text-slate-700"
              }`}
            >
              Find Help
            </Link>
            <Link
              href="/messages"
              className={`px-4 py-2 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 font-medium ${
                pathname === "/messages"
                  ? "text-orange-600 bg-orange-50"
                  : "text-slate-700"
              }`}
            >
              Messages
            </Link>
            {session?.user.role !== "handyman" && (
              <Link
                href="/jobs"
                className={`px-4 py-2 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 font-medium ${
                  pathname === "/jobs"
                    ? "text-orange-600 bg-orange-50"
                    : "text-slate-700"
                }`}
              >
                Jobs
              </Link>
            )}
            <Link
              href="/how-it-works"
              className={`px-4 py-2 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 font-medium ${
                pathname === "/how-it-works"
                  ? "text-orange-600 bg-orange-50"
                  : "text-slate-700"
              }`}
            >
              How It Works
            </Link>
          </nav>

          {/* Desktop CTA Buttons - Dynamic based on auth */}
          <div className="hidden md:flex items-center space-x-3">
            {session ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {session.user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-slate-700 font-medium">
                    {session.user.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  className="px-4 py-2 text-slate-700 hover:text-orange-600 font-medium transition-colors duration-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
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
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 block"
                  >
                    Join Community
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200"
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

        {/* Mobile menu */}
        <motion.div
          initial={false}
          animate={isMenuOpen ? "open" : "closed"}
          variants={{
            open: { height: "auto", opacity: 1 },
            closed: { height: 0, opacity: 0 },
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 space-y-2 border-t border-orange-100">
            <Link
              href="/search"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-3 hover:text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors duration-200 ${
                pathname === "/search"
                  ? "text-orange-600 bg-orange-50"
                  : "text-slate-700"
              }`}
            >
              Find Help
            </Link>
            <Link
              href="/messages"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-3 hover:text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors duration-200 ${
                pathname === "/messages"
                  ? "text-orange-600 bg-orange-50"
                  : "text-slate-700"
              }`}
            >
              Messages
            </Link>
            {session?.user.role !== "handyman" && (
              <Link
                href="/jobs"
                className={`px-4 py-2 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 font-medium ${
                  pathname === "/jobs"
                    ? "text-orange-600 bg-orange-50"
                    : "text-slate-700"
                }`}
              >
                Jobs
              </Link>
            )}
            <Link
              href="/how-it-works"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-3 hover:text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors duration-200 ${
                pathname === "/how-it-works"
                  ? "text-orange-600 bg-orange-50"
                  : "text-slate-700"
              }`}
            >
              How It Works
            </Link>
            <Link
              href="/dashboard"
              className="block w-full text-left px-4 py-3 text-slate-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors duration-200"
            >
              Dashboard
            </Link>
            <div className="pt-4 space-y-3 border-t border-orange-100">
              {session ? (
                <>
                  <div className="flex items-center px-4 py-3">
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

                  <button
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    className="block w-full text-left px-4 py-3 text-slate-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="block w-full text-left px-4 py-3 text-slate-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-lg font-semibold text-center"
                  >
                    Join Community
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
