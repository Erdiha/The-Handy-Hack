"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: string;
  comingSoon?: boolean;
  showBackButton?: boolean;
}

export default function PlaceholderPage({
  title,
  description,
  icon = "🚧",
  comingSoon = true,
  showBackButton = true,
}: PlaceholderPageProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 pt-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        {/* Icon */}
        <motion.div
          className="text-8xl mb-8"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {icon}
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {title}
        </motion.h1>

        {/* Description */}
        {description && (
          <motion.p
            className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {description}
          </motion.p>
        )}

        {/* Coming Soon Badge */}
        {comingSoon && (
          <motion.div
            className="inline-block bg-orange-100 border border-orange-200 rounded-full px-6 py-2 mb-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <span className="text-orange-700 font-semibold text-sm">
              Coming Soon
            </span>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {showBackButton && (
            <Button
              variant="primary"
              colorScheme="orange"
              size="lg"
              onClick={() => router.back()}
            >
              ← Go Back
            </Button>
          )}
          <Link href="/">
            <Button variant="outline" colorScheme="orange" size="lg">
              Return Home
            </Button>
          </Link>
        </motion.div>

        {/* Help Link */}
        <motion.p
          className="text-slate-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          Need help?{" "}
          <Link
            href="/help"
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Contact Support
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
