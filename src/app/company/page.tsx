"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import PlaceholderPage from "@/components/PlaceholderPage";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image?: string;
}

interface JobListing {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
}

interface PressItem {
  id: string;
  title: string;
  date: string;
  type: "press-release" | "media-mention" | "company-news";
  excerpt: string;
  link?: string;
}

function CompanyContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(tabParam || "about");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const tabs = [
    { key: "about", label: "About Us", icon: "🏢" },
    { key: "careers", label: "Careers", icon: "💼" },
    { key: "press", label: "Press", icon: "📰" },
  ];

  // Sample data - replace with your actual content
  const teamMembers: TeamMember[] = [
    {
      name: "Sarah Johnson",
      role: "CEO & Co-Founder",
      bio: "Former VP of Operations at TaskRabbit, passionate about building community-driven platforms.",
    },
    {
      name: "Mike Chen",
      role: "CTO & Co-Founder",
      bio: "Ex-Google engineer with 10+ years in marketplace technology and payment systems.",
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Safety & Trust",
      bio: "Former Airbnb safety specialist, ensuring secure experiences for our community.",
    },
    {
      name: "David Kim",
      role: "Head of Community",
      bio: "Local neighborhood advocate focused on building meaningful connections between neighbors.",
    },
  ];

  const jobListings: JobListing[] = [
    {
      id: "1",
      title: "Senior Full-Stack Engineer",
      department: "Engineering",
      location: "Los Angeles, CA",
      type: "Full-time",
      description:
        "Join our engineering team to build the next generation of neighborhood connection technology.",
      requirements: [
        "5+ years React/Node.js experience",
        "Experience with marketplace platforms",
        "Strong problem-solving skills",
        "Passion for community building",
      ],
    },
    {
      id: "2",
      title: "Community Manager",
      department: "Community",
      location: "Los Angeles, CA",
      type: "Full-time",
      description:
        "Help grow and nurture our local handyman and customer communities across LA neighborhoods.",
      requirements: [
        "3+ years community management experience",
        "Local LA market knowledge",
        "Strong communication skills",
        "Experience with social platforms",
      ],
    },
    {
      id: "3",
      title: "Customer Success Specialist",
      department: "Customer Success",
      location: "Remote",
      type: "Full-time",
      description:
        "Ensure amazing experiences for customers finding help in their neighborhoods.",
      requirements: [
        "2+ years customer success experience",
        "Problem-solving mindset",
        "Empathy for customer needs",
        "Experience with support tools",
      ],
    },
  ];

  const pressItems: PressItem[] = [
    {
      id: "1",
      title:
        "TheHandyHack Raises $2M Seed Round to Expand Neighborhood Services",
      date: "2024-12-15",
      type: "press-release",
      excerpt:
        "Local marketplace platform secures funding to expand beyond Los Angeles and enhance safety features.",
      link: "#",
    },
    {
      id: "2",
      title:
        "Featured in TechCrunch: 'The Neighborhood-First Approach to Home Services'",
      date: "2024-11-20",
      type: "media-mention",
      excerpt:
        "TechCrunch highlights TheHandyHack's community-focused model and local verification process.",
      link: "#",
    },
    {
      id: "3",
      title: "TheHandyHack Launches Enhanced Safety Features",
      date: "2024-10-10",
      type: "company-news",
      excerpt:
        "New background verification system and insurance coverage provide additional peace of mind.",
      link: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-orange-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Company
          </h1>
          <p className="text-slate-600 text-sm sm:text-base lg:text-lg">
            Learn about our mission, team, and opportunities
          </p>
        </div>

        {/* Mobile Tabs */}
        <div className="lg:hidden mb-6">
          <div className="flex space-x-1 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-orange-50 border border-slate-200"
                }`}
              >
                <span>{tab.icon}</span>
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
              {/* About Us Tab */}
              {activeTab === "about" && (
                <div className="space-y-12">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
                      About TheHandyHack
                    </h2>
                    <div className="prose prose-lg max-w-none">
                      <p className="text-slate-600 leading-relaxed mb-6">
                        TheHandyHack was born from a simple belief: neighbors
                        helping neighbors creates stronger, more connected
                        communities. Founded in 2024, we&apos;re building a
                        platform where skilled local handymen can connect
                        directly with homeowners in their neighborhoods.
                      </p>
                      <p className="text-slate-600 leading-relaxed mb-6">
                        Unlike corporate platforms that prioritize scale over
                        community, we focus on trust, transparency, and fair
                        compensation. Our rigorous verification process ensures
                        safety, while our neighborhood-first approach builds
                        lasting relationships.
                      </p>
                    </div>
                  </div>

                  {/* Mission & Values */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-6">
                      Our Mission & Values
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                        <div className="text-3xl mb-4">🏘️</div>
                        <h4 className="font-bold text-slate-900 mb-2">
                          Community First
                        </h4>
                        <p className="text-slate-600 text-sm">
                          Real neighbors helping neighbors, not anonymous
                          contractors from across town.
                        </p>
                      </div>
                      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                        <div className="text-3xl mb-4">🤝</div>
                        <h4 className="font-bold text-slate-900 mb-2">
                          Fair & Transparent
                        </h4>
                        <p className="text-slate-600 text-sm">
                          Honest pricing, clear expectations, and fair
                          compensation for quality work.
                        </p>
                      </div>
                      <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                        <div className="text-3xl mb-4">🛡️</div>
                        <h4 className="font-bold text-slate-900 mb-2">
                          Safety & Trust
                        </h4>
                        <p className="text-slate-600 text-sm">
                          Comprehensive verification and protection for every
                          interaction.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Team Section */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-6">
                      Meet Our Team
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      {teamMembers.map((member, index) => (
                        <motion.div
                          key={index}
                          className="bg-slate-50 p-6 rounded-xl border border-slate-200"
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          viewport={{ once: true }}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-xl">
                                {member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 mb-1">
                                {member.name}
                              </h4>
                              <p className="text-orange-600 font-medium text-sm mb-2">
                                {member.role}
                              </p>
                              <p className="text-slate-600 text-sm leading-relaxed">
                                {member.bio}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Careers Tab */}
              {activeTab === "careers" && (
                <PlaceholderPage
                  title="Careers"
                  description="We're building our careers page with open positions, benefits, and application process."
                  icon="💼"
                  showBackButton={false}
                />
              )}

              {/* Press Tab */}
              {activeTab === "press" && (
                <PlaceholderPage
                  title="Press & Media"
                  description="Our press kit and media resources are coming soon. For press inquiries, contact press@thehandyhack.com"
                  icon="📰"
                  showBackButton={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompanyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-orange-50 pt-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      }
    >
      <CompanyContent />
    </Suspense>
  );
}
