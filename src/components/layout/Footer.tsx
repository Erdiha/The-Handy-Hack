import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Company */}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-lg font-semibold text-white mb-3 sm:mb-4">
              Company
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-slate-300 hover:text-white transition-colors duration-200"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-slate-300 hover:text-white transition-colors duration-200"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-lg font-semibold text-white mb-3 sm:mb-4">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/community-guidelines"
                  className="text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/safety"
                  className="text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Safety &amp; Trust
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-span-1 sm:col-span-1">
            <h3 className="text-lg font-semibold text-white mb-3 sm:mb-4">
              Support
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/help"
                  className="text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Contact Support
                </Link>
              </li>
              <li>
                <Link
                  href="/report"
                  className="text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Report Issue
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="col-span-1 sm:col-span-1">
            <h3 className="text-lg font-semibold text-white mb-3 sm:mb-4">
              Community
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/neighborhoods"
                  className="text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Local Areas
                </Link>
              </li>
              <li>
                <Link
                  href="/success-stories"
                  className="text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Success Stories
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Community Blog
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-6 sm:pt-8 border-t border-slate-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo and Copyright */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <Link
                href="/"
                className="text-xl font-bold text-white hover:text-orange-400 transition-colors duration-200"
              >
                TheHandyHack
              </Link>
              <span className="text-slate-400 text-sm">
                &copy; {currentYear} TheHandyHack. All rights reserved.
              </span>
            </div>

            {/* Mission Statement */}
            <div className="text-center sm:text-right">
              <p className="text-slate-400 text-sm">
                Building stronger neighborhoods, one job at a time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
