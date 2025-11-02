
'use server';

import { getCache, setCache } from '@/lib/firestoreCache';
import { adminDb } from '@/lib/firebase/server';

const NASA_API_KEY = process.env.NASA_API_KEY;
if (!NASA_API_KEY) {
  throw new Error('NASA_API_KEY is not set in the environment variables.');
}

/**
 * Fetches data from the NASA API, using a cache to store and retrieve results.
 * This function is designed to be called from a Server Component.
 */
export async function getSpaceWeatherData(startDate?: string, endDate?: string) {
    const today = new Date().toISOString().split('T')[0];
    const sDate = startDate || today;
    const eDate = endDate || today;

    const API_URL = `https://api.nasa.gov/DONKI/FLR?startDate=${sDate}&endDate=${eDate}&api_key=${NASA_API_KEY}`;
    const cacheKey = `donki-flr-${sDate}-${eDate}`;

  // First, try to get the data from the cache.
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    console.log('Serving from cache');
    return cachedData;
  }

  // If not in the cache, fetch from the NASA API.
  console.log('Fetching from NASA API');
  const response = await fetch(API_URL, { next: { revalidate: 43200 } }); // Revalidate every 12 hours
  if (!response.ok) {
    throw new Error(`Failed to fetch data from NASA API: ${response.statusText}`);
  }

  const data = await response.json();

  // Store the new data in the cache.
  await setCache(cacheKey, data);

  return data;
}
