import { z } from 'zod';

/**
 * Normalized device enrollment data from any UEM.
 */
export const UEMEnrollmentSchema = z.object({
  // Device identification
  deviceId: z.string(),
  serialNumber: z.string().optional(),
  udid: z.string().optional(),
  macAddress: z.string().optional(),
  imei: z.string().optional(),

  // Device info
  platform: z.enum(['ios', 'ipados', 'macos', 'android', 'windows', 'linux', 'chrome']),
  osVersion: z.string().optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  hostname: z.string().optional(),

  // User info
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
  userName: z.string().optional(),
  department: z.string().optional(),

  // Enrollment status
  enrollmentStatus: z.enum(['enrolled', 'unenrolled', 'pending', 'revoked']),
  enrollmentDate: z.string().datetime().optional(),

  // Compliance status
  complianceStatus: z.enum(['compliant', 'non_compliant', 'unknown', 'not_assessed']).optional(),
  complianceCheckDate: z.string().datetime().optional(),
  complianceDetails: z.record(z.unknown()).optional(),

  // MDM-specific data (preserved for reference)
  mdmProvider: z.string(),
  rawPayload: z.record(z.unknown()).optional(),

  // Timestamp
  eventTimestamp: z.string().datetime(),
});

export type UEMEnrollment = z.infer<typeof UEMEnrollmentSchema>;
