
'use server';

import { getCache, setCache } from '@/lib/firestoreCache';
import { adminDb } from '@/lib/firebase/server';


interface SpaceWeatherParams {
  eventType: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  catalog?: string;
}

export async function getSpaceWeatherData({ eventType, startDate, endDate, location, catalog }: SpaceWeatherParams) {
  const NASA_API_KEY = process.env.NASA_API_KEY;
  if (!NASA_API_KEY) {
    throw new Error('NASA_API_KEY is not set in the environment variables.');
  }

  const today = new Date().toISOString().split('T')[0];
  const sDate = startDate || today;
  const eDate = endDate || today;

  // Construct URL based on eventType
  let endpoint = 'FLR'; // Default
  if (eventType) endpoint = eventType;

  let url = `https://api.nasa.gov/DONKI/${endpoint}?startDate=${sDate}&endDate=${eDate}&api_key=${NASA_API_KEY}`;

  if (eventType === 'IPS') {
    if (location && location !== 'ALL') url += `&location=${location}`;
    if (catalog && catalog !== 'ALL') url += `&catalog=${catalog}`;
  }

  const cacheKey = `donki-${endpoint}-${sDate}-${eDate}-${location || 'all'}-${catalog || 'all'}`;

  // First, try to get the data from the cache.
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    console.log('Serving from cache');
    return cachedData;
  }

  // If not in the cache, fetch from the NASA API.
  console.log('Fetching from NASA API:', url.replace(NASA_API_KEY, 'HIDDEN'));
  const response = await fetch(url, { next: { revalidate: 43200 } }); // Revalidate every 12 hours
  if (!response.ok) {
    // Handle 404 or empty results gracefully if needed, or throw
    if (response.status === 404) return [];
    throw new Error(`Failed to fetch data from NASA API: ${response.statusText}`);
  }

  let data = await response.json();

  // Some endpoints return null or empty string on no data
  if (!data) data = [];

  // Store the new data in the cache.
  await setCache(cacheKey, data);

  return data;
}
