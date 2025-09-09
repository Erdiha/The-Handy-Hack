import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - TheHandyHack",
  description:
    "How we collect, use, and protect your personal information on TheHandyHack platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-none">
      {/* Header */}
      <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Introduction */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Introduction
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          TheHandyHack (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is
          committed to protecting your privacy. This Privacy Policy explains how
          we collect, use, disclose, and safeguard your information when you use
          our neighborhood helper marketplace platform. By using our service,
          you agree to the collection and use of information in accordance with
          this policy.
        </p>
      </section>

      {/* Information We Collect */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Information We Collect
        </h2>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Personal Information
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>Name, email address, and phone number</li>
          <li>Profile information and bio</li>
          <li>Location and neighborhood information</li>
          <li>Payment information (processed securely through Stripe)</li>
          <li>Identity verification documents (for handymen)</li>
        </ul>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Usage Information
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>Job postings, responses, and communications</li>
          <li>Reviews and ratings</li>
          <li>Platform usage patterns and preferences</li>
          <li>Device information and IP address</li>
        </ul>
      </section>

      {/* How We Use Your Information */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          How We Use Your Information
        </h2>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700">
          <li>Connect customers with local handymen</li>
          <li>Process payments and transactions</li>
          <li>Verify user identity for safety</li>
          <li>Send notifications about job updates</li>
          <li>Improve our platform and services</li>
          <li>Provide customer support</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      {/* Information Sharing */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Information Sharing
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          We do not sell your personal information. We may share your
          information in the following circumstances:
        </p>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700">
          <li>
            <strong>With other users:</strong> Profile information visible to
            facilitate connections
          </li>
          <li>
            <strong>With service providers:</strong> Stripe for payments, email
            services for notifications
          </li>
          <li>
            <strong>For safety:</strong> With law enforcement when required by
            law
          </li>
          <li>
            <strong>Business transfers:</strong> In case of merger or
            acquisition
          </li>
        </ul>
      </section>

      {/* Data Security */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Data Security
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          We implement industry-standard security measures including encryption,
          secure servers, and regular security audits. Payment information is
          processed securely through Stripe and never stored on our servers.
          However, no method of transmission over the internet is 100% secure.
        </p>
      </section>

      {/* Your Rights */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Your Rights
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          You have the right to:
        </p>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700">
          <li>Access and update your personal information</li>
          <li>Request deletion of your account and data</li>
          <li>Opt out of marketing communications</li>
          <li>Request a copy of your data</li>
          <li>File a complaint with supervisory authorities</li>
        </ul>
      </section>

      {/* Cookies */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Cookies and Tracking
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          We use essential cookies to maintain your session and provide core
          functionality. We do not use tracking cookies or sell data to
          advertisers. You can disable cookies in your browser settings, though
          this may affect platform functionality.
        </p>
      </section>

      {/* Children's Privacy */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Children&apos;s Privacy
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          Our service is not intended for users under 18 years of age. We do not
          knowingly collect personal information from children under 18. If you
          become aware that a child has provided us with personal information,
          please contact us immediately.
        </p>
      </section>

      {/* Changes to Policy */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Changes to This Policy
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          We may update this Privacy Policy from time to time. We will notify
          you of any significant changes by posting the new policy on this page
          and updating the &quot;Last updated&quot; date. Continued use of our
          service constitutes acceptance of the updated policy.
        </p>
      </section>

      {/* Contact */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Contact Us
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          If you have questions about this Privacy Policy or our data practices,
          please contact us:
        </p>
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-50 rounded-lg">
          <p className="text-sm sm:text-base text-slate-700">
            <strong>Email:</strong> privacy@thehandyhack.com
            <br />
            <strong>Address:</strong> [Your Organization Address]
            <br />
            <strong>Phone:</strong> [Your Phone Number]
          </p>
        </div>
      </section>
    </div>
  );
}
