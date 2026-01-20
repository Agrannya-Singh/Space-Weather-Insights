import admin from 'firebase-admin';

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Fallback for build time or when env var is missing
    admin.initializeApp({
      projectId: 'demo-project'
    });
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
