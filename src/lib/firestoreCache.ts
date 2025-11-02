
import * as admin from 'firebase-admin';

// Initialize the Firebase Admin SDK
// This is safe to run multiple times; it ensures initialization only happens once.
if (!admin.apps.length) {
  try {
    // The service account key is stored in an environment variable
    // as a JSON string. This is a secure way to handle credentials.
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (e) {
    console.error('Firebase Admin SDK initialization failed.', e);
  }
}

const db = admin.firestore();
const cacheCollection = db.collection('cache');

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
