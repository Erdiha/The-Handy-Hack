"use client";
import { useState } from "react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}
interface User {
  id: string;
  name: string;
  role: string;
  email: string;
}

export default function HelpCenterPage() {
  const [activeTab, setActiveTab] = useState("getting-started");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [user] = useState({
    id: "user-123",
    name: "John Doe",
    role: "customer",
    email: "john@example.com",
  });

  const tabs = [
    { key: "getting-started", label: "Getting Started", icon: "🚀" },
    { key: "customers", label: "For Customers", icon: "👤" },
    { key: "handymen", label: "For Handymen", icon: "🔧" },
    { key: "payments", label: "Payments", icon: "💳" },
    { key: "account", label: "Account & Safety", icon: "🔒" },
    { key: "contact", label: "Contact Support", icon: "📞" },
  ];

  const faqData: FAQItem[] = [
    // Getting Started
    {
      id: "1",
      question: "How does TheHandyHack work?",
      answer:
        "TheHandyHack connects you with trusted local handymen in your neighborhood. Customers can post jobs or search for available helpers, while handymen can browse jobs and offer their services. All payments are processed securely through our platform.",
      category: "getting-started",
    },
    {
      id: "2",
      question: "Is TheHandyHack available in my area?",
      answer:
        "We're currently available in select neighborhoods. During signup, you'll be able to see if your area is covered. We're expanding rapidly, so check back if we're not in your neighborhood yet!",
      category: "getting-started",
    },
    {
      id: "3",
      question: "How do I sign up?",
      answer:
        "Click 'Join Now' in the top navigation, choose whether you're a customer or handyman, and complete the simple registration process. You'll need to verify your email and complete your profile to get started.",
      category: "getting-started",
    },

    // For Customers
    {
      id: "4",
      question: "How do I post a job?",
      answer:
        "Click 'Post Job' in your dashboard, describe your task, set your budget, add photos if needed, and submit. Local handymen will see your job and can accept it. You'll get notifications when someone is interested.",
      category: "customers",
    },
    // {
    //   id: "5",
    //   question: "How do I find a handyman for immediate help?",
    //   answer:
    //     "Use our 'Emergency Help' feature for urgent issues. Click the red emergency button on your dashboard, describe the problem, and available handymen will be notified immediately. Emergency rates apply for immediate response.",
    //   category: "customers",
    // },
    {
      id: "6",
      question: "What if I'm not satisfied with the work?",
      answer:
        "We have a dispute resolution system. You can report issues through the 'Report Problem' button on completed jobs. Our support team reviews all disputes and can issue refunds or arrange for work to be corrected.",
      category: "customers",
    },
    {
      id: "7",
      question: "How do I pay for services?",
      answer:
        "Payments are processed securely through Stripe. You can pay by credit card, and funds are held in escrow until the job is completed to your satisfaction. This protects both customers and handymen.",
      category: "customers",
    },

    // For Handymen
    {
      id: "8",
      question: "How do I accept jobs?",
      answer:
        "Browse available jobs in your area, click on ones that match your skills, and hit 'Accept Job'. Once accepted, you'll get the customer's contact information and can coordinate the work directly.",
      category: "handymen",
    },
    {
      id: "9",
      question: "How do I set my rates?",
      answer:
        "Go to Settings > Services to set your hourly rate and manage which services you offer. You can update your rates anytime. Consider local market rates and your experience level when pricing.",
      category: "handymen",
    },
    {
      id: "10",
      question: "When do I get paid?",
      answer:
        "Payment is released to you once the customer marks the job as complete or after 7 days (whichever comes first). Funds are transferred to your connected bank account within 2-3 business days.",
      category: "handymen",
    },
    {
      id: "11",
      question: "What if a customer doesn't pay?",
      answer:
        "All payments are collected upfront and held in escrow. You're guaranteed payment for completed work. If there's a dispute, our support team will review and ensure fair resolution.",
      category: "handymen",
    },

    // Payments
    {
      id: "12",
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, MasterCard, American Express) through our secure Stripe integration. Bank transfers and digital wallets will be available soon.",
      category: "payments",
    },
    {
      id: "13",
      question: "What are your fees?",
      answer:
        "Customers are charged an 8% service fee in addition to the job cost. Handymen retain 95% of their earnings, with a 5% platform fee applied. These fees support secure payment processing, Handy Hack staff salaries, and ongoing platform maintenance.",
      category: "payments",
    },
    {
      id: "14",
      question: "How does escrow work?",
      answer:
        "When you hire a handyman, payment is immediately charged to your card but held securely in escrow. The handyman receives payment only after you confirm the work is complete, ensuring quality and security.",
      category: "payments",
    },
    {
      id: "15",
      question: "Can I get a refund?",
      answer:
        "Yes! If work isn't completed satisfactorily, you can request a refund through our dispute system. Refunds are processed back to your original payment method within 5-7 business days.",
      category: "payments",
    },

    // Account & Safety
    {
      id: "16",
      question: "How do you verify handymen?",
      answer:
        "All handymen undergo background checks and provide references. We verify their identity, insurance, and professional credentials. Look for the 'Verified' badge on profiles.",
      category: "account",
    },
    {
      id: "17",
      question: "Is my personal information safe?",
      answer:
        "Absolutely. We use bank-level encryption for all data, never share personal information without consent, and comply with all privacy regulations. Your safety and privacy are our top priorities.",
      category: "account",
    },
    {
      id: "18",
      question: "How do I delete my account?",
      answer:
        "Go to Settings > Account > Danger Zone to permanently delete your account. This action cannot be undone and will remove all your data, job history, and messages.",
      category: "account",
    },
    {
      id: "19",
      question: "What if I forget my password?",
      answer:
        "Click 'Forgot Password' on the login page, enter your email, and we'll send reset instructions. You can also change your password anytime in Settings > Profile.",
      category: "account",
    },
  ];

  const filteredFAQs = faqData.filter((faq) => {
    // Remove tab filtering when searching
    const matchesTab = searchQuery === "" ? faq.category === activeTab : true;

    if (searchQuery === "") return matchesTab;

    const query = searchQuery.toLowerCase();
    const searchText = `${faq.question} ${faq.answer}`.toLowerCase();
    const searchWords = query.split(" ").filter((word) => word.length > 0);

    const matchesSearch = searchWords.every((searchWord) =>
      searchText.includes(searchWord)
    );

    return matchesTab && matchesSearch;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-orange-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Help Center
          </h1>
          <p className="text-slate-600 text-sm sm:text-base lg:text-lg">
            Find answers to common questions and get support
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 sm:py-4 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm sm:text-base"
              placeholder="Search for help articles..."
            />
          </div>
        </div>

        {/* Mobile Tabs - Horizontal Scroll */}
        <div className="lg:hidden mb-6">
          <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-orange-50 border border-slate-200"
                }`}
              >
                <span className="text-sm sm:text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop + Mobile Layout */}
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sticky top-24">
              <div className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-left ${
                      activeTab === tab.key
                        ? "bg-orange-100 text-orange-600 shadow-sm"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8">
              {/* Contact Support Tab */}
              {activeTab === "contact" && (
                <ContactSupportContent
                  user={user}
                  onTicketSubmit={() => setActiveTab("getting-started")}
                />
              )}

              {/* FAQ Content */}
              {activeTab !== "contact" && (
                <div className="space-y-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {tabs.find((tab) => tab.key === activeTab)?.label}
                  </h2>

                  {searchQuery && (
                    <p className="text-slate-600 text-sm">
                      {filteredFAQs.length} result
                      {filteredFAQs.length !== 1 ? "s" : ""} for &quot;
                      {searchQuery}&quot;
                    </p>
                  )}

                  {filteredFAQs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🔍</div>
                      <h3 className="font-semibold text-slate-800 mb-2">
                        No articles found
                      </h3>
                      <p className="text-slate-600 mb-6">
                        {searchQuery
                          ? "Try different keywords or browse categories"
                          : "No articles available in this category yet"}
                      </p>
                      <button
                        onClick={() => setActiveTab("contact")}
                        className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 font-medium"
                      >
                        Contact Support
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredFAQs.map((faq) => (
                        <div
                          key={faq.id}
                          className="border border-slate-200 rounded-xl overflow-hidden"
                        >
                          <button
                            onClick={() => toggleFAQ(faq.id)}
                            className="w-full px-4 py-4 sm:px-6 sm:py-5 text-left hover:bg-slate-50 transition-colors focus:outline-none focus:bg-slate-50"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-slate-900 text-sm sm:text-base pr-4">
                                {faq.question}
                              </h3>
                              <svg
                                className={`w-5 h-5 text-slate-400 transform transition-transform flex-shrink-0 ${
                                  expandedFAQ === faq.id ? "rotate-180" : ""
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
                            </div>
                          </button>

                          {expandedFAQ === faq.id && (
                            <div className="px-4 pb-4 sm:px-6 sm:pb-5 border-t border-slate-100 bg-slate-50">
                              <p className="text-slate-700 text-sm sm:text-base leading-relaxed pt-4">
                                {faq.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Still need help section */}
                  {filteredFAQs.length > 0 && (
                    <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <h3 className="font-semibold text-slate-900 mb-2">
                        Still need help?
                      </h3>
                      <p className="text-slate-600 mb-4 text-sm sm:text-base">
                        Can&apos;t find what you&apos;re looking for? Our
                        support team is here to help.
                      </p>
                      <button
                        onClick={() => setActiveTab("contact")}
                        className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 font-medium transition-colors text-sm sm:text-base"
                      >
                        Contact Support
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom scrollbar hide for mobile tabs */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// Contact Support Component
function ContactSupportContent({
  user,
  onTicketSubmit,
}: {
  user: User;
  onTicketSubmit: () => void;
}) {
  const [formData, setFormData] = useState({
    type: "",
    description: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const supportTypes = [
    {
      value: "account",
      label: "Account Issues",
      desc: "Login, profile, or account settings problems",
    },
    {
      value: "payment",
      label: "Payment Problems",
      desc: "Billing, refunds, or payment processing issues",
    },
    {
      value: "job-dispute",
      label: "Job Disputes",
      desc: "Issues with completed or ongoing work",
    },
    {
      value: "technical",
      label: "Technical Problems",
      desc: "App bugs, errors, or website issues",
    },
    {
      value: "safety",
      label: "Safety Concerns",
      desc: "Report unsafe behavior or security issues",
    },
    {
      value: "feature",
      label: "Feature Request",
      desc: "Suggest improvements or new features",
    },
    {
      value: "other",
      label: "Other",
      desc: "Something else not covered above",
    },
  ];

  const handleSubmit = async () => {
    if (!formData.type || !formData.description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/support/help-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemType: formData.type,
          description: formData.description.trim(),
          priority: formData.priority,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
        setTimeout(() => {
          onTicketSubmit();
        }, 3000);
      } else {
        alert(data.error || "Failed to submit support ticket");
      }
    } catch (error) {
      console.error("Support ticket error:", error);
      alert("Failed to submit support ticket");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">
          Support Ticket Submitted!
        </h3>
        <p className="text-slate-600 mb-6">
          We&apos;ve received your message and will respond within 24 hours.
          You&apos;ll receive updates via email.
        </p>
        <p className="text-sm text-slate-500">Redirecting to help center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          Contact Support
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          Can&apos;t find what you need? Send us a message and we&apos;ll help
          you out.
        </p>
      </div>

      {/* Contact Methods */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-3">📧</span>
            <h3 className="font-semibold text-blue-900">Email Support</h3>
          </div>
          <p className="text-blue-700 text-sm">
            Average response time: 4-6 hours
          </p>
        </div>

        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-3">💬</span>
            <h3 className="font-semibold text-green-900">Priority Support</h3>
          </div>
          <p className="text-green-700 text-sm">Urgent issues: Within 1 hour</p>
        </div>
      </div>

      {/* Support Form */}
      <div className="space-y-6">
        {/* Issue Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            What do you need help with? *
          </label>
          <div className="grid gap-3">
            {supportTypes.map((type) => (
              <label
                key={type.value}
                className={`flex items-start p-4 border rounded-xl cursor-pointer transition-colors ${
                  formData.type === type.value
                    ? "border-orange-300 bg-orange-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={type.value}
                  checked={formData.type === type.value}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="mt-1 w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                />
                <div className="ml-3">
                  <div className="font-medium text-slate-900 text-sm sm:text-base">
                    {type.label}
                  </div>
                  <div className="text-slate-600 text-xs sm:text-sm">
                    {type.desc}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Priority Level
          </label>
          <select
            value={formData.priority}
            onChange={(e) =>
              setFormData({
                ...formData,
                priority: e.target.value as
                  | "low"
                  | "normal"
                  | "high"
                  | "urgent",
              })
            }
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm sm:text-base"
          >
            <option value="low">Low - General question</option>
            <option value="normal">Normal - Standard issue</option>
            <option value="high">High - Urgent problem</option>
            <option value="urgent">Urgent - Critical issue</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Describe your issue *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={6}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm sm:text-base"
            placeholder="Please provide as much detail as possible about your issue. Include any error messages, steps you took, and what you expected to happen."
            maxLength={1000}
          />
          <p className="text-xs text-slate-500 mt-2">
            {formData.description.length}/1000 characters
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSubmit}
            disabled={
              submitting || !formData.type || !formData.description.trim()
            }
            className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            {submitting ? "Submitting..." : "Submit Support Ticket"}
          </button>
        </div>
      </div>

      {/* Help Note */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <h4 className="font-medium text-slate-900 mb-2">Before you submit:</h4>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>• Check our FAQ sections above for quick answers</li>
          <li>• Include relevant details like job IDs or error messages</li>
          <li>• For urgent safety issues, call local authorities first</li>
          <li>• We typically respond within 4-6 hours during business days</li>
        </ul>
      </div>
    </div>
  );
}
