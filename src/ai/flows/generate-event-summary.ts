'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { analyzeDataset } from '@/lib/eda';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/server';
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
    decodedToken = await getAdminAuth().verifyIdToken(input.idToken);
  } catch (error) {
    throw new Error('Invalid authentication token. Please log in again.');
  }

  const userId = decodedToken.uid;
  const summaryUsageRef = getAdminDb().collection('summaryUsage').doc(userId);
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

  // Generate Summary Logic
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
  } catch (e) { console.error('EDA generation failed:', e); }

  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Google Generative AI API key is missing. Set GOOGLE_GENAI_API_KEY or GEMINI_API_KEY.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Provide a concise summary of the following space weather events in 200-300 words. 
Do NOT include any introductory or concluding remarks like "As a space weather specialist..." or "Here is my review...". Just provide the summary directly.
Use plain and simple English. 
Do NOT use Markdown formatting like bold stars (***), hashtags (#), or any other special characters. Use only plain text.

DATA:
${input.eventData}

EDA CONTEXT:
${edaSnippet}

Focus on: event types, dates, locations, intensities, and potential impacts based on the trends, distributions, and anomalies in the data.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    // Update daily summary count
    if (summaryUsageSnap.exists) {
      await summaryUsageRef.update({ summaryCount: FieldValue.increment(1), lastSummaryDate: new Date() });
    } else {
      await summaryUsageRef.set({ summaryCount: 1, lastSummaryDate: new Date() });
    }

    // Update permanent summary count
    const userRef = getAdminDb().collection('users').doc(userId);
    await userRef.set({ summaryCount: FieldValue.increment(1) }, { merge: true });

    return { summary };

  } catch (error) {
    console.error('AI Generation failed:', error);
    throw new Error('Failed to generate summary from AI provider.');
  }
}
