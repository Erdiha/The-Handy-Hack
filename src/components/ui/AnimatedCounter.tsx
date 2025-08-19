"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.2,
  className = "",
  prefix = "",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      // Smooth easing like Stripe/banking apps
      const smoothProgress =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Round to nice increments for smoother feel
      const currentValue = Math.floor(value * smoothProgress);
      const roundedValue =
        currentValue < 50
          ? Math.round(currentValue / 5) * 5 // Round to 5s when small
          : Math.round(currentValue / 10) * 10; // Round to 10s when larger

      setDisplayValue(Math.min(roundedValue, value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value); // Ensure final value is exact
      }
    };

    if (value > 0) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      setDisplayValue(0);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <motion.span
      className={className}
      key={value}
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      {displayValue}
    </motion.span>
  );
}
