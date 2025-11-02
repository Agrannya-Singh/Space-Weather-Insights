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
import { auth } from '@/lib/firebase/client';
import { firestore } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';

const GenerateEventSummaryInputSchema = z.object({
  eventData: z.string().describe('The JSON string of space weather events data from the DONKI API.'),
});
export type GenerateEventSummaryInput = z.infer<typeof GenerateEventSummaryInputSchema>;

const GenerateEventSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the space weather events.'),
});
export type GenerateEventSummaryOutput = z.infer<typeof GenerateEventSummaryOutputSchema>;

export async function generateEventSummary(input: GenerateEventSummaryInput): Promise<GenerateEventSummaryOutput> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('Please log in to access AI-powered features. This helps us ensure a high-quality experience for all users.');
    }

    const userId = user.uid;
    const summaryUsageRef = doc(firestore, 'summaryUsage', userId);
    const summaryUsageSnap = await getDoc(summaryUsageRef);

    if (summaryUsageSnap.exists()) {
        const summaryUsageData = summaryUsageSnap.data();
        const lastSummaryDate = summaryUsageData.lastSummaryDate.toDate();
        const now = new Date();

        if (lastSummaryDate.toDateString() === now.toDateString()) {
            if (summaryUsageData.summaryCount >= 10) {
                throw new Error('You have reached your daily limit of 10 summaries.');
            }
        } else {
            await setDoc(summaryUsageRef, { summaryCount: 0, lastSummaryDate: serverTimestamp() }, { merge: true });
        }
    }

  const summary = await generateEventSummaryFlow(input);

    // Update daily summary count
    if (summaryUsageSnap.exists()) {
        const summaryUsageData = summaryUsageSnap.data();
        await setDoc(summaryUsageRef, { summaryCount: summaryUsageData.summaryCount + 1, lastSummaryDate: serverTimestamp() }, { merge: true });
    } else {
        await setDoc(summaryUsageRef, { summaryCount: 1, lastSummaryDate: serverTimestamp() });
    }

    // Update permanent summary count in the users collection
    const userRef = doc(firestore, 'users', userId);
    await setDoc(userRef, { summaryCount: increment(1) }, { merge: true });

  return summary;
}

const prompt = ai.definePrompt({
  name: 'generateEventSummaryPrompt',
  input: {schema: GenerateEventSummaryInputSchema},
  output: {schema: GenerateEventSummaryOutputSchema},
  prompt: `You are an expert space weather analyst. Provide a concise summary of the following space weather events. Use the provided EDA context to highlight trends, distributions, and anomalies.\n\nDATA:\n{{eventData}}\n\nFocus on: event types, dates, locations, intensities, and potential impacts.\n`,
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
