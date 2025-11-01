'use server';

import { z } from 'zod';
import { EventType } from './types';
import { db } from './firebase';
import { createHash } from 'crypto';

const actionSchema = z.object({
  eventType: z.custom<EventType>(),
  startDate: z.string(),
  endDate: z.string(),
  location: z.string().optional(),
  catalog: z.string().optional(),
});

const generateCacheKey = (params: any) => {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(params));
  return hash.digest('hex');
};

export async function getSpaceWeatherData(params: z.infer<typeof actionSchema>) {
  try {
    const validatedParams = actionSchema.parse(params);
    const { eventType, startDate, endDate, location, catalog } = validatedParams;

    const cacheKey = generateCacheKey(validatedParams);
    const cacheRef = db.collection('cache').doc(cacheKey);

    const cacheDoc = await cacheRef.get();
    if (cacheDoc.exists) {
      const { data, timestamp } = cacheDoc.data() as { data: any[], timestamp: number };
      // Cache expires after 1 hour
      if (Date.now() - timestamp < 3600000) {
        console.log('Data retrieved from cache');
        return data;
      }
    }

    let collectionRef: FirebaseFirestore.CollectionReference | FirebaseFirestore.Query = db.collection(eventType);

    if (startDate) {
        collectionRef = collectionRef.where('startTime', '>=', startDate);
    }
    if (endDate) {
        collectionRef = collectionRef.where('startTime', '<=', endDate);
    }
    if (eventType === 'IPS' && location) {
        collectionRef = collectionRef.where('location', '==', location);
    }
    if (eventType === 'IPS' && catalog) {
        collectionRef = collectionRef.where('catalog', '==', catalog);
    }

    const snapshot = await collectionRef.get();
    const data = snapshot.docs.map(doc => doc.data());

    await cacheRef.set({
      data,
      timestamp: Date.now(),
    });
    console.log('Data written to cache');

    return data;
  } catch (error) {
    console.error('Error fetching space weather data:', error);
    if (error instanceof z.ZodError) {
        return { error: 'Invalid parameters provided.', details: error.issues };
    }
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { error: errorMessage };
  }
}
