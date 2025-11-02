
'use server';

import {getCache, setCache} from '@/lib/firestoreCache';

const NASA_API_KEY = process.env.NASA_API_KEY;
if (!NASA_API_KEY) {
  throw new Error("NASA_API_KEY is not set in the environment variables.");
}

const API_URL = `https://api.nasa.gov/neo/rest/v1/feed?api_key=${NASA_API_KEY}`;

/**
 * Fetches data from the NASA API, using a cache to store and retrieve results.
 * This function is designed to be called from a Server Component.
 */
export async function getNeoData() {
  const cacheKey = 'neo-data';

  // First, try to get the data from the cache.
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    console.log('Serving from cache');
    return cachedData;
  }

  // If not in the cache, fetch from the NASA API.
  console.log('Fetching from NASA API');
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch data from NASA API: ${response.statusText}`);
  }

  const data = await response.json();

  // Store the new data in the cache.
  await setCache(cacheKey, data);

  return data;
}
