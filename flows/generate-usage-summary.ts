'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating AI-powered summaries and trend analyses
 * of library visitor data, assisting administrators in understanding usage patterns.
 *
 * - generateUsageSummary - A function that triggers the AI analysis of visitor logs.
 * - GenerateUsageSummaryInput - The input type for the generateUsageSummary function.
 * - GenerateUsageSummaryOutput - The return type for the generateUsageSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VisitLogSchema = z.object({
  userId: z.string(),
  timestamp: z.string().describe('ISO 8601 timestamp of the visit.'),
  purposeOfVisit: z.string().describe('Purpose of the visit (e.g., Study, Research, Borrowing).'),
  college: z.string().describe('College or Department of the visitor.'),
});

const GenerateUsageSummaryInputSchema = z.object({
  visitorLogs: z.array(VisitLogSchema).describe('An array of visitor log entries.'),
});
export type GenerateUsageSummaryInput = z.infer<typeof GenerateUsageSummaryInputSchema>;

const GenerateUsageSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the overall library usage patterns.'),
  keyTrends: z.array(z.string()).describe('A list of 3-5 key trends identified from the visitor data.'),
  suggestions: z.array(z.string()).describe('3-5 actionable suggestions based on the identified trends to improve library services or resource allocation.'),
});
export type GenerateUsageSummaryOutput = z.infer<typeof GenerateUsageSummaryOutputSchema>;

export async function generateUsageSummary(input: GenerateUsageSummaryInput): Promise<GenerateUsageSummaryOutput> {
  return generateUsageSummaryFlow(input);
}

const generateUsageSummaryPrompt = ai.definePrompt({
  name: 'generateUsageSummaryPrompt',
  input: { schema: z.object({ visitorLogsJson: z.string() }) },
  output: { schema: GenerateUsageSummaryOutputSchema },
  prompt: `You are a library usage analyst. Your task is to analyze the provided visitor logs, identify patterns, key trends, and offer actionable suggestions for library management.

The visitor data is provided below as a JSON array of objects. Each object represents a single visit log entry and has the following structure:
- "userId": a string identifier for the user.
- "timestamp": an ISO 8601 string representing the time of the visit.
- "purposeOfVisit": a string describing the purpose of the visit (e.g., "Study", "Research", "Borrowing").
- "college": a string indicating the college or department of the visitor.

Here are the visitor logs:
' + '```json\n{{{visitorLogsJson}}}\n```' + '

Based on this data, please provide:
1.  A concise summary of overall library usage.
2.  A list of 3-5 key trends you can identify (e.g., peak hours, popular colleges, common purposes).
3.  3-5 actionable suggestions based on these trends to improve library services, resource allocation, or scheduling.`,
});

const generateUsageSummaryFlow = ai.defineFlow(
  {
    name: 'generateUsageSummaryFlow',
    inputSchema: GenerateUsageSummaryInputSchema,
    outputSchema: GenerateUsageSummaryOutputSchema,
  },
  async (input) => {
    const visitorLogsJson = JSON.stringify(input.visitorLogs);
    const { output } = await generateUsageSummaryPrompt({ visitorLogsJson });
    return output!;
  }
);
