import { z } from 'zod';

export const ScopeResultSchema = z.object({
  summary: z.string().describe('2-3 sentence executive summary'),
  problemAnalysis: z.string().describe('Deeper analysis of the core problem'),
  risks: z.array(z.string()).describe('Key risks or concerns'),
  approach: z.string().describe('Recommended high-level approach'),
  questions: z.array(z.string()).describe('Clarifying questions for client'),
  complexity: z.enum(['low', 'medium', 'high']),
  estimatedWeeks: z.number().int().positive(),
  recommendedStack: z.array(z.string()).optional(),
});

export type ScopeResult = z.infer<typeof ScopeResultSchema>;
