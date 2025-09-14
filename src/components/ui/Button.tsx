import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "white"
    | "gradient";
  size?: "sm" | "md" | "lg" | "xl";
  colorScheme?: "orange" | "blue" | "green" | "red" | "gray" | "white";
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  animate?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      colorScheme = "orange",
      children,
      leftIcon,
      rightIcon,
      loading,
      fullWidth,
      animate = true,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    // Base styles that apply to all buttons
    const baseStyles = [
      "inline-flex items-center justify-center",
      "font-semibold transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      fullWidth ? "w-full" : "",
    ];

    // Size variants
    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
      md: "px-4 py-2 text-base rounded-xl gap-2",
      lg: "px-6 py-3 text-lg rounded-xl gap-2",
      xl: "px-8 py-4 text-xl rounded-2xl gap-3",
    };

    // Color scheme definitions
    const colorSchemes = {
      orange: {
        primary:
          "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl focus:ring-orange-500",
        secondary:
          "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 focus:ring-orange-500",
        outline:
          "border-2 border-orange-500 text-orange-600 hover:bg-orange-50 focus:ring-orange-500",
        ghost: "text-orange-600 hover:bg-orange-50 focus:ring-orange-500",
        white:
          "bg-white text-orange-600 hover:bg-orange-50 shadow-md hover:shadow-lg border border-orange-200 focus:ring-orange-500",
        gradient:
          "bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl focus:ring-orange-500",
      },
      blue: {
        primary:
          "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500",
        secondary:
          "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 focus:ring-blue-500",
        outline:
          "border-2 border-blue-500 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
        ghost: "text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
        white:
          "bg-white text-blue-600 hover:bg-blue-50 shadow-md hover:shadow-lg border border-blue-200 focus:ring-blue-500",
        gradient:
          "bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl focus:ring-blue-500",
      },
      green: {
        primary:
          "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl focus:ring-green-500",
        secondary:
          "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 focus:ring-green-500",
        outline:
          "border-2 border-green-500 text-green-600 hover:bg-green-50 focus:ring-green-500",
        ghost: "text-green-600 hover:bg-green-50 focus:ring-green-500",
        white:
          "bg-white text-green-600 hover:bg-green-50 shadow-md hover:shadow-lg border border-green-200 focus:ring-green-500",
        gradient:
          "bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white shadow-xl hover:shadow-2xl focus:ring-green-500",
      },
      red: {
        primary:
          "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl focus:ring-red-500",
        secondary:
          "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 focus:ring-red-500",
        outline:
          "border-2 border-red-500 text-red-600 hover:bg-red-50 focus:ring-red-500",
        ghost: "text-red-600 hover:bg-red-50 focus:ring-red-500",
        white:
          "bg-white text-red-600 hover:bg-red-50 shadow-md hover:shadow-lg border border-red-200 focus:ring-red-500",
        gradient:
          "bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white shadow-xl hover:shadow-2xl focus:ring-red-500",
      },
      gray: {
        primary:
          "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg hover:shadow-xl focus:ring-gray-500",
        secondary:
          "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 focus:ring-gray-500",
        outline:
          "border-2 border-gray-500 text-gray-600 hover:bg-gray-50 focus:ring-gray-500",
        ghost: "text-gray-600 hover:bg-gray-50 focus:ring-gray-500",
        white:
          "bg-white text-gray-600 hover:bg-gray-50 shadow-md hover:shadow-lg border border-gray-200 focus:ring-gray-500",
        gradient:
          "bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700 text-white shadow-xl hover:shadow-2xl focus:ring-gray-500",
      },
      white: {
        primary:
          "bg-white text-gray-900 hover:bg-gray-50 shadow-lg hover:shadow-xl border border-gray-200 focus:ring-gray-500",
        secondary:
          "bg-white/20 text-white hover:bg-white/30 border border-white/30 focus:ring-white",
        outline:
          "border-2 border-white text-white hover:bg-white/10 focus:ring-white",
        ghost: "text-white hover:bg-white/10 focus:ring-white",
        white:
          "bg-white text-gray-900 hover:bg-gray-50 shadow-md hover:shadow-lg border border-gray-200 focus:ring-gray-500",
        gradient:
          "bg-gradient-to-r from-white/90 to-white hover:from-white hover:to-gray-50 text-gray-900 shadow-xl hover:shadow-2xl border border-white/20 focus:ring-white",
      },
    };

    // Get the appropriate styles
    const colorStyles = colorSchemes[colorScheme][variant];
    const sizeStyle = sizeStyles[size];

    // Combine all styles
    const buttonClasses = cn(baseStyles, sizeStyle, colorStyles, className);

    const buttonContent = (
      <>
        {leftIcon && !loading && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}

        {loading && (
          <div
            className={cn(
              "animate-spin rounded-full border-2 border-transparent border-t-current",
              size === "sm"
                ? "w-3 h-3"
                : size === "md"
                ? "w-4 h-4"
                : size === "lg"
                ? "w-5 h-5"
                : "w-6 h-6"
            )}
          />
        )}

        <span className={loading ? "opacity-70" : ""}>{children}</span>

        {rightIcon && !loading && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </>
    );

    // Enhanced click handler for animations
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(e);
      }
    };

    if (animate) {
      return (
        <motion.div
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94], // Custom cubic-bezier for smoothness
            type: "tween", // Force tween instead of spring
          }}
          className="inline-block"
        >
          <button
            className={buttonClasses}
            ref={ref}
            disabled={disabled || loading}
            onClick={handleClick}
            {...props}
          >
            {buttonContent}
          </button>
        </motion.div>
      );
    }

    return (
      <button
        className={buttonClasses}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
