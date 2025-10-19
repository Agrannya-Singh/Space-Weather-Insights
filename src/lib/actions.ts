 'use server';

import { z } from 'zod';
import { EventType } from './types';
import { getCache, setCache } from './mongoCache';

const API_KEY = process.env.NASA_API_KEY || 'R8ZoVAsKe3MhKM0vdsrOg5ppoy8xHSlbPHM4UI1A';
const BASE_URL = 'https://api.nasa.gov/DONKI';

// Endpoint mapping
const EVENT_TYPE_TO_ENDPOINT: Record<string, string> = {
  // Direct mappings (endpoint name is identical)
  GST: 'GST',
  IPS: 'IPS',
  FLR: 'FLR',
  SEP: 'SEP',
  MPC: 'MPC',
  RBE: 'RBE',
  HSS: 'HSS',
  CME: 'CME',
  // Special cases
  WSA: 'WSAEnlilSimulations',
};

const actionSchema = z.object({
  eventType: z.custom<EventType>(),
  startDate: z.string(),
  endDate: z.string(),
  location: z.string().optional(),
  catalog: z.string().optional(),
});

export async function getSpaceWeatherData(params: z.infer<typeof actionSchema>) {
  try {
    const validatedParams = actionSchema.parse(params);
    const { eventType, startDate, endDate, location, catalog } = validatedParams;

    const endpoint = EVENT_TYPE_TO_ENDPOINT[eventType] ?? eventType;
    
    const url = new URL(`${BASE_URL}/${endpoint}`);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('startDate', startDate);
    url.searchParams.append('endDate', endDate);

    if (eventType === 'IPS') {
      if (location && location !== 'ALL') url.searchParams.append('location', location);
      if (catalog && catalog !== 'ALL') url.searchParams.append('catalog', catalog);
    }
    const cacheKey = `donki:${endpoint}:${url.searchParams.toString()}`;

    // check cache
    try {
      const cached = await getCache(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (e) {
      // on cache error, continue
      console.warn('Cache read failed:', e);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error for ${eventType}:`, errorText);
      throw new Error(`Failed to fetch data for ${eventType}. Status: ${response.status}`);
    }

    const data = await response.json();

    // store in cache (uses configured TTL)
    try {
      await setCache(cacheKey, data);
    } catch (e) {
      console.warn('Cache write failed:', e);
    }
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
