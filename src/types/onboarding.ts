export interface OnboardingFormData {
  neighborhood: string;
  address: string;
  phone: string;
  bio: string;
  services: string[];
  hourlyRate: string;
}

export interface OnboardingStepProps {
  formData: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: string | string[]) => void;
  isHandyman?: boolean;
}