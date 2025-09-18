'use server';

import { z } from 'zod';
import { EventType } from './types';

const API_KEY = process.env.NASA_API_KEY; // oops
const BASE_URL = 'https://api.nasa.gov/DONKI';

// Centralized mapping to avoid redundant conditional endpoint handling
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
    
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error for ${eventType}:`, errorText);
      throw new Error(`Failed to fetch data for ${eventType}. Status: ${response.status}`);
    }

    const data = await response.json();
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
