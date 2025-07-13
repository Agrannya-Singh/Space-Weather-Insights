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
  prompt: `You are an expert space weather analyst. Please provide a concise summary of the following space weather events data:

  {{eventData}}
  
  Focus on key details, such as event types, dates, locations, and potential impacts.
`,
});

const generateEventSummaryFlow = ai.defineFlow(
  {
    name: 'generateEventSummaryFlow',
    inputSchema: GenerateEventSummaryInputSchema,
    outputSchema: GenerateEventSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
