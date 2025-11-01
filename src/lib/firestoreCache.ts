
import * as admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG!)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();
const cacheCollection = db.collection('cache');

const TTL = 20 * 60 * 1000; // 20 minutes in milliseconds

export async function getCache(key: string) {
  const doc = await cacheCollection.doc(key).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  const now = new Date().getTime();

  if (now - data!.timestamp > TTL) {
    return null;
  }

  return data!.value;
}

export async function setCache(key: string, value: any) {
  const timestamp = new Date().getTime();
  await cacheCollection.doc(key).set({ value, timestamp });
}
