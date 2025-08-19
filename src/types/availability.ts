export interface AvailabilityData {
  weeklySchedule: {
    [key: string]: { start: string; end: string; enabled: boolean };
  };
  responseTime: string;
  vacationMode: boolean;
  vacationUntil: string;
  instantBooking: boolean;
  emergencyAvailable: boolean;
  bufferTime: number;
}
