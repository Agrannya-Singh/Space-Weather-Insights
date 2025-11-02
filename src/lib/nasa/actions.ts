'use server';

import { getCache, setCache } from "../firestoreCache";
import { DonkiEvent, EventType } from "@/lib/types";

const NASA_API_KEY = process.env.NASA_API_KEY;
if (!NASA_API_KEY) {
  throw new Error("NASA_API_KEY is not set in the environment variables.");
}

const API_URL = 'https://api.nasa.gov/DONKI';

interface FetchOptions {
  eventType: EventType;
  startDate: string;
  endDate: string;
  location?: string;
  catalog?: string;
}

export async function getSpaceWeatherData(options: FetchOptions): Promise<DonkiEvent[] | { error: string }> {
  const { eventType, startDate, endDate, location, catalog } = options;
  
  const cacheKey = `nasa-donki-${eventType}-${startDate}-${endDate}-${location || ''}-${catalog || ''}`;

  try {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log("Serving from cache:", cacheKey);
      return cachedData;
    }
  } catch (error) {
    console.error("Error reading from cache:", error);
  }

  console.log("Fetching from NASA API:", cacheKey);
  let url = `${API_URL}/${eventType}?startDate=${startDate}&endDate=${endDate}&api_key=${NASA_API_KEY}`;

  if (eventType === "IPS" && location && catalog) {
    url += `&location=${location}&catalog=${catalog}`;
  }

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Revalidate every hour
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`NASA API Error for ${eventType}: ${response.status} ${response.statusText}`, errorText);
        return { error: `Failed to fetch data from NASA API for ${eventType}. Status: ${response.status}` };
    }

    const data = await response.json();

    try {
      await setCache(cacheKey, data);
      console.log("Saved to cache:", cacheKey);
    } catch (error) {
      console.error("Error saving to cache:", error);
    }

    return data;
  } catch (error: any) {
      console.error("Network or parsing error:", error);
      return { error: "Failed to connect to the NASA API. Check your network connection." };
  }
}
