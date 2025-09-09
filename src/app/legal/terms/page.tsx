import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - TheHandyHack",
  description:
    "Terms and conditions for using TheHandyHack neighborhood helper marketplace platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-none">
      {/* Header */}
      <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Terms of Service
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

      {/* Agreement to Terms */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Agreement to Terms
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          These Terms of Service (&quot;Terms&quot;) govern your use of
          TheHandyHack platform and services. By accessing or using our
          platform, you agree to be bound by these Terms and our Privacy Policy.
        </p>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          If you do not agree to these Terms, please do not use our platform.
        </p>
      </section>

      {/* Platform Disclaimer */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Platform Disclaimer
        </h2>
        <div className="p-4 sm:p-6 bg-red-50 border-2 border-red-200 rounded-lg mb-4 sm:mb-6">
          <p className="text-sm sm:text-base text-red-900 font-semibold mb-3">
            <strong>CRITICAL DISCLAIMER - READ CAREFULLY:</strong>
          </p>
          <ul className="list-disc pl-4 sm:pl-6 space-y-2 text-sm sm:text-base text-red-800">
            <li>
              <strong>TheHandyHack is ONLY a technology platform</strong> that
              connects users. We do NOT provide handyman services.
            </li>
            <li>
              <strong>We are NOT responsible</strong> for the quality, safety,
              legality, or completion of any services.
            </li>
            <li>
              <strong>We do NOT employ, supervise, or control</strong> any
              handymen on our platform.
            </li>
            <li>
              <strong>All work agreements are directly between users</strong> -
              we are not a party to these agreements.
            </li>
            <li>
              <strong>We make NO warranties or guarantees</strong> about any
              services performed through our platform.
            </li>
          </ul>
        </div>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          By using our platform, you acknowledge that TheHandyHack acts solely
          as an intermediary technology service and bears no responsibility for
          user interactions, work quality, or outcomes.
        </p>
      </section>

      {/* Neighbor-to-Neighbor Model */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Neighbor-to-Neighbor Model
        </h2>
        <div className="p-4 sm:p-6 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm sm:text-base text-green-800 leading-relaxed mb-3">
            <strong>
              TheHandyHack operates as a neighborhood connection platform where:
            </strong>
          </p>
          <ul className="list-disc pl-4 sm:pl-6 space-y-1 text-sm sm:text-base text-green-700">
            <li>Individual neighbors post jobs they need help with</li>
            <li>Individual handymen offer their personal services</li>
            <li>We facilitate introductions between neighbors</li>
            <li>
              All work arrangements are private agreements between individuals
            </li>
            <li>We do not hire, employ, or contract with service providers</li>
            <li>
              We do not manage, supervise, or guarantee any work performed
            </li>
            <li>We are not a construction company or service business</li>
            <li>
              We simply provide the technology platform for neighbors to connect
            </li>
          </ul>
        </div>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mt-4">
          This neighbor-to-neighbor model means TheHandyHack has no control
          over, and accepts no responsibility for, the interactions, agreements,
          or work performed between users. We are merely a digital bulletin
          board for local community connections.
        </p>
      </section>

      {/* Service Disclaimers */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Service Disclaimers
        </h2>
        <div className="p-4 sm:p-6 bg-gray-50 border border-gray-300 rounded-lg">
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3">
            <strong>
              PLATFORM PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES:
            </strong>
          </p>
          <ul className="list-disc pl-4 sm:pl-6 space-y-1 text-sm sm:text-base text-slate-700">
            <li>No warranty that services will meet your requirements</li>
            <li>
              No warranty that platform will be uninterrupted or error-free
            </li>
            <li>
              No warranty regarding handyman qualifications or work quality
            </li>
            <li>No warranty that background checks guarantee safety</li>
            <li>Users acknowledge they use platform at their own risk</li>
          </ul>
        </div>
      </section>

      {/* User Accounts */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          User Accounts
        </h2>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Account Registration
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>You must be 18 years or older to create an account</li>
          <li>Provide accurate and complete information</li>
          <li>Maintain the security of your account credentials</li>
          <li>You are responsible for all activities under your account</li>
        </ul>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Account Verification
        </h3>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          Handymen may be required to complete identity verification, including:
        </p>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700">
          <li>Government-issued ID verification</li>
          <li>Background check (where legally permitted)</li>
          <li>Insurance verification (recommended)</li>
          <li>Skills and experience validation</li>
        </ul>
      </section>

      {/* User Responsibilities */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          User Responsibilities
        </h2>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          All Users Must:
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>Provide honest and accurate information</li>
          <li>Communicate respectfully with other users</li>
          <li>Comply with all applicable laws and regulations</li>
          <li>Not engage in fraudulent or deceptive practices</li>
          <li>Respect intellectual property rights</li>
          <li>Not circumvent platform fees or payment processing</li>
          <li>Maintain appropriate insurance coverage for their activities</li>
          <li>Assume all risks associated with using the platform</li>
        </ul>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Customers Must:
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>Provide accurate job descriptions and requirements</li>
          <li>Pay agreed-upon amounts promptly</li>
          <li>Provide safe working conditions</li>
          <li>Leave honest reviews based on actual experiences</li>
          <li>Verify handyman credentials and insurance before hiring</li>
          <li>Secure valuable items during service appointments</li>
        </ul>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Handymen Must:
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700">
          <li>Accurately represent skills and experience</li>
          <li>Complete work according to agreed specifications</li>
          <li>Maintain appropriate licenses and insurance</li>
          <li>Follow safety protocols and building codes</li>
          <li>Communicate professionally with customers</li>
          <li>Use proper safety equipment and industry best practices</li>
        </ul>
      </section>

      {/* Payment Terms */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Payment Terms
        </h2>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Platform Fees
        </h3>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>Service fees apply to all transactions</li>
          <li>Payment processing fees may apply</li>
          <li>Fees are clearly disclosed before payment</li>
          <li>All fees are non-refundable except as required by law</li>
        </ul>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Escrow Service
        </h3>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          We provide escrow services to facilitate payments:
        </p>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700">
          <li>Customer payment is held securely until job completion</li>
          <li>Funds are released when customer confirms satisfaction</li>
          <li>Automatic release after 48 hours if no issues reported</li>
          <li>Dispute resolution available if problems arise</li>
          <li>Escrow service does not guarantee work quality or completion</li>
        </ul>
      </section>

      {/* Limitation of Liability */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Limitation of Liability
        </h2>
        <div className="p-4 sm:p-6 bg-slate-50 border-2 border-slate-300 rounded-lg mb-4 sm:mb-6">
          <p className="text-sm sm:text-base text-slate-900 font-bold mb-3">
            MAXIMUM LIABILITY: $50 OR TOTAL FEES PAID (WHICHEVER IS LESS)
          </p>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3">
            <strong>TO THE FULLEST EXTENT PERMITTED BY LAW:</strong>
          </p>
          <ul className="list-disc pl-4 sm:pl-6 space-y-1 text-sm sm:text-base text-slate-700">
            <li>
              TheHandyHack shall NOT be liable for property damage, personal
              injury, or death
            </li>
            <li>
              We are NOT liable for theft, loss, or damage to personal
              belongings
            </li>
            <li>
              We are NOT responsible for work quality, completion, or disputes
              between users
            </li>
            <li>
              We are NOT liable for financial losses, lost profits, or
              consequential damages
            </li>
            <li>
              Our total liability is limited to the lesser of $50 or fees you
              paid to us
            </li>
            <li>Users assume ALL RISKS when using our platform</li>
          </ul>
        </div>
        <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <p className="text-sm sm:text-base text-yellow-800">
            <strong>Insurance Requirement:</strong> All users must maintain
            appropriate insurance coverage. Handymen must have general liability
            insurance. Customers should verify their
            homeowner&apos;s/renter&apos;s insurance covers contractor work.
          </p>
        </div>
      </section>

      {/* Prohibited Activities */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Prohibited Activities
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          The following activities are strictly prohibited:
        </p>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700">
          <li>Creating fake accounts or impersonating others</li>
          <li>Posting false or misleading job descriptions</li>
          <li>Attempting to bypass platform payment systems</li>
          <li>Engaging in discriminatory behavior</li>
          <li>Harassing or threatening other users</li>
          <li>Posting inappropriate or offensive content</li>
          <li>Attempting to damage or interfere with platform operations</li>
          <li>Using the platform for illegal activities</li>
          <li>Working without proper licenses or insurance where required</li>
        </ul>
      </section>

      {/* Dispute Resolution */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Dispute Resolution
        </h2>

        <div className="p-4 sm:p-6 bg-blue-50 border border-blue-200 rounded-lg mb-4 sm:mb-6">
          <p className="text-sm sm:text-base text-blue-900 font-semibold mb-2">
            MANDATORY BINDING ARBITRATION
          </p>
          <p className="text-sm sm:text-base text-blue-800">
            All disputes must be resolved through binding arbitration, not
            courts. You waive your right to a jury trial and class action
            lawsuits.
          </p>
        </div>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Platform Mediation
        </h3>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          If disputes arise between users, we offer mediation services:
        </p>
        <ol className="list-decimal pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>Report the issue through our support system</li>
          <li>Provide documentation and evidence</li>
          <li>Participate in good faith mediation</li>
          <li>Accept binding resolution if mediation fails</li>
        </ol>

        <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2 sm:mb-3">
          Arbitration Process
        </h3>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          Any disputes not resolved through platform mediation shall be resolved
          through binding arbitration in accordance with the rules of the
          American Arbitration Association. Arbitration will be conducted
          individually, not as a class action.
        </p>
      </section>

      {/* Indemnification */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Indemnification
        </h2>
        <div className="p-4 sm:p-6 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm sm:text-base text-orange-800 leading-relaxed">
            <strong>
              You agree to indemnify and hold harmless TheHandyHack
            </strong>{" "}
            from any claims, damages, losses, or expenses (including attorney
            fees) arising from:
          </p>
          <ul className="list-disc pl-4 sm:pl-6 space-y-1 text-sm sm:text-base text-orange-700 mt-3">
            <li>Your use of the platform</li>
            <li>Services you provide or receive through the platform</li>
            <li>Your violation of these Terms</li>
            <li>
              Property damage or personal injury during service appointments
            </li>
            <li>Any disputes with other users</li>
          </ul>
        </div>
      </section>

      {/* Account Termination */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Account Termination
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          We may suspend or terminate accounts immediately for violations of
          these Terms, including:
        </p>
        <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
          <li>Fraudulent or deceptive behavior</li>
          <li>Repeated policy violations</li>
          <li>Safety concerns or complaints</li>
          <li>Non-payment or payment disputes</li>
          <li>Working without proper licensing or insurance</li>
        </ul>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          Users may delete their accounts at any time through account settings.
          Termination does not relieve users of obligations incurred before
          termination.
        </p>
      </section>

      {/* Changes to Terms */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Changes to Terms
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          We may update these Terms from time to time. Significant changes will
          be communicated to users via email or platform notification. Continued
          use of the platform constitutes acceptance of updated Terms.
        </p>
      </section>

      {/* Contact Information */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">
          Contact Information
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4">
          For questions about these Terms of Service, please contact us:
        </p>
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-50 rounded-lg">
          <p className="text-sm sm:text-base text-slate-700">
            <strong>Email:</strong> legal@thehandyhack.com
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
