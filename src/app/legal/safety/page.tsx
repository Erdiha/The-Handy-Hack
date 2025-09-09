import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safety & Trust - TheHandyHack",
  description:
    "Safety measures, trust features, and security protocols on TheHandyHack platform.",
};

export default function SafetyPage() {
  return (
    <div className="max-w-none">
      {/* Header */}
      <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Safety & Trust
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
          Our Commitment to Safety
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          Safety is at the heart of everything we do at TheHandyHack. We have
          implemented multiple layers of protection to ensure our community
          remains secure, trustworthy, and reliable for all users.
        </p>
        <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm sm:text-base text-green-800">
            <strong>Our Promise:</strong> We continuously invest in safety
            measures, user verification, and support systems to build the most
            trusted neighborhood helper marketplace.
          </p>
        </div>
      </section>

      {/* Trust & Safety Features */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Trust & Safety Features
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="p-4 sm:p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-blue-800">
                Identity Verification
              </h3>
            </div>
            <p className="text-sm sm:text-base text-blue-700">
              All handymen undergo identity verification including government ID
              checks and phone number confirmation before joining our platform.
            </p>
          </div>

          <div className="p-4 sm:p-6 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">🔒</span>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-purple-800">
                Secure Payments
              </h3>
            </div>
            <p className="text-sm sm:text-base text-purple-700">
              All payments are processed securely through Stripe with escrow
              protection. Funds are held safely until work is completed to
              satisfaction.
            </p>
          </div>

          <div className="p-4 sm:p-6 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">⭐</span>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-orange-800">
                Review System
              </h3>
            </div>
            <p className="text-sm sm:text-base text-orange-700">
              Transparent review and rating system helps build trust and
              accountability within our community of neighbors and handymen.
            </p>
          </div>

          <div className="p-4 sm:p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">🚨</span>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-red-800">
                24/7 Support
              </h3>
            </div>
            <p className="text-sm sm:text-base text-red-700">
              Our support team is available around the clock to address safety
              concerns, resolve disputes, and assist with any platform issues.
            </p>
          </div>
        </div>
      </section>

      {/* Verification Process */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Handyman Verification Process
        </h2>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Required Verification
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>
            <strong>Government ID:</strong> Valid driver&apos;s license or
            state-issued ID verification
          </li>
          <li>
            <strong>Phone Verification:</strong> SMS confirmation of mobile
            phone number
          </li>
          <li>
            <strong>Email Verification:</strong> Confirmed email address for all
            communications
          </li>
          <li>
            <strong>Profile Completion:</strong> Detailed bio, skills, and
            service area information
          </li>
        </ul>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Additional Verification (Recommended)
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>
            <strong>Background Check:</strong> Criminal background screening
            where legally permitted
          </li>
          <li>
            <strong>Business License:</strong> Verification of required local
            business licenses
          </li>
          <li>
            <strong>Insurance Certificate:</strong> Proof of liability insurance
            coverage
          </li>
          <li>
            <strong>References:</strong> Professional or customer references
            from previous work
          </li>
        </ul>

        <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm sm:text-base text-yellow-800">
            <strong>Note:</strong> Verification requirements may vary by
            location and local regulations. Enhanced verification badges are
            displayed on handyman profiles when completed.
          </p>
        </div>
      </section>

      {/* Payment Security */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Payment Security
        </h2>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Escrow Protection
        </h3>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          Our escrow system protects both customers and handymen:
        </p>
        <ol className="list-decimal pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>Customer authorizes payment when hiring a handyman</li>
          <li>Funds are securely held in escrow during work completion</li>
          <li>
            Payment is released when customer confirms satisfactory completion
          </li>
          <li>
            Automatic release occurs after 48 hours if no issues are reported
          </li>
          <li>Dispute resolution available if problems arise</li>
        </ol>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Secure Processing
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700">
          <li>
            All payments processed through Stripe, a PCI-compliant payment
            processor
          </li>
          <li>Credit card information is never stored on our servers</li>
          <li>Bank-level encryption protects all financial transactions</li>
          <li>Regular security audits ensure continued protection</li>
        </ul>
      </section>

      {/* Safety Best Practices */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Safety Best Practices
        </h2>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          For Customers
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>
            Review handyman profiles, ratings, and previous customer feedback
          </li>
          <li>Communicate project details clearly before work begins</li>
          <li>Be present or designate a trusted representative during work</li>
          <li>Document work progress with photos when appropriate</li>
          <li>Report any concerns immediately to our support team</li>
          <li>Keep valuable items secure during service appointments</li>
        </ul>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          For Handymen
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700">
          <li>
            Maintain current licensing and insurance appropriate for your
            services
          </li>
          <li>
            Use proper safety equipment and follow industry best practices
          </li>
          <li>Communicate professionally and document work progress</li>
          <li>Respect customer property and maintain clean work areas</li>
          <li>
            Report unsafe working conditions or customer behavior immediately
          </li>
          <li>Keep emergency contact information readily available</li>
        </ul>
      </section>

      {/* Incident Response */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Incident Response
        </h2>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Immediate Safety Concerns
        </h3>
        <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg mb-4 sm:mb-6">
          <p className="text-sm sm:text-base text-red-800 font-medium mb-2">
            For immediate safety emergencies:
          </p>
          <ul className="list-disc pl-4 sm:pl-6 space-y-1 text-sm sm:text-base text-red-700">
            <li>
              <strong>Call 911</strong> for medical emergencies or immediate
              danger
            </li>
            <li>
              <strong>Contact local authorities</strong> for criminal activity
              or threats
            </li>
            <li>
              <strong>Notify our safety team</strong> at safety@thehandyhack.com
            </li>
          </ul>
        </div>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Platform Issues
        </h3>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          For non-emergency safety concerns or platform violations:
        </p>
        <ol className="list-decimal pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700">
          <li>Use our in-platform reporting tools to document the incident</li>
          <li>Provide detailed information and any supporting evidence</li>
          <li>Suspend further interaction until our team can investigate</li>
          <li>Follow up with additional information if requested</li>
          <li>Cooperate with our investigation and resolution process</li>
        </ol>
      </section>

      {/* Insurance Information */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Insurance and Liability
        </h2>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Platform Coverage
        </h3>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          TheHandyHack maintains comprehensive platform insurance including:
        </p>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>General liability coverage for platform operations</li>
          <li>Cyber security and data breach protection</li>
          <li>Professional liability for platform services</li>
          <li>Payment processing and escrow account protection</li>
        </ul>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          User Responsibility
        </h3>
        <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            <strong>Important:</strong> Users are responsible for obtaining
            appropriate insurance coverage for their activities. Handymen should
            maintain general liability insurance, and customers should verify
            their homeowner&apos;s or renter&apos;s insurance covers contractor
            work.
          </p>
        </div>
      </section>

      {/* Contact Safety Team */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Contact Our Safety Team
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          Our dedicated safety team is here to help with any concerns or
          questions:
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
            <h4 className="text-sm sm:text-base font-medium text-slate-800 mb-2">
              Emergency Safety
            </h4>
            <p className="text-sm sm:text-base text-slate-700">
              <strong>Email:</strong> safety@thehandyhack.com
              <br />
              <strong>Response:</strong> Within 1 hour, 24/7
            </p>
          </div>
          <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
            <h4 className="text-sm sm:text-base font-medium text-slate-800 mb-2">
              General Support
            </h4>
            <p className="text-sm sm:text-base text-slate-700">
              <strong>Email:</strong> support@thehandyhack.com
              <br />
              <strong>Response:</strong> Within 24 hours
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
