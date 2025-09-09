import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Guidelines - TheHandyHack",
  description:
    "Community standards and guidelines for respectful interactions on TheHandyHack platform.",
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="max-w-none">
      {/* Header */}
      <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Community Guidelines
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
          Our Community Values
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          TheHandyHack is built on the foundation of neighborly trust and mutual
          respect. These guidelines help ensure our community remains a safe,
          welcoming place for everyone to connect and collaborate.
        </p>
        <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm sm:text-base text-blue-800">
            <strong>Our Mission:</strong> To build stronger neighborhoods by
            connecting people who need help with trusted local handymen who can
            provide it.
          </p>
        </div>
      </section>

      {/* Core Principles */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Core Principles
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-base sm:text-lg font-medium text-green-800 mb-2">
              🤝 Respect
            </h3>
            <p className="text-sm sm:text-base text-green-700">
              Treat every community member with kindness and consideration,
              regardless of background or experience level.
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-base sm:text-lg font-medium text-orange-800 mb-2">
              🔒 Safety
            </h3>
            <p className="text-sm sm:text-base text-orange-700">
              Prioritize the safety and security of all community members
              through proper verification and safe practices.
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-base sm:text-lg font-medium text-blue-800 mb-2">
              💎 Quality
            </h3>
            <p className="text-sm sm:text-base text-blue-700">
              Commit to delivering honest, quality work and accurate
              representations of skills and services.
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-base sm:text-lg font-medium text-purple-800 mb-2">
              🏠 Community
            </h3>
            <p className="text-sm sm:text-base text-purple-700">
              Foster local connections and support neighborhood growth through
              collaborative partnerships.
            </p>
          </div>
        </div>
      </section>

      {/* Communication Standards */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Communication Standards
        </h2>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Professional Communication
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>Use clear, respectful language in all interactions</li>
          <li>Respond to messages and inquiries promptly</li>
          <li>Be honest about availability and capabilities</li>
          <li>Provide detailed, accurate job descriptions and quotes</li>
          <li>Keep communication on-platform for safety and record-keeping</li>
        </ul>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Prohibited Communication
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700">
          <li>Harassment, threats, or abusive language</li>
          <li>Discriminatory comments based on race, gender, religion, etc.</li>
          <li>Spam, unsolicited advertising, or promotional content</li>
          <li>Sharing personal contact information in initial messages</li>
          <li>Attempting to conduct business outside the platform</li>
        </ul>
      </section>

      {/* Job Posting Guidelines */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Job Posting Guidelines
        </h2>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          For Customers
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>Provide detailed, accurate job descriptions</li>
          <li>Include relevant photos when helpful</li>
          <li>Set realistic budgets and timelines</li>
          <li>Specify any special requirements or constraints</li>
          <li>Be available for questions and clarifications</li>
          <li>Ensure work area is safe and accessible</li>
        </ul>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          For Handymen
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700">
          <li>Only respond to jobs within your skill set</li>
          <li>Provide realistic quotes and timelines</li>
          <li>Ask clarifying questions when needed</li>
          <li>Be upfront about any limitations or requirements</li>
          <li>Maintain appropriate licensing and insurance</li>
          <li>Follow up professionally on proposals</li>
        </ul>
      </section>

      {/* Safety Guidelines */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Safety Guidelines
        </h2>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Before Meeting
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>Verify identity through platform verification systems</li>
          <li>Review ratings and feedback from previous interactions</li>
          <li>Communicate project details clearly before meeting</li>
          <li>Schedule meetings during daylight hours when possible</li>
          <li>Let someone know about your appointment</li>
        </ul>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          During Work
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>Use proper safety equipment and follow safety protocols</li>
          <li>Respect personal property and maintain clean work areas</li>
          <li>Document work progress with photos when appropriate</li>
          <li>Communicate any issues or changes immediately</li>
          <li>Report unsafe conditions or suspicious behavior</li>
        </ul>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Emergency Procedures
        </h3>
        <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm sm:text-base text-red-800 mb-2">
            <strong>In case of emergency:</strong>
          </p>
          <ul className="list-disc pl-4 sm:pl-6 space-y-1 text-sm sm:text-base text-red-700">
            <li>Call 911 for immediate safety concerns</li>
            <li>Report incidents to platform support immediately</li>
            <li>Document what happened with photos if safe to do so</li>
            <li>Preserve evidence and communication records</li>
          </ul>
        </div>
      </section>

      {/* Review System */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Review and Rating System
        </h2>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Honest Reviews
        </h3>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          Our review system helps build trust within the community. All reviews
          should be:
        </p>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>Based on actual experiences and interactions</li>
          <li>Honest, fair, and constructive</li>
          <li>Focused on work quality and professionalism</li>
          <li>Free from personal attacks or irrelevant details</li>
          <li>Respectful even when describing negative experiences</li>
        </ul>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Review Guidelines
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700">
          <li>Leave reviews within 30 days of job completion</li>
          <li>Include specific details about the work performed</li>
          <li>Mention both strengths and areas for improvement</li>
          <li>
            Avoid posting reviews for work you did not directly experience
          </li>
          <li>Do not offer or accept payment for positive reviews</li>
        </ul>
      </section>

      {/* Reporting and Enforcement */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Reporting and Enforcement
        </h2>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          How to Report Issues
        </h3>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          If you encounter behavior that violates these guidelines:
        </p>
        <ol className="list-decimal pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>Use the in-platform reporting tools</li>
          <li>Provide detailed information about the incident</li>
          <li>Include screenshots or documentation when relevant</li>
          <li>Follow up with our support team if needed</li>
        </ol>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Enforcement Actions
        </h3>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          Violations may result in:
        </p>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700">
          <li>Warning and education about community standards</li>
          <li>Temporary suspension of account privileges</li>
          <li>Permanent removal from the platform</li>
          <li>Reporting to law enforcement for illegal activities</li>
        </ul>
      </section>

      {/* Contact */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Questions and Support
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          If you have questions about these guidelines or need to report an
          issue:
        </p>
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-50 rounded-lg">
          <p className="text-sm sm:text-base text-slate-700">
            <strong>Support Email:</strong> support@thehandyhack.com
            <br />
            <strong>Safety Concerns:</strong> safety@thehandyhack.com
            <br />
            <strong>Community Team:</strong> community@thehandyhack.com
          </p>
        </div>
      </section>
    </div>
  );
}
