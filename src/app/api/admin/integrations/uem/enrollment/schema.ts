import { z } from 'zod';

export const EnrollmentStateSchema = z.enum(['enrolled', 'not_enrolled', 'unknown']);

export const UEMEnrollmentRequestSchema = z.object({
  deviceId: z.string().min(1, 'deviceId is required'),
  userId: z.string().min(1, 'userId is required').optional(),
  enrollmentStatus: EnrollmentStateSchema.optional(),
  source: z.string().min(1).optional(),
  observedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UEMEnrollmentRequest = z.infer<typeof UEMEnrollmentRequestSchema>;
