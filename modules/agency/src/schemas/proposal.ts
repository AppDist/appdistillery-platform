import { z } from 'zod';

export const ProposalResultSchema = z.object({
  executiveSummary: z.string().describe('Compelling 2-paragraph summary'),
  scopePhases: z.array(z.object({
    name: z.string(),
    description: z.string(),
    deliverables: z.array(z.string()),
    weeks: z.number(),
  })),
  pricing: z.object({
    model: z.enum(['fixed', 'hourly', 'retainer']),
    total: z.number(),
    breakdown: z.array(z.object({
      item: z.string(),
      amount: z.number(),
    })),
  }),
  timeline: z.string(),
  assumptions: z.array(z.string()),
  outOfScope: z.array(z.string()),
});

export type ProposalResult = z.infer<typeof ProposalResultSchema>;
