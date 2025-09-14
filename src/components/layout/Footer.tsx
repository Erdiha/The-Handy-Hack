"use client";
import Link from "next/link";
import { useState } from "react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const footerSections = [
    {
      id: "platform",
      title: "Platform",
      links: [
        { href: "/search", label: "Find Help" },
        { href: "/post-job", label: "Post a Job" },
        { href: "/how-it-works", label: "How It Works" },
        { href: "/how-it-works#pricing", label: "Pricing" },
      ],
    },
    {
      id: "company",
      title: "Company",
      links: [
        { href: "/company?tab=about", label: "About Us" },
        { href: "/company?tab=careers", label: "Careers" },
        { href: "/company?tab=press", label: "Press" },
        // { href: "/contact", label: "Contact" }, // Keep as separate page
      ],
    },
    {
      id: "support",
      title: "Support",
      links: [
        { href: "/help", label: "Help Center" },
        { href: "/help?tab=account", label: "Safety & Trust" },
        { href: "/help?tab=contact&type=safety", label: "Report a Problem" },
        { href: "/help?tab=account#insurance", label: "Insurance Coverage" },
      ],
    },
    {
      id: "legal",
      title: "Legal",
      links: [
        { href: "/legal/terms", label: "Terms of Service" },
        { href: "/legal/privacy", label: "Privacy Policy" },
        { href: "/legal/community-guidelines", label: "Community Guidelines" },
        // { href: "/legal/cookies", label: "Cookie Policy" },
      ],
    },
  ];

  return (
    <footer className="bg-slate-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Accordion Style (< lg screens) */}
        <div className="lg:hidden py-8">
          <div className="space-y-1">
            {footerSections.map((section) => (
              <div
                key={section.id}
                className="border-b border-slate-700 last:border-b-0"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="text-lg font-medium text-white">
                    {section.title}
                  </span>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                      openSections[section.id] ? "rotate-180" : ""
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

                {openSections[section.id] && (
                  <div className="pb-4 pl-2">
                    <ul className="space-y-3">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="text-slate-300 hover:text-white transition-colors duration-200 text-base block py-1"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Grid Style (lg+ screens) */}
        <div className="hidden lg:block py-12">
          <div className="grid grid-cols-4 gap-8 mb-12">
            {footerSections.map((section) => (
              <div key={section.id}>
                <h3 className="text-lg font-semibold text-white mb-6">
                  {section.title}
                </h3>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-slate-300 hover:text-white transition-colors duration-200 text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section - All Screens */}
        <div className="border-t border-slate-700 py-6 lg:py-8">
          <div className="flex flex-col items-center space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            {/* Logo */}
            <div className="order-1 lg:order-1">
              <Link
                href="/"
                className="text-xl lg:text-2xl font-bold text-white hover:text-orange-400 transition-colors duration-200"
              >
                TheHandyHack
              </Link>
            </div>

            {/* Mission Statement - Mobile Center, Desktop Right */}
            <div className="order-2 lg:order-3 text-center lg:text-right">
              <p className="text-slate-400 text-sm lg:text-base max-w-xs">
                Building stronger neighborhoods, one job at a time.
              </p>
            </div>

            {/* Copyright - Mobile Bottom, Desktop Center */}
            <div className="order-3 lg:order-2 text-center">
              <p className="text-slate-500 text-xs lg:text-sm">
                © {currentYear} TheHandyHack. All rights reserved.
              </p>
            </div>
          </div>

          {/* Social Links - Mobile Only */}
          <div className="lg:hidden mt-6 pt-6 border-t border-slate-700">
            <div className="flex justify-center space-x-6">
              <Link
                href="#"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <span className="sr-only">Facebook</span>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </Link>
              <Link
                href="#"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </Link>
              <Link
                href="#"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <span className="sr-only">Instagram</span>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.618 5.367 11.986 11.988 11.986s11.987-5.368 11.987-11.986C24.014 5.367 18.635.001 12.017.001zM8.449 16.988c-2.508 0-4.54-2.033-4.54-4.54s2.032-4.54 4.54-4.54c2.508 0 4.527 2.032 4.527 4.54s-2.019 4.54-4.527 4.54zm7.424-10.424c-.588 0-1.063-.475-1.063-1.063s.475-1.063 1.063-1.063 1.063.475 1.063 1.063-.475 1.063-1.063 1.063z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
