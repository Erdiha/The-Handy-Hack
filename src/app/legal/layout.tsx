import Link from "next/link";
import { ReactNode } from "react";

interface LegalLayoutProps {
  children: ReactNode;
}

export default function LegalLayout({ children }: LegalLayoutProps) {
  const legalPages = [
    { href: "/legal/privacy", label: "Privacy Policy" },
    { href: "/legal/terms", label: "Terms of Service" },
    { href: "/legal/community-guidelines", label: "Community Guidelines" },
    { href: "/legal/safety", label: "Safety & Trust" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Mobile: Horizontal Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 lg:sticky lg:top-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Legal Information
              </h2>

              {/* Mobile: Horizontal scroll nav */}
              <nav className="lg:space-y-2">
                <div className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto pb-2 lg:pb-0">
                  {legalPages.map((page) => (
                    <Link
                      key={page.href}
                      href={page.href}
                      className="block px-3 py-2 text-sm text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200 whitespace-nowrap lg:whitespace-normal"
                    >
                      {page.label}
                    </Link>
                  ))}
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
