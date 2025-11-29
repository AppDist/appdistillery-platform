import { z } from 'zod';

export const LeadIntakeSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  source: z.enum(['website', 'referral', 'linkedin', 'other']).default('other'),
  problemDescription: z.string().min(10, 'Please describe the problem'),
  budgetRange: z.string().optional(),
  timeline: z.string().optional(),
});

export type LeadIntake = z.infer<typeof LeadIntakeSchema>;
