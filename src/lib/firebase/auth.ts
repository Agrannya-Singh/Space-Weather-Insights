import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, firestore } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(firestore, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // New user, create a document for them
      await setDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        summaryCount: 0,
      });
    }

    console.log(user);
  } catch (error) {
    // Handle Errors here.
    console.error(error);
  }
};
