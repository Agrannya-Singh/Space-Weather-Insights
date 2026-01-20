'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { analyzeDataset } from '@/lib/eda';
import { adminAuth, adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

const GenerateEventSummaryInputSchema = z.object({
  eventData: z.string().describe('The JSON string of space weather events data from the DONKI API.'),
  eventType: z.string().describe('The type of event being analyzed (e.g. FLR, GST).'),
  idToken: z.string().describe('The Firebase ID token of the user.'),
});
export type GenerateEventSummaryInput = z.infer<typeof GenerateEventSummaryInputSchema>;

const GenerateEventSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the space weather events.'),
});
export type GenerateEventSummaryOutput = z.infer<typeof GenerateEventSummaryOutputSchema>;

export async function generateEventSummary(input: GenerateEventSummaryInput): Promise<GenerateEventSummaryOutput> {
  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(input.idToken);
  } catch (error) {
    throw new Error('Invalid authentication token. Please log in again.');
  }

  const userId = decodedToken.uid;
  const summaryUsageRef = adminDb.collection('summaryUsage').doc(userId);
  const summaryUsageSnap = await summaryUsageRef.get();

  if (summaryUsageSnap.exists) {
    const summaryUsageData = summaryUsageSnap.data()!;
    const lastSummaryDate = summaryUsageData.lastSummaryDate.toDate();
    const now = new Date();

    if (lastSummaryDate.toDateString() === now.toDateString()) {
      if (summaryUsageData.summaryCount >= 10) {
        throw new Error('You have reached your daily limit of 10 summaries.');
      }
    } else {
      await summaryUsageRef.set({ summaryCount: 0, lastSummaryDate: new Date() }, { merge: true });
    }
  }

  const summary = await generateEventSummaryFlow(input);

  // Update daily summary count
  if (summaryUsageSnap.exists) {
    await summaryUsageRef.update({ summaryCount: FieldValue.increment(1), lastSummaryDate: new Date() });
  } else {
    await summaryUsageRef.set({ summaryCount: 1, lastSummaryDate: new Date() });
  }

  // Update permanent summary count in the users collection
  const userRef = adminDb.collection('users').doc(userId);
  await userRef.set({ summaryCount: FieldValue.increment(1) }, { merge: true });

  return summary;
}

const prompt = ai.definePrompt({
  name: 'generateEventSummaryPrompt',
  input: { schema: GenerateEventSummaryInputSchema.omit({ idToken: true }) },
  output: { schema: GenerateEventSummaryOutputSchema },
  prompt: `You are an expert space weather analyst. Provide a concise summary of the following space weather events. Use the provided EDA context to highlight trends, distributions, and anomalies.\n\nDATA:\n{{eventData}}\n\nFocus on: event types, dates, locations, intensities, and potential impacts.\n`,
});

const generateEventSummaryFlow = ai.defineFlow(
  {
    name: 'generateEventSummaryFlow',
    inputSchema: GenerateEventSummaryInputSchema.omit({ idToken: true }),
    outputSchema: GenerateEventSummaryOutputSchema,
  },
  async (input) => {
    // Build lightweight EDA context for the AI (top-level stats only)
    let edaSnippet = '';
    try {
      const parsed = JSON.parse(input.eventData);
      if (Array.isArray(parsed)) {
        const eda = analyzeDataset(parsed.slice(0, 200), input.eventType);
        const numeric = eda.fields
          .filter((f) => !!f.numeric)
          .slice(0, 3)
          .map((f) => ({
            field: f.field,
            min: f.numeric!.min,
            max: f.numeric!.max,
            mean: f.numeric!.mean,
          }));
        const categorical = eda.fields
          .filter((f) => !!f.categorical)
          .slice(0, 2)
          .map((f) => ({
            field: f.field,
            top: (f.categorical ?? []).slice(0, 5),
          }));
        edaSnippet = `EDA rows=${eda.rowCount
          }, fields=${eda.fields.length
          }, timeField=${eda.detectedTimeField
          }; numeric=${JSON.stringify(numeric)}, categorical=${JSON.stringify(
            categorical
          )}`;
      }
    } catch { }

    const { output } = await prompt({
      eventData: `${input.eventData}\n\nEDA:${edaSnippet}`,
      eventType: input.eventType,
    });
    return output!;
  }
);
