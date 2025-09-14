// /src/lib/phoneValidation.ts

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  error?: string;
}

/**
 * Formats phone number as user types
 * Input: "5551234567" -> Output: "(555) 123-4567"
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const phoneNumber = value.replace(/[^\d]/g, "");

  // Don't format if empty
  if (!phoneNumber) return "";

  // Format based on length
  if (phoneNumber.length < 4) {
    return phoneNumber;
  } else if (phoneNumber.length < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else if (phoneNumber.length < 11) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
      3,
      6
    )}-${phoneNumber.slice(6, 10)}`;
  } else {
    // Handle 11 digits (with country code)
    return `+1 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(
      4,
      7
    )}-${phoneNumber.slice(7, 11)}`;
  }
};

/**
 * Validates phone number format and returns result
 */
export const validatePhoneNumber = (phone: string): PhoneValidationResult => {
  if (!phone || phone.trim().length === 0) {
    return {
      isValid: false,
      formatted: "",
      error: "Phone number is required",
    };
  }

  // Extract digits only
  const digitsOnly = phone.replace(/[^\d]/g, "");

  // Check length
  if (digitsOnly.length < 10) {
    return {
      isValid: false,
      formatted: phone,
      error: "Phone number must be at least 10 digits",
    };
  }

  if (digitsOnly.length > 11) {
    return {
      isValid: false,
      formatted: phone,
      error: "Phone number is too long",
    };
  }

  // Check for valid US number patterns
  if (digitsOnly.length === 11 && !digitsOnly.startsWith("1")) {
    return {
      isValid: false,
      formatted: phone,
      error: "Country code must be 1 for US numbers",
    };
  }

  // Get the actual 10-digit number (remove country code if present)
  const mainNumber =
    digitsOnly.length === 11 ? digitsOnly.slice(1) : digitsOnly;

  // Validate area code (first 3 digits)
  const areaCode = mainNumber.slice(0, 3);
  if (areaCode.startsWith("0") || areaCode.startsWith("1")) {
    return {
      isValid: false,
      formatted: phone,
      error: "Invalid area code",
    };
  }

  // Validate exchange code (next 3 digits)
  const exchangeCode = mainNumber.slice(3, 6);
  if (exchangeCode.startsWith("0") || exchangeCode.startsWith("1")) {
    return {
      isValid: false,
      formatted: phone,
      error: "Invalid phone number format",
    };
  }

  // Check for obvious fake numbers
  const fakePatterns = [
    /^(\d)\1{9}$/, // All same digit: 1111111111
    /^1234567890$/, // Sequential
    /^0000000000$/,
    /^5555555555$/,
  ];

  if (fakePatterns.some((pattern) => pattern.test(mainNumber))) {
    return {
      isValid: false,
      formatted: phone,
      error: "Please enter a valid phone number",
    };
  }

  return {
    isValid: true,
    formatted: formatPhoneNumber(digitsOnly),
    error: undefined,
  };
};

/**
 * Get clean phone number for database storage
 * Returns: "+15551234567" format
 */
export const getCleanPhoneNumber = (phone: string): string => {
  const digitsOnly = phone.replace(/[^\d]/g, "");

  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    return `+${digitsOnly}`;
  }

  return digitsOnly;
};

/**
 * Display formatted phone number
 * Input: "+15551234567" -> Output: "(555) 123-4567"
 */
export const displayPhoneNumber = (phone: string): string => {
  if (!phone) return "";

  const digitsOnly = phone.replace(/[^\d]/g, "");
  return formatPhoneNumber(digitsOnly);
};
