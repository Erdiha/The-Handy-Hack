'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-orange-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-white to-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-800 mb-6">
              How <span className="text-orange-600">FixMyHood</span> Works
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              We&apos;re not just another marketplace. We&apos;re building a community where neighbors help neighbors, 
              trusted relationships matter, and everyone wins.
            </p>
          </motion.div>
        </div>
      </section>

      {/* For Customers Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              For Homeowners
            </h2>
            <p className="text-xl text-slate-600">
              Get quality work done by trusted neighbors in 3 simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white text-3xl font-bold">1</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Tell Us What You Need</h3>
              <p className="text-slate-600 leading-relaxed">
                Search by service type, upload a photo, or describe your project. 
                Our smart matching finds the perfect pros in your neighborhood.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white text-3xl font-bold">2</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Choose Your Neighbor</h3>
              <p className="text-slate-600 leading-relaxed">
                Browse profiles of verified handymen in your area. See real reviews from 
                actual neighbors, not fake testimonials.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white text-3xl font-bold">3</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Get It Done Right</h3>
              <p className="text-slate-600 leading-relaxed">
                Chat directly, schedule the work, and pay securely. No bidding wars, 
                no hidden fees - just quality work at fair prices.
              </p>
            </motion.div>
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link href="/search">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                Find Local Help Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* For Handymen Section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              For Handymen
            </h2>
            <p className="text-xl text-slate-600">
              Build your neighborhood business and keep 98% of what you earn
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white text-3xl">🏠</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Join Your Community</h3>
              <p className="text-slate-600 leading-relaxed">
                Sign up, verify your skills, and set your rates. Tell neighbors about 
                your experience and what makes you the right choice.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white text-3xl">💬</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Connect & Quote</h3>
              <p className="text-slate-600 leading-relaxed">
                Get notified when neighbors need your services. Chat directly, 
                provide quotes, and schedule work that fits your life.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white text-3xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Earn & Build Reputation</h3>
              <p className="text-slate-600 leading-relaxed">
                Complete jobs, get paid securely, and build lasting relationships. 
                Happy neighbors become repeat customers and referrals.
              </p>
            </motion.div>
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                Start Earning Today
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Why Choose FixMyHood?
            </h2>
            <p className="text-xl text-slate-600">
              We&apos;re different from the big corporate platforms
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Community First */}
            <motion.div
              className="text-center p-6 bg-orange-50 rounded-3xl border border-orange-100"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl mb-4">🏘️</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Community First</h3>
              <p className="text-slate-600">
                Real neighbors helping neighbors, not corporate contractors from across town.
              </p>
            </motion.div>

            {/* Fair Pricing */}
            <motion.div
              className="text-center p-6 bg-green-50 rounded-3xl border border-green-100"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl mb-4">💸</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">2% vs 20% Fees</h3>
              <p className="text-slate-600">
                We charge just 2%, not the 15-30% that big platforms take from your neighbors.
              </p>
            </motion.div>

            {/* Real Reviews */}
            <motion.div
              className="text-center p-6 bg-blue-50 rounded-3xl border border-blue-100"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Verified Neighbors</h3>
              <p className="text-slate-600">
                Reviews from real neighbors you can trust, not anonymous internet strangers.
              </p>
            </motion.div>

            {/* Local Knowledge */}
            <motion.div
              className="text-center p-6 bg-purple-50 rounded-3xl border border-purple-100"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Local Expertise</h3>
              <p className="text-slate-600">
                Handymen who know your neighborhood&apos;s quirks, building styles, and local suppliers.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-slate-800 mb-6">
                Safety & Trust Built In
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Background Verification</h3>
                    <p className="text-slate-600">Identity and background checks for all handymen</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Secure Payments</h3>
                    <p className="text-slate-600">Safe, encrypted payment processing with dispute protection</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Community Accountability</h3>
                    <p className="text-slate-600">Real neighbor reviews and reputation that matters locally</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Work Guarantee</h3>
                    <p className="text-slate-600">Quality guarantee on all completed projects</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-3xl p-8 text-center"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="text-6xl mb-6">🛡️</div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Protected Every Step</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                From initial contact to project completion, we&apos;ve got both homeowners and handymen covered 
                with comprehensive protection and support.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Join Your Neighborhood Community?
            </h2>
            <p className="text-xl text-orange-100 mb-8 leading-relaxed">
              Whether you need help with a project or want to offer your skills, 
              FixMyHood makes it easy to connect with trusted neighbors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/search">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  Find Local Help
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-orange-600 font-bold px-8 py-4 text-lg rounded-xl transition-all duration-300">
                  Offer Your Services
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}