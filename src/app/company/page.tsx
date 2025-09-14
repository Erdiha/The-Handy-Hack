"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import PlaceholderPage from "../placeholder-page/page";

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

export default function CompanyPage() {
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

                  {/* Stats */}
                  {/* <div className="bg-gradient-to-r from-orange-50 to-blue-50 p-8 rounded-2xl border border-orange-200">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">
                      By the Numbers
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                      <div>
                        <div className="text-2xl font-bold text-orange-600 mb-1">
                          500+
                        </div>
                        <div className="text-slate-600 text-sm">
                          Verified Handymen
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          2,000+
                        </div>
                        <div className="text-slate-600 text-sm">
                          Jobs Completed
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          8
                        </div>
                        <div className="text-slate-600 text-sm">
                          Neighborhoods
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          4.9★
                        </div>
                        <div className="text-slate-600 text-sm">
                          Average Rating
                        </div>
                      </div>
                    </div>
                  </div> */}
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
                // <div className="space-y-8">
                //   <div>
                //     <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                //       Join Our Team
                //     </h2>
                //     <p className="text-slate-600 leading-relaxed mb-6">
                //       Help us build the future of neighborhood connections.
                //       We&apos;re looking for passionate people who believe in
                //       community, trust, and making home services better for
                //       everyone.
                //     </p>
                //   </div>

                //   {/* Why Work Here */}
                //   <div>
                //     <h3 className="text-xl font-bold text-slate-900 mb-6">
                //       Why TheHandyHack?
                //     </h3>
                //     <div className="grid md:grid-cols-2 gap-6">
                //       <div className="space-y-4">
                //         <div className="flex items-start space-x-3">
                //           <span className="text-green-500 text-xl">✓</span>
                //           <div>
                //             <h4 className="font-semibold text-slate-900">
                //               Impact-Driven Work
                //             </h4>
                //             <p className="text-slate-600 text-sm">
                //               Build technology that strengthens real communities
                //             </p>
                //           </div>
                //         </div>
                //         <div className="flex items-start space-x-3">
                //           <span className="text-green-500 text-xl">✓</span>
                //           <div>
                //             <h4 className="font-semibold text-slate-900">
                //               Competitive Benefits
                //             </h4>
                //             <p className="text-slate-600 text-sm">
                //               Health, dental, vision, equity, and flexible PTO
                //             </p>
                //           </div>
                //         </div>
                //         <div className="flex items-start space-x-3">
                //           <span className="text-green-500 text-xl">✓</span>
                //           <div>
                //             <h4 className="font-semibold text-slate-900">
                //               Remote-First Culture
                //             </h4>
                //             <p className="text-slate-600 text-sm">
                //               Work from anywhere with quarterly team gatherings
                //             </p>
                //           </div>
                //         </div>
                //       </div>
                //       <div className="space-y-4">
                //         <div className="flex items-start space-x-3">
                //           <span className="text-green-500 text-xl">✓</span>
                //           <div>
                //             <h4 className="font-semibold text-slate-900">
                //               Growth Opportunities
                //             </h4>
                //             <p className="text-slate-600 text-sm">
                //               Learn from experienced team members and shape our
                //               direction
                //             </p>
                //           </div>
                //         </div>
                //         <div className="flex items-start space-x-3">
                //           <span className="text-green-500 text-xl">✓</span>
                //           <div>
                //             <h4 className="font-semibold text-slate-900">
                //               Startup Equity
                //             </h4>
                //             <p className="text-slate-600 text-sm">
                //               Share in our success as we grow and expand
                //             </p>
                //           </div>
                //         </div>
                //         <div className="flex items-start space-x-3">
                //           <span className="text-green-500 text-xl">✓</span>
                //           <div>
                //             <h4 className="font-semibold text-slate-900">
                //               Local Focus
                //             </h4>
                //             <p className="text-slate-600 text-sm">
                //               Based in LA with strong neighborhood connections
                //             </p>
                //           </div>
                //         </div>
                //       </div>
                //     </div>
                //   </div>

                //   {/* Open Positions */}
                //   <div>
                //     <h3 className="text-xl font-bold text-slate-900 mb-6">
                //       Open Positions
                //     </h3>
                //     <div className="space-y-4">
                //       {jobListings.map((job) => (
                //         <div
                //           key={job.id}
                //           className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                //         >
                //           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                //             <div>
                //               <h4 className="font-bold text-slate-900 text-lg mb-1">
                //                 {job.title}
                //               </h4>
                //               <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                //                 <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                //                   {job.department}
                //                 </span>
                //                 <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                //                   {job.location}
                //                 </span>
                //                 <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                //                   {job.type}
                //                 </span>
                //               </div>
                //             </div>
                //             <Button
                //               variant="outline"
                //               colorScheme="orange"
                //               size="sm"
                //               className="mt-4 sm:mt-0"
                //             >
                //               Apply Now
                //             </Button>
                //           </div>
                //           <p className="text-slate-600 mb-4">
                //             {job.description}
                //           </p>
                //           <div>
                //             <h5 className="font-semibold text-slate-900 mb-2">
                //               Key Requirements:
                //             </h5>
                //             <ul className="text-slate-600 text-sm space-y-1">
                //               {job.requirements.map((req, index) => (
                //                 <li key={index} className="flex items-start">
                //                   <span className="text-orange-500 mr-2">
                //                     •
                //                   </span>
                //                   {req}
                //                 </li>
                //               ))}
                //             </ul>
                //           </div>
                //         </div>
                //       ))}
                //     </div>
                //   </div>

                //   {/* Don't see a fit? */}
                //   <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                //     <h3 className="font-bold text-slate-900 mb-2">
                //       Don&apos;t see the perfect role?
                //     </h3>
                //     <p className="text-slate-600 mb-4">
                //       We&apos;re always looking for talented people who share
                //       our vision. Send us your resume and tell us how you&apos;d
                //       like to contribute to building stronger neighborhoods.
                //     </p>
                //     <Button variant="primary" colorScheme="orange">
                //       Send General Application
                //     </Button>
                //   </div>
                // </div>
              )}

              {/* Press Tab */}
              {activeTab === "press" && (
                <PlaceholderPage
                  title="Press & Media"
                  description="Our press kit and media resources are coming soon. For press inquiries, contact press@thehandyhack.com"
                  icon="📰"
                  showBackButton={false}
                />
                // <div className="space-y-8">
                //   <div>
                //     <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                //       Press & Media
                //     </h2>
                //     <p className="text-slate-600 leading-relaxed mb-6">
                //       Stay updated with TheHandyHack news, press releases, and
                //       media coverage. For press inquiries, contact us at
                //       press@thehandyhack.com
                //     </p>
                //   </div>

                //   {/* Media Kit */}
                //   <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                //     <h3 className="font-bold text-slate-900 mb-4">Media Kit</h3>
                //     <div className="grid sm:grid-cols-3 gap-4">
                //       <Button
                //         variant="outline"
                //         colorScheme="gray"
                //         size="sm"
                //         fullWidth
                //       >
                //         Download Logos
                //       </Button>
                //       <Button
                //         variant="outline"
                //         colorScheme="gray"
                //         size="sm"
                //         fullWidth
                //       >
                //         Brand Guidelines
                //       </Button>
                //       <Button
                //         variant="outline"
                //         colorScheme="gray"
                //         size="sm"
                //         fullWidth
                //       >
                //         Product Screenshots
                //       </Button>
                //     </div>
                //   </div>

                //   {/* Press Items */}
                //   <div>
                //     <h3 className="text-xl font-bold text-slate-900 mb-6">
                //       Recent News
                //     </h3>
                //     <div className="space-y-6">
                //       {pressItems.map((item) => (
                //         <article
                //           key={item.id}
                //           className="border border-slate-200 rounded-xl p-6"
                //         >
                //           <div className="flex items-start justify-between mb-3">
                //             <div className="flex-1">
                //               <div className="flex items-center gap-2 mb-2">
                //                 <span
                //                   className={`text-xs px-2 py-1 rounded ${
                //                     item.type === "press-release"
                //                       ? "bg-blue-100 text-blue-700"
                //                       : item.type === "media-mention"
                //                       ? "bg-green-100 text-green-700"
                //                       : "bg-orange-100 text-orange-700"
                //                   }`}
                //                 >
                //                   {item.type === "press-release"
                //                     ? "Press Release"
                //                     : item.type === "media-mention"
                //                     ? "Media Mention"
                //                     : "Company News"}
                //                 </span>
                //                 <span className="text-slate-500 text-sm">
                //                   {new Date(item.date).toLocaleDateString(
                //                     "en-US",
                //                     {
                //                       year: "numeric",
                //                       month: "long",
                //                       day: "numeric",
                //                     }
                //                   )}
                //                 </span>
                //               </div>
                //               <h4 className="font-bold text-slate-900 text-lg mb-2">
                //                 {item.title}
                //               </h4>
                //               <p className="text-slate-600 leading-relaxed">
                //                 {item.excerpt}
                //               </p>
                //             </div>
                //             {item.link && (
                //               <Button
                //                 variant="ghost"
                //                 colorScheme="orange"
                //                 size="sm"
                //                 className="ml-4"
                //               >
                //                 Read More →
                //               </Button>
                //             )}
                //           </div>
                //         </article>
                //       ))}
                //     </div>
                //   </div>

                //   {/* Press Contact */}
                //   <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                //     <h3 className="font-bold text-slate-900 mb-4">
                //       Press Inquiries
                //     </h3>
                //     <div className="grid md:grid-cols-2 gap-6">
                //       <div>
                //         <h4 className="font-semibold text-slate-900 mb-2">
                //           Media Contact
                //         </h4>
                //         <p className="text-slate-600 text-sm mb-1">
                //           press@thehandyhack.com
                //         </p>
                //         <p className="text-slate-600 text-sm">(555) 123-4567</p>
                //       </div>
                //       <div>
                //         <h4 className="font-semibold text-slate-900 mb-2">
                //           Quick Facts
                //         </h4>
                //         <ul className="text-slate-600 text-sm space-y-1">
                //           <li>• Founded: 2024</li>
                //           <li>• Headquarters: Los Angeles, CA</li>
                //           <li>• Focus: Neighborhood home services</li>
                //           <li>• Stage: Seed-funded startup</li>
                //         </ul>
                //       </div>
                //     </div>
                //   </div>
                // </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
