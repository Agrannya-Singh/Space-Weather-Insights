'use server';

/**
 * @fileOverview Generates a concise summary of space weather events from the DONKI API.
 *
 * - generateEventSummary - A function that generates the event summary.
 * - GenerateEventSummaryInput - The input type for the generateEventSummary function.
 * - GenerateEventSummaryOutput - The return type for the generateEventSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { analyzeDataset } from '@/lib/eda';

const GenerateEventSummaryInputSchema = z.object({
  eventData: z.string().describe('The JSON string of space weather events data from the DONKI API.'),
});
export type GenerateEventSummaryInput = z.infer<typeof GenerateEventSummaryInputSchema>;

const GenerateEventSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the space weather events.'),
});
export type GenerateEventSummaryOutput = z.infer<typeof GenerateEventSummaryOutputSchema>;

export async function generateEventSummary(input: GenerateEventSummaryInput): Promise<GenerateEventSummaryOutput> {
  return generateEventSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEventSummaryPrompt',
  input: {schema: GenerateEventSummaryInputSchema},
  output: {schema: GenerateEventSummaryOutputSchema},
  prompt: `You are an expert space weather analyst. Provide a concise summary of the following space weather events. Use the provided EDA context to highlight trends, distributions, and anomalies.

DATA:
{{eventData}}

Focus on: event types, dates, locations, intensities, and potential impacts.
`,
});

const generateEventSummaryFlow = ai.defineFlow(
  {
    name: 'generateEventSummaryFlow',
    inputSchema: GenerateEventSummaryInputSchema,
    outputSchema: GenerateEventSummaryOutputSchema,
  },
  async input => {
    // Build lightweight EDA context for the AI (top-level stats only)
    let edaSnippet = '';
    try {
      const parsed = JSON.parse(input.eventData);
      if (Array.isArray(parsed)) {
        const eda = analyzeDataset(parsed.slice(0, 200));
        const numeric = eda.fields.filter(f => !!f.numeric).slice(0, 3).map(f => ({ field: f.field, min: f.numeric!.min, max: f.numeric!.max, mean: f.numeric!.mean }));
        const categorical = eda.fields.filter(f => !!f.categorical).slice(0, 2).map(f => ({ field: f.field, top: (f.categorical ?? []).slice(0, 5) }));
        edaSnippet = `EDA rows=${eda.rowCount}, fields=${eda.fields.length}, timeField=${eda.detectedTimeField}; numeric=${JSON.stringify(numeric)}, categorical=${JSON.stringify(categorical)}`;
      }
    } catch {}

    const {output} = await prompt({ eventData: `${input.eventData}\n\nEDA:${edaSnippet}` });
    return output!;
  }
);
