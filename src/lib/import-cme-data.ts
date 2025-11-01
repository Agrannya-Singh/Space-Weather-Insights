import { db } from './firebase';

const API_KEY = process.env.NEXT_PUBLIC_NASA_API_KEY || 'DEMO_KEY';
const DONKI_API_URL = 'https://api.nasa.gov/DONKI/CME';

async function fetchCMEData() {
  try {
    const response = await fetch(`${DONKI_API_URL}?api_key=${API_KEY}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching CME data:', error);
    return [];
  }
}

async function importCMEData() {
  const cmeData = await fetchCMEData();
  if (cmeData.length === 0) {
    console.log('No CME data to import.');
    return;
  }

  const cmeCollection = db.collection('CME');
  const batch = db.batch();

  for (const cme of cmeData) {
    const docRef = cmeCollection.doc(cme.activityID);
    batch.set(docRef, cme);
  }

  try {
    await batch.commit();
    console.log('Successfully imported CME data to Firestore.');
  } catch (error) {
    console.error('Error importing CME data to Firestore:', error);
  }
}

importCMEData();
