"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRef } from "react";

export default function HowItWorksPage() {
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50"
    >
      {/* Hero Section with Parallax */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <motion.div
          style={{ y }}
          className="absolute inset-0 bg-gradient-to-br from-orange-100/50 to-blue-100/50"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="inline-block mb-6"
            >
              <span className="bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent text-lg font-semibold tracking-wide">
                TRUSTED NEIGHBORHOOD PLATFORM
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              How{" "}
              <span className="bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                TheHandyHack
              </span>{" "}
              Works
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed mb-12">
              Connect with verified local handymen in your neighborhood.
              <span className="text-slate-800 font-semibold">
                {" "}
                Real neighbors, real skills, real results.
              </span>
            </p>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap justify-center gap-6 sm:gap-8 text-sm sm:text-base text-slate-600"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Background Verified
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Secure Payments
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                Local Community
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* For Customers Section */}
      <section className="py-16 md:py-24 bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 via-transparent to-blue-50/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16 md:mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-block mb-4">
              <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold tracking-wide">
                FOR HOMEOWNERS
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Get Quality Work Done by{" "}
              <span className="text-orange-600">Trusted Neighbors</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
              Skip the corporate middlemen. Work directly with skilled
              professionals in your community.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "1",
                title: "Post Your Project",
                description:
                  "Describe what you need done, set your budget, and add photos. Our smart matching connects you with the perfect local pros.",
                icon: "📋",
                color: "from-orange-400 to-orange-600",
                bgColor: "bg-orange-50",
                borderColor: "border-orange-200",
              },
              {
                step: "2",
                title: "Choose Your Pro",
                description:
                  "Browse verified handymen in your area. See real reviews from actual neighbors, compare rates, and chat directly.",
                icon: "🤝",
                color: "from-blue-400 to-blue-600",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
              },
              {
                step: "3",
                title: "Secure & Simple",
                description:
                  "Pay safely through our platform. Funds are held in escrow until work is complete. Get exactly what you paid for.",
                icon: "🛡️",
                color: "from-green-400 to-green-600",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className={`relative p-8 ${item.bgColor} border-2 ${item.borderColor} rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 group`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                >
                  <span className="text-white text-2xl font-bold">
                    {item.step}
                  </span>
                </div>

                <div className="text-center">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link href="/search">
              <Button
                variant="gradient"
                size="lg"
                colorScheme="orange"
                rightIcon="→"
              >
                Find Local Help Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* For Handymen Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-100/30 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16 md:mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-block mb-4">
              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold tracking-wide">
                FOR PROFESSIONALS
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Build Your Business,{" "}
              <span className="text-blue-600">Keep Your Earnings</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
              Keep 95% of what you earn. No bidding wars, no fake reviews, just
              fair work at honest prices.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                title: "Join & Verify",
                description:
                  "Quick signup, background check, and skill verification. Set your rates and service areas to match your expertise.",
                icon: "🎯",
                highlight: "5 min setup",
              },
              {
                title: "Get Quality Leads",
                description:
                  "Receive notifications for jobs in your area. No bidding against dozens of competitors - just direct connections.",
                icon: "📱",
                highlight: "Direct contact",
              },
              {
                title: "Get Paid Securely",
                description:
                  "Payments held in escrow, released when job completes. You keep 95% - among the best rates in the industry.",
                icon: "💰",
                highlight: "95% payout",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 group"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
              >
                <div className="text-center">
                  <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                    {item.highlight}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            {session ? (
              <Link href="/dashboard">
                <Button
                  variant="gradient"
                  size="lg"
                  colorScheme="blue"
                  rightIcon="→"
                >
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/auth/signup">
                <Button
                  variant="gradient"
                  size="lg"
                  colorScheme="blue"
                  rightIcon="→"
                >
                  Start Earning Today
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us - Competitive Advantages */}
      <section id="pricing" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16 md:mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Why TheHandyHack{" "}
              <span className="bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
                Wins
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
              Built for communities, not corporations. Here&apos;s how
              we&apos;re different from the big platforms.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                icon: "🏘️",
                title: "Community First",
                description:
                  "Real neighbors helping neighbors, not random contractors from across town.",
                bgColor: "bg-orange-50",
                borderColor: "border-orange-200",
                iconBg: "bg-orange-100",
              },
              {
                icon: "💸",
                title: "Fair Fees",
                description:
                  "We charge 8% + 2% vs competitors' 15-30%. More money stays in your pocket.",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
                iconBg: "bg-green-100",
              },
              {
                icon: "⭐",
                title: "Real Reviews",
                description:
                  "Reviews from verified neighbors you can trust, not anonymous internet strangers.",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
                iconBg: "bg-blue-100",
              },
              {
                icon: "🛡️",
                title: "Built-in Protection",
                description:
                  "Escrow payments, background checks, and work guarantees protect everyone.",
                bgColor: "bg-purple-50",
                borderColor: "border-purple-200",
                iconBg: "bg-purple-100",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className={`${item.bgColor} border-2 ${item.borderColor} p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 group`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
              >
                <div
                  className={`${item.iconBg} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <span className="text-3xl">{item.icon}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="inline-block mb-6">
                <span className="bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-semibold">
                  TRUST & SAFETY
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8">
                Your Safety is{" "}
                <span className="text-slate-700">Our Priority</span>
              </h2>

              <div className="space-y-6">
                {[
                  {
                    title: "Background Verification",
                    description:
                      "Identity verification and background checks for all professionals",
                    icon: "✓",
                  },
                  {
                    title: "Escrow Protection",
                    description:
                      "Payments held safely until work is completed to your satisfaction",
                    icon: "✓",
                  },
                  {
                    title: "Community Reviews",
                    description:
                      "Real reviews from verified neighbors, not fake testimonials",
                    icon: "✓",
                  },
                  {
                    title: "Work Guarantee",
                    description:
                      "Quality guarantee with dispute resolution for all projects",
                    icon: "✓",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white text-sm font-bold">
                        {item.icon}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 rounded-3xl p-8 lg:p-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
                <div className="relative z-10">
                  <div className="text-6xl lg:text-7xl mb-8">🛡️</div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">
                    Enterprise-Grade Security
                  </h3>
                  <p className="text-slate-700 text-lg leading-relaxed">
                    From verification to payment processing, every interaction
                    is protected by bank-level security and comprehensive safety
                    measures.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-orange-500 via-orange-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8">
              Ready to Join Your{" "}
              <span className="text-yellow-200">Neighborhood Community?</span>
            </h2>

            <p className="text-lg sm:text-xl text-orange-100 mb-12 max-w-4xl mx-auto leading-relaxed">
              Whether you need help with a project or want to offer your skills,
              TheHandyHack makes it simple to connect with trusted neighbors.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center">
              <Link href="/search">
                <Button
                  variant="white"
                  size="xl"
                  colorScheme="white"
                  fullWidth={false}
                >
                  Find Local Help
                </Button>
              </Link>

              {session ? (
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="xl"
                    colorScheme="white"
                    fullWidth={false}
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signup">
                  <Button
                    variant="outline"
                    size="xl"
                    colorScheme="white"
                    fullWidth={false}
                  >
                    Offer Your Services
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
