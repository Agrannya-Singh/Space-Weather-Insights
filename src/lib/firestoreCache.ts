
import { adminDb } from '@/lib/firebase/admin';

const cacheCollection = adminDb.collection('cache');

// Set a 12-hour Time-to-Live (TTL) for cache entries, in milliseconds.
const TTL = 12 * 60 * 60 * 1000;

/**
 * Retrieves a value from the Firestore cache.
 * Checks if the entry exists and if it has expired.
 *
 * @param {string} key The key for the cache entry.
 * @returns {Promise<any | null>} The cached value, or null if not found or expired.
 */
export async function getCache(key: string) {
  const docRef = cacheCollection.doc(key);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  if (!data) {
    return null;
  }

  const { timestamp, value } = data;
  const now = new Date().getTime();

  // Check if the cache entry has expired.
  if (now - timestamp > TTL) {
    // The entry is expired, so we delete it from the cache.
    await docRef.delete();
    return null;
  }

  return value;
}

/**
 * Stores a value in the Firestore cache.
 *
 * @param {string} key The key for the cache entry.
 * @param {any} value The value to be stored.
 */
export async function setCache(key: string, value: any) {
  const timestamp = new Date().getTime();
  await cacheCollection.doc(key).set({ value, timestamp });
}
